import { Router } from "express";
import type { Db } from "@paperclipai/db";
import {
  createAssumptionEntrySchema,
  updateAssumptionEntrySchema,
  verifyAssumptionSchema,
  createLearningEventSchema,
  updateLearningEventStatusSchema,
} from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { assumptionService, learningLoopService, logActivity } from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";

export function qualityRoutes(db: Db) {
  const router = Router();
  const assumptionSvc = assumptionService(db);
  const learningSvc = learningLoopService(db);

  // ---- Assumption Entries ----

  router.get("/companies/:companyId/assumptions", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { verificationStatus, sourceType, sourceId, packetId } = req.query as Record<string, string | undefined>;
    const result = await assumptionSvc.list(companyId, { verificationStatus, sourceType, sourceId, packetId });
    res.json(result);
  });

  router.post(
    "/companies/:companyId/assumptions",
    validate(createAssumptionEntrySchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const actor = getActorInfo(req);
      const entry = await assumptionSvc.create(companyId, req.body);

      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "assumption.created",
        entityType: "assumption_entry",
        entityId: entry.id,
        details: { sourceType: entry.sourceType },
      });

      res.status(201).json(entry);
    },
  );

  router.get("/assumptions/:id", async (req, res) => {
    const id = req.params.id as string;
    const entry = await assumptionSvc.getById(id);
    if (!entry) {
      res.status(404).json({ error: "Assumption entry not found" });
      return;
    }
    assertCompanyAccess(req, entry.companyId);
    res.json(entry);
  });

  router.patch(
    "/assumptions/:id",
    validate(updateAssumptionEntrySchema),
    async (req, res) => {
      const id = req.params.id as string;
      const existing = await assumptionSvc.getById(id);
      if (!existing) {
        res.status(404).json({ error: "Assumption entry not found" });
        return;
      }
      assertCompanyAccess(req, existing.companyId);
      const updated = await assumptionSvc.update(id, req.body);
      res.json(updated);
    },
  );

  router.post(
    "/assumptions/:id/verify",
    validate(verifyAssumptionSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const existing = await assumptionSvc.getById(id);
      if (!existing) {
        res.status(404).json({ error: "Assumption entry not found" });
        return;
      }
      assertCompanyAccess(req, existing.companyId);
      const updated = await assumptionSvc.verify(id, req.body.verificationStatus);

      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId: existing.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: `assumption.${req.body.verificationStatus}`,
        entityType: "assumption_entry",
        entityId: id,
        details: {},
      });

      res.json(updated);
    },
  );

  router.delete("/assumptions/:id", async (req, res) => {
    const id = req.params.id as string;
    const existing = await assumptionSvc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Assumption entry not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    await assumptionSvc.remove(id);
    res.status(204).end();
  });

  // ---- Learning Events ----

  router.get("/companies/:companyId/learning-events", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { status, triggerType, packetId } = req.query as Record<string, string | undefined>;
    const result = await learningSvc.list(companyId, { status, triggerType, packetId });
    res.json(result);
  });

  router.post(
    "/companies/:companyId/learning-events",
    validate(createLearningEventSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const actor = getActorInfo(req);
      const event = await learningSvc.create(companyId, req.body);

      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "learning_event.created",
        entityType: "learning_event",
        entityId: event.id,
        details: { triggerType: event.triggerType },
      });

      res.status(201).json(event);
    },
  );

  router.get("/learning-events/:id", async (req, res) => {
    const id = req.params.id as string;
    const event = await learningSvc.getById(id);
    if (!event) {
      res.status(404).json({ error: "Learning event not found" });
      return;
    }
    assertCompanyAccess(req, event.companyId);
    res.json(event);
  });

  router.post(
    "/learning-events/:id/transition",
    validate(updateLearningEventStatusSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const existing = await learningSvc.getById(id);
      if (!existing) {
        res.status(404).json({ error: "Learning event not found" });
        return;
      }
      assertCompanyAccess(req, existing.companyId);
      const updated = await learningSvc.transition(id, req.body.status);

      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId: existing.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: `learning_event.${req.body.status}`,
        entityType: "learning_event",
        entityId: id,
        details: {},
      });

      res.json(updated);
    },
  );

  router.post("/learning-events/:id/link-retro", async (req, res) => {
    const id = req.params.id as string;
    const existing = await learningSvc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Learning event not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const { retroIssueId } = req.body as { retroIssueId: string };
    if (!retroIssueId) {
      res.status(400).json({ error: "retroIssueId is required" });
      return;
    }
    const updated = await learningSvc.linkRetroIssue(id, retroIssueId);
    res.json(updated);
  });

  // Detect deviation and auto-create learning event if threshold exceeded
  router.post("/companies/:companyId/learning-events/detect-deviation", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);

    const { packetId, expected, actual, metric, threshold } = req.body as {
      packetId: string;
      expected: number;
      actual: number;
      metric: string;
      threshold?: number;
    };

    if (!packetId || expected == null || actual == null || !metric) {
      res.status(400).json({ error: "packetId, expected, actual, and metric are required" });
      return;
    }

    const event = await learningSvc.detectDeviation(
      companyId,
      packetId,
      { expected, actual, metric },
      threshold,
    );

    if (!event) {
      res.json({ detected: false, message: "Within threshold — no deviation detected" });
      return;
    }

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "learning_event.deviation_detected",
      entityType: "learning_event",
      entityId: event.id,
      details: { packetId, metric, expected, actual },
    });

    res.status(201).json({ detected: true, event });
  });

  // Auto-create a retrospective issue from a learning event
  router.post("/learning-events/:id/create-retro", async (req, res) => {
    const id = req.params.id as string;
    const existing = await learningSvc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Learning event not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);

    const issue = await learningSvc.createRetroIssue(id);

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "learning_event.retro_created",
      entityType: "learning_event",
      entityId: id,
      details: { retroIssueId: issue.id },
    });

    res.status(201).json(issue);
  });

  // Propagate constraint from learning event to target agents
  router.post("/learning-events/:id/propagate", async (req, res) => {
    const id = req.params.id as string;
    const existing = await learningSvc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Learning event not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);

    const { targetAgentIds } = req.body as { targetAgentIds: string[] };
    if (!targetAgentIds || !Array.isArray(targetAgentIds) || targetAgentIds.length === 0) {
      res.status(400).json({ error: "targetAgentIds is required (non-empty array)" });
      return;
    }

    const updated = await learningSvc.propagateConstraint(id, targetAgentIds);

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "learning_event.propagated",
      entityType: "learning_event",
      entityId: id,
      details: { targetAgentIds },
    });

    res.json(updated);
  });

  return router;
}
