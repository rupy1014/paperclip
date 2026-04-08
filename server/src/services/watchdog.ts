import { and, eq, desc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { watchdogTargets } from "@paperclipai/db";
import type { WatchdogCheckResult } from "@paperclipai/shared";
import { notFound } from "../errors.js";
import { gatePolicyService } from "./gate-policies.js";
import { learningLoopService } from "./learning-loop.js";
import { issueService } from "./issues.js";
import { decisionPackageService } from "./decision-packages.js";
import { routineService } from "./routines.js";
import { logActivity } from "./activity-log.js";

export function watchdogService(db: Db) {
  const gates = gatePolicyService(db);
  const learning = learningLoopService(db);
  const issueSvc = issueService(db);
  const decisionSvc = decisionPackageService(db);
  const routineSvc = routineService(db);

  const svc = {
    // ── CRUD ──

    async create(
      companyId: string,
      input: {
        projectId?: string | null;
        agentId: string;
        name: string;
        serviceType: string;
        serviceConfig: Record<string, unknown>;
        status?: string;
      },
    ) {
      const [row] = await db
        .insert(watchdogTargets)
        .values({
          companyId,
          projectId: input.projectId ?? null,
          agentId: input.agentId,
          name: input.name,
          serviceType: input.serviceType,
          serviceConfig: input.serviceConfig as never,
          status: input.status ?? "active",
        })
        .returning();
      return row;
    },

    async getById(id: string) {
      const [row] = await db
        .select()
        .from(watchdogTargets)
        .where(eq(watchdogTargets.id, id));
      return row ?? null;
    },

    async list(companyId: string, filters?: { status?: string; agentId?: string }) {
      const conditions = [eq(watchdogTargets.companyId, companyId)];
      if (filters?.status) conditions.push(eq(watchdogTargets.status, filters.status));
      if (filters?.agentId) conditions.push(eq(watchdogTargets.agentId, filters.agentId));

      return db
        .select()
        .from(watchdogTargets)
        .where(and(...conditions))
        .orderBy(desc(watchdogTargets.createdAt));
    },

    async update(
      id: string,
      patch: Partial<{
        name: string;
        serviceType: string;
        serviceConfig: Record<string, unknown>;
        status: string;
        projectId: string | null;
      }>,
    ) {
      const existing = await svc.getById(id);
      if (!existing) throw notFound("Watchdog target not found");

      const [updated] = await db
        .update(watchdogTargets)
        .set({ ...patch, updatedAt: new Date() } as never)
        .where(eq(watchdogTargets.id, id))
        .returning();
      return updated;
    },

    async remove(id: string) {
      const existing = await svc.getById(id);
      if (!existing) throw notFound("Watchdog target not found");
      await db.delete(watchdogTargets).where(eq(watchdogTargets.id, id));
    },

    // ── Check result reporting ──

    async reportCheck(targetId: string, result: WatchdogCheckResult) {
      const target = await svc.getById(targetId);
      if (!target) throw notFound("Watchdog target not found");

      if (result.status === "healthy") {
        await svc.recordHealthy(targetId);
        return { action: "none", target };
      }

      return svc.handleAlert(targetId, result);
    },

    // ── Escalation logic ──

    async handleAlert(targetId: string, checkResult: WatchdogCheckResult) {
      const target = await svc.getById(targetId);
      if (!target) throw notFound("Watchdog target not found");

      const failures = await svc.incrementFailures(targetId);

      // Record incident timestamp
      await db
        .update(watchdogTargets)
        .set({ lastIncidentAt: new Date(), updatedAt: new Date() })
        .where(eq(watchdogTargets.id, targetId));

      // Create learning event for every alert
      const learningEvent = await learning.create(target.companyId, {
        triggerType: "watchdog_alert",
        sourceAgentId: target.agentId,
        expectedOutcome: "healthy",
        actualOutcome: checkResult.status,
        deviationMagnitude: checkResult.status === "critical" ? "major" : "minor",
        constraintText: `[${target.name}] ${checkResult.checkType}: ${checkResult.details}`,
      });

      // L1: low failure count + health check → auto-restart
      if (failures <= 2 && checkResult.checkType === "health") {
        return svc.executeL1Recovery(targetId, learningEvent.id);
      }

      // L2: moderate failures or stall/error-rate → investigation issue
      if (failures <= 4) {
        return svc.escalateToL2(targetId, checkResult, learningEvent.id);
      }

      // L3: persistent failures → decision package
      return svc.escalateToL3(targetId, checkResult, learningEvent.id);
    },

    // ── Recovery levels ──

    async executeL1Recovery(targetId: string, learningEventId: string) {
      const target = await svc.getById(targetId);
      if (!target) throw notFound("Watchdog target not found");

      // Check advisory gate
      const gateResult = await gates.checkGates(
        target.companyId,
        "restart_external_service",
        target.projectId ? { scopeType: "project", scopeId: target.projectId } : undefined,
      );

      // Create restart issue for the watchdog agent
      const config = target.serviceConfig as unknown as Record<string, unknown>;
      const issue = await issueSvc.create(target.companyId, {
        title: `[Watchdog L1] Restart ${target.name}`,
        description:
          `**Auto-restart triggered by watchdog**\n\n` +
          `Service: ${target.name} (${target.serviceType})\n` +
          `Command: \`${config.restartCommand ?? "N/A"}\`\n` +
          `CWD: ${config.cwd ?? "N/A"}\n\n` +
          `After restart, verify the process is healthy and report back via:\n` +
          `POST /watchdog-targets/${targetId}/report { checkType: "health", status: "healthy", details: "..." }`,
        status: "todo",
        priority: "high",
        assigneeAgentId: target.agentId,
      });

      await db
        .update(watchdogTargets)
        .set({
          currentRecoveryLevel: "L1",
          lastRecoveryAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(watchdogTargets.id, targetId));

      return {
        action: "L1_restart",
        issueId: issue.id,
        learningEventId,
        gateBlocked: gateResult.some((g) => g.mode === "blocking"),
      };
    },

    async escalateToL2(
      targetId: string,
      checkResult: WatchdogCheckResult,
      learningEventId: string,
    ) {
      const target = await svc.getById(targetId);
      if (!target) throw notFound("Watchdog target not found");

      // Check blocking gate for deploy
      const gateResult = await gates.checkGates(
        target.companyId,
        "deploy",
        target.projectId ? { scopeType: "project", scopeId: target.projectId } : undefined,
      );

      const config = target.serviceConfig as unknown as Record<string, unknown>;
      const logPaths = Array.isArray(config.logPaths) ? config.logPaths.join(", ") : "N/A";

      // Create investigation issue
      const issue = await issueSvc.create(target.companyId, {
        title: `[Watchdog L2] Investigate ${target.name} — ${checkResult.checkType}`,
        description:
          `**Investigation required — repeated failures or anomaly detected**\n\n` +
          `Service: ${target.name} (${target.serviceType})\n` +
          `Check type: ${checkResult.checkType}\n` +
          `Status: ${checkResult.status}\n` +
          `Details: ${checkResult.details}\n` +
          `Consecutive failures: ${target.consecutiveFailures + 1}\n\n` +
          `**Steps:**\n` +
          `1. Analyze recent logs at: ${logPaths}\n` +
          `2. Identify root cause (code bug, resource issue, external dependency)\n` +
          `3. If code fix needed, modify files in ${config.cwd ?? "N/A"}\n` +
          `4. Test the fix locally\n` +
          `5. Restart the service: \`${config.restartCommand ?? "N/A"}\`\n` +
          `6. Report healthy via POST /watchdog-targets/${targetId}/report\n\n` +
          `**Gate policy**: Deploy gate is ${gateResult.some((g) => g.mode === "blocking") ? "BLOCKING — CEO approval required" : "advisory"}`,
        status: "todo",
        priority: "urgent",
        assigneeAgentId: target.agentId,
      });

      // Create retro issue linked to learning event
      await learning.createRetroIssue(learningEventId);

      await db
        .update(watchdogTargets)
        .set({
          currentRecoveryLevel: "L2",
          lastRecoveryAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(watchdogTargets.id, targetId));

      return {
        action: "L2_investigation",
        issueId: issue.id,
        learningEventId,
        gateBlocked: gateResult.some((g) => g.mode === "blocking"),
      };
    },

    async escalateToL3(
      targetId: string,
      checkResult: WatchdogCheckResult,
      learningEventId: string,
    ) {
      const target = await svc.getById(targetId);
      if (!target) throw notFound("Watchdog target not found");

      // Check blocking gate for strategy change
      await gates.checkGates(
        target.companyId,
        "strategy_change",
        target.projectId ? { scopeType: "project", scopeId: target.projectId } : undefined,
      );

      // Create decision package — need a bundle first, but for L3 we create
      // a retro issue and link the learning event, then flag for CEO attention.
      await learning.createRetroIssue(learningEventId);

      // Create a high-priority issue summarizing the escalation
      const issue = await issueSvc.create(target.companyId, {
        title: `[Watchdog L3] Escalation — ${target.name} persistent failure`,
        description:
          `**CEO decision required — persistent service failure**\n\n` +
          `Service: ${target.name}\n` +
          `Consecutive failures: ${target.consecutiveFailures + 1}\n` +
          `Latest check: ${checkResult.checkType} → ${checkResult.status}\n` +
          `Details: ${checkResult.details}\n\n` +
          `**Options to consider:**\n` +
          `- A: Wait for external dependency to recover\n` +
          `- B: Implement fallback/retry logic\n` +
          `- C: Switch to alternative provider/approach\n\n` +
          `A decision package should be created to formalize the decision.`,
        status: "todo",
        priority: "urgent",
      });

      await db
        .update(watchdogTargets)
        .set({
          currentRecoveryLevel: "L3",
          lastRecoveryAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(watchdogTargets.id, targetId));

      return {
        action: "L3_escalation",
        issueId: issue.id,
        learningEventId,
      };
    },

    // ── State management ──

    async recordHealthy(targetId: string) {
      await db
        .update(watchdogTargets)
        .set({
          lastHealthyAt: new Date(),
          consecutiveFailures: 0,
          currentRecoveryLevel: "none",
          updatedAt: new Date(),
        })
        .where(eq(watchdogTargets.id, targetId));
    },

    async incrementFailures(targetId: string): Promise<number> {
      const target = await svc.getById(targetId);
      if (!target) throw notFound("Watchdog target not found");

      const newCount = target.consecutiveFailures + 1;
      await db
        .update(watchdogTargets)
        .set({ consecutiveFailures: newCount, updatedAt: new Date() })
        .where(eq(watchdogTargets.id, targetId));
      return newCount;
    },

    async resetFailures(targetId: string) {
      await db
        .update(watchdogTargets)
        .set({ consecutiveFailures: 0, updatedAt: new Date() })
        .where(eq(watchdogTargets.id, targetId));
    },

    // ── Auto-create watchdog routines ──

    async createWatchdogRoutines(
      companyId: string,
      target: { id: string; name: string; agentId: string; projectId: string | null; serviceConfig: Record<string, unknown> },
      actor: { agentId?: string | null; userId?: string | null },
    ) {
      if (!target.projectId) return [];

      const config = target.serviceConfig;
      const routines = [];

      // Health check routine (every 3 min)
      const healthRoutine = await routineSvc.create(
        companyId,
        {
          projectId: target.projectId,
          title: `${target.name}-health`,
          description:
            `Check if ${target.name} process is alive.\n\n` +
            `1. Check PID file: ${config.pidFile ?? "N/A"}\n` +
            `2. Run: ${config.healthCheckCommand ?? `pgrep -f ${target.name}`}\n` +
            `3. If process dead, report critical via POST /companies/{{companyId}}/watchdog-targets/${target.id}/report\n` +
            `4. If alive, report healthy.\n\n` +
            `Watchdog target ID: ${target.id}`,
          assigneeAgentId: target.agentId,
          priority: "high",
          status: "active",
          concurrencyPolicy: "skip_if_active",
          catchUpPolicy: "skip_missed",
          variables: [],
        },
        actor,
      );
      await routineSvc.createTrigger(
        healthRoutine.id,
        {
          kind: "schedule",
          enabled: true,
          cronExpression: "*/3 * * * *",
          timezone: "Asia/Seoul",
        },
        actor,
      );
      routines.push(healthRoutine);

      // Stall detection routine (every 10 min)
      if (config.heartbeatFile) {
        const stallRoutine = await routineSvc.create(
          companyId,
          {
            projectId: target.projectId,
            title: `${target.name}-stall`,
            description:
              `Check if ${target.name} is stalled.\n\n` +
              `1. Read heartbeat file: ${config.heartbeatFile}\n` +
              `2. Compare timestamp against threshold: ${config.stallThresholdMinutes ?? 10} minutes\n` +
              `3. If stale, report critical with checkType "stall"\n` +
              `4. If fresh, report healthy.\n\n` +
              `Watchdog target ID: ${target.id}`,
            assigneeAgentId: target.agentId,
            priority: "medium",
            status: "active",
            concurrencyPolicy: "skip_if_active",
            catchUpPolicy: "skip_missed",
            variables: [],
          },
          actor,
        );
        await routineSvc.createTrigger(
          stallRoutine.id,
          {
            kind: "schedule",
            enabled: true,
            cronExpression: "*/10 * * * *",
            timezone: "Asia/Seoul",
          },
          actor,
        );
        routines.push(stallRoutine);
      }

      // Error rate monitoring routine (every 30 min)
      if (config.logPaths && Array.isArray(config.logPaths) && config.logPaths.length > 0) {
        const errorRoutine = await routineSvc.create(
          companyId,
          {
            projectId: target.projectId,
            title: `${target.name}-error-rate`,
            description:
              `Monitor ${target.name} error rate.\n\n` +
              `1. Parse recent logs: ${(config.logPaths as string[]).join(", ")}\n` +
              `2. Count errors in last ${config.errorRateWindowMinutes ?? 30} minutes\n` +
              `3. If error count exceeds ${config.errorRateThreshold ?? 5}, report critical with checkType "error_rate"\n` +
              `4. Otherwise report healthy.\n\n` +
              `Watchdog target ID: ${target.id}`,
            assigneeAgentId: target.agentId,
            priority: "medium",
            status: "active",
            concurrencyPolicy: "skip_if_active",
            catchUpPolicy: "skip_missed",
            variables: [],
          },
          actor,
        );
        await routineSvc.createTrigger(
          errorRoutine.id,
          {
            kind: "schedule",
            enabled: true,
            cronExpression: "*/30 * * * *",
            timezone: "Asia/Seoul",
          },
          actor,
        );
        routines.push(errorRoutine);
      }

      return routines;
    },
  };

  return svc;
}
