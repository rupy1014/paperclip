import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { createWatchdogTargetSchema, updateWatchdogTargetSchema, reportCheckResultSchema } from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { watchdogService, learningLoopService, logActivity } from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";

export function watchdogRoutes(db: Db) {
  const router = Router();
  const svc = watchdogService(db);
  const learningSvc = learningLoopService(db);

  // List watchdog targets for a company
  router.get("/companies/:companyId/watchdog-targets", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { status, agentId } = req.query as Record<string, string | undefined>;
    const result = await svc.list(companyId, { status, agentId });
    res.json(result);
  });

  // Create a watchdog target + auto-generate routines
  router.post(
    "/companies/:companyId/watchdog-targets",
    validate(createWatchdogTargetSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const actor = getActorInfo(req);

      const target = await svc.create(companyId, req.body);

      // Auto-create watchdog routines
      const routines = await svc.createWatchdogRoutines(
        companyId,
        {
          id: target.id,
          name: target.name,
          agentId: target.agentId,
          projectId: target.projectId,
          serviceConfig: target.serviceConfig as unknown as Record<string, unknown>,
        },
        { agentId: actor.agentId, userId: actor.actorType === "user" ? actor.actorId : null },
      );

      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "watchdog_target.created",
        entityType: "watchdog_target",
        entityId: target.id,
        details: { name: target.name, serviceType: target.serviceType, routineCount: routines.length },
      });

      res.status(201).json({ target, routines });
    },
  );

  // Get a single watchdog target
  router.get("/companies/:companyId/watchdog-targets/:id", async (req, res) => {
    const { companyId, id } = req.params;
    assertCompanyAccess(req, companyId as string);
    const target = await svc.getById(id as string);
    if (!target) {
      res.status(404).json({ error: "Watchdog target not found" });
      return;
    }
    res.json(target);
  });

  // Update a watchdog target
  router.patch(
    "/companies/:companyId/watchdog-targets/:id",
    validate(updateWatchdogTargetSchema),
    async (req, res) => {
      const { companyId, id } = req.params;
      assertCompanyAccess(req, companyId as string);
      const updated = await svc.update(id as string, req.body);

      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId: companyId as string,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "watchdog_target.updated",
        entityType: "watchdog_target",
        entityId: id as string,
        details: {},
      });

      res.json(updated);
    },
  );

  // Delete a watchdog target
  router.delete("/companies/:companyId/watchdog-targets/:id", async (req, res) => {
    const { companyId, id } = req.params;
    assertCompanyAccess(req, companyId as string);
    await svc.remove(id as string);

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: companyId as string,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "watchdog_target.deleted",
      entityType: "watchdog_target",
      entityId: id as string,
      details: {},
    });

    res.status(204).end();
  });

  // Manual check trigger
  router.post("/companies/:companyId/watchdog-targets/:id/check", async (req, res) => {
    const { companyId, id } = req.params;
    assertCompanyAccess(req, companyId as string);
    const target = await svc.getById(id as string);
    if (!target) {
      res.status(404).json({ error: "Watchdog target not found" });
      return;
    }

    // Create a check issue for the agent
    const { issueService: issueSvcFn } = await import("../services/issues.js");
    const issueSvcInst = issueSvcFn(db);
    const config = target.serviceConfig as unknown as Record<string, unknown>;
    const issue = await issueSvcInst.create(target.companyId, {
      title: `[Watchdog] Manual check — ${target.name}`,
      description:
        `Manually triggered health check for ${target.name}.\n\n` +
        `1. Run: ${config.healthCheckCommand ?? `pgrep -f ${target.name}`}\n` +
        `2. Report result via POST /companies/${companyId}/watchdog-targets/${id}/report`,
      status: "todo",
      priority: "high",
      assigneeAgentId: target.agentId,
    });

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: companyId as string,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "watchdog_target.manual_check",
      entityType: "watchdog_target",
      entityId: id as string,
      details: { issueId: issue.id },
    });

    res.json({ issueId: issue.id });
  });

  // Agent reports check result
  router.post(
    "/companies/:companyId/watchdog-targets/:id/report",
    validate(reportCheckResultSchema),
    async (req, res) => {
      const { companyId, id } = req.params;
      assertCompanyAccess(req, companyId as string);

      const result = await svc.reportCheck(id as string, req.body);

      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId: companyId as string,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "watchdog_target.check_reported",
        entityType: "watchdog_target",
        entityId: id as string,
        details: { checkType: req.body.checkType, status: req.body.status },
      });

      res.json(result);
    },
  );

  // Check history (learning events for this watchdog target)
  router.get("/companies/:companyId/watchdog-targets/:id/history", async (req, res) => {
    const { companyId, id } = req.params;
    assertCompanyAccess(req, companyId as string);

    const target = await svc.getById(id as string);
    if (!target) {
      res.status(404).json({ error: "Watchdog target not found" });
      return;
    }

    // Get learning events triggered by this watchdog target's agent
    const events = await learningSvc.list(companyId as string, {
      triggerType: "watchdog_alert",
    });

    // Filter to events from this target's agent and target-specific alert context.
    const filtered = events.filter(
      (e) =>
        e.sourceAgentId === target.agentId &&
        e.constraintText?.startsWith(`[${target.name}]`),
    );

    res.json(filtered);
  });

  return router;
}
