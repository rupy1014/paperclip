import { and, eq, desc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { learningEvents, agents } from "@paperclipai/db";
import type { LearningEventStatus } from "@paperclipai/shared";
import { notFound, unprocessable } from "../errors.js";
import { issueService } from "./issues.js";

const VALID_TRANSITIONS: Record<LearningEventStatus, LearningEventStatus[]> = {
  pending: ["retro_created", "propagated", "dismissed"],
  retro_created: ["propagated", "dismissed"],
  propagated: [],
  dismissed: [],
};

export function learningLoopService(db: Db) {
  const svc = {
    async create(
      companyId: string,
      input: {
        triggerType: string;
        packetId?: string | null;
        sourceAgentId?: string | null;
        targetAgentIds?: string[] | null;
        expectedOutcome?: string | null;
        actualOutcome?: string | null;
        deviationMagnitude?: string | null;
        constraintText?: string | null;
      },
    ) {
      const [row] = await db
        .insert(learningEvents)
        .values({
          companyId,
          triggerType: input.triggerType,
          packetId: input.packetId ?? null,
          sourceAgentId: input.sourceAgentId ?? null,
          targetAgentIds: input.targetAgentIds ?? null,
          expectedOutcome: input.expectedOutcome ?? null,
          actualOutcome: input.actualOutcome ?? null,
          deviationMagnitude: input.deviationMagnitude ?? null,
          constraintText: input.constraintText ?? null,
        })
        .returning();
      return row;
    },

    async getById(id: string) {
      const [row] = await db
        .select()
        .from(learningEvents)
        .where(eq(learningEvents.id, id));
      return row ?? null;
    },

    async list(
      companyId: string,
      filters?: { status?: string; triggerType?: string; packetId?: string },
    ) {
      const conditions = [eq(learningEvents.companyId, companyId)];
      if (filters?.status) conditions.push(eq(learningEvents.status, filters.status));
      if (filters?.triggerType) conditions.push(eq(learningEvents.triggerType, filters.triggerType));
      if (filters?.packetId) conditions.push(eq(learningEvents.packetId, filters.packetId));

      return db
        .select()
        .from(learningEvents)
        .where(and(...conditions))
        .orderBy(desc(learningEvents.createdAt));
    },

    async transition(id: string, newStatus: LearningEventStatus) {
      const existing = await db.select().from(learningEvents).where(eq(learningEvents.id, id));
      if (!existing[0]) throw notFound("Learning event not found");

      const allowed = VALID_TRANSITIONS[existing[0].status as LearningEventStatus] ?? [];
      if (!allowed.includes(newStatus)) {
        throw unprocessable(
          `Cannot transition from "${existing[0].status}" to "${newStatus}"`,
        );
      }

      const [updated] = await db
        .update(learningEvents)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(learningEvents.id, id))
        .returning();
      return updated;
    },

    async linkRetroIssue(id: string, retroIssueId: string) {
      const existing = await db.select().from(learningEvents).where(eq(learningEvents.id, id));
      if (!existing[0]) throw notFound("Learning event not found");

      const [updated] = await db
        .update(learningEvents)
        .set({
          retroIssueId,
          status: "retro_created",
          updatedAt: new Date(),
        })
        .where(eq(learningEvents.id, id))
        .returning();
      return updated;
    },

    /**
     * Detect deviation between expected and actual metrics.
     * If deviation exceeds threshold, auto-creates a learning event.
     * Returns the created event or null if within threshold.
     */
    async detectDeviation(
      companyId: string,
      packetId: string,
      metrics: { expected: number; actual: number; metric: string },
      threshold = 0.3,
    ) {
      const denominator = Math.max(Math.abs(metrics.expected), 1);
      const delta = Math.abs(metrics.actual - metrics.expected) / denominator;
      if (delta <= threshold) return null;

      const magnitude = delta >= 1.0 ? "major" : delta >= 0.5 ? "significant" : "minor";
      return svc.create(companyId, {
        triggerType: "deviation_detected",
        packetId,
        expectedOutcome: String(metrics.expected),
        actualOutcome: String(metrics.actual),
        deviationMagnitude: magnitude,
        constraintText: `${metrics.metric}: expected ${metrics.expected}, actual ${metrics.actual} (${(delta * 100).toFixed(0)}% deviation)`,
      });
    },

    /**
     * Auto-generate a retrospective issue from a learning event.
     * Creates an issue via issueService and links it to the learning event.
     */
    async createRetroIssue(learningEventId: string) {
      const event = await svc.getById(learningEventId);
      if (!event) throw notFound("Learning event not found");

      const issueSvc = issueService(db);
      const priority =
        event.deviationMagnitude === "major"
          ? "urgent"
          : event.deviationMagnitude === "significant"
            ? "high"
            : "medium";

      const issue = await issueSvc.create(event.companyId, {
        title: `[Retro] ${event.triggerType}: ${event.expectedOutcome ?? "N/A"} → ${event.actualOutcome ?? "N/A"}`,
        description:
          `**Auto-generated retrospective**\n\n` +
          `- **Trigger**: ${event.triggerType}\n` +
          `- **Expected**: ${event.expectedOutcome ?? "N/A"}\n` +
          `- **Actual**: ${event.actualOutcome ?? "N/A"}\n` +
          `- **Magnitude**: ${event.deviationMagnitude ?? "N/A"}\n` +
          `- **Constraint**: ${event.constraintText ?? "N/A"}`,
        status: "backlog",
        priority,
      });

      await svc.linkRetroIssue(learningEventId, issue.id);
      return issue;
    },

    /**
     * Propagate a constraint from a learning event to target agents.
     * Appends constraintText to each agent's metadata.constraints array.
     */
    async propagateConstraint(learningEventId: string, targetAgentIds: string[]) {
      const event = await svc.getById(learningEventId);
      if (!event || !event.constraintText) {
        throw unprocessable("No constraint text to propagate");
      }

      for (const agentId of targetAgentIds) {
        const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
        if (!agent) continue;

        const meta = (agent.metadata as Record<string, unknown>) ?? {};
        const constraints = Array.isArray(meta.constraints) ? [...meta.constraints] : [];
        constraints.push(event.constraintText);

        await db
          .update(agents)
          .set({
            metadata: { ...meta, constraints },
            updatedAt: new Date(),
          })
          .where(eq(agents.id, agentId));
      }

      // Update target agent IDs on the event and transition to propagated
      await db
        .update(learningEvents)
        .set({ targetAgentIds: targetAgentIds, updatedAt: new Date() })
        .where(eq(learningEvents.id, learningEventId));

      return svc.transition(learningEventId, "propagated");
    },
  };

  return svc;
}
