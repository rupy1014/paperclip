import { Router } from "express";
import type { Db } from "@paperclipai/db";
import {
  createDecisionPackageSchema,
  updateDecisionPackageSchema,
  decideDecisionPackageSchema,
} from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { ceoBriefingService, decisionPackageService, logActivity } from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";

export function briefingRoutes(db: Db) {
  const router = Router();
  const briefingSvc = ceoBriefingService(db);
  const decisionSvc = decisionPackageService(db);

  // CEO Briefing — computed aggregation
  router.get("/companies/:companyId/ceo-briefing", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const briefing = await briefingSvc.getBriefing(companyId);
    res.json(briefing);
  });

  // --- Decision Packages ---

  // List decision packages for a company
  router.get("/companies/:companyId/decision-packages", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { status, bundleId } = req.query as Record<string, string | undefined>;
    const result = await decisionSvc.list(companyId, { status, bundleId });
    res.json(result);
  });

  // Get a single decision package
  router.get("/decision-packages/:id", async (req, res) => {
    const id = req.params.id as string;
    const dp = await decisionSvc.getById(id);
    if (!dp) {
      res.status(404).json({ error: "Decision package not found" });
      return;
    }
    assertCompanyAccess(req, dp.companyId);
    res.json(dp);
  });

  // Create a decision package
  router.post(
    "/companies/:companyId/decision-packages",
    validate(createDecisionPackageSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const actor = getActorInfo(req);
      const dp = await decisionSvc.create(companyId, {
        ...req.body,
        createdByAgentId: actor.actorType === "agent" ? actor.actorId : null,
      });

      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "decision_package.created",
        entityType: "decision_package",
        entityId: dp.id,
        details: { bundleId: dp.bundleId },
      });

      res.status(201).json(dp);
    },
  );

  // Update a decision package
  router.patch(
    "/decision-packages/:id",
    validate(updateDecisionPackageSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const existing = await decisionSvc.getById(id);
      if (!existing) {
        res.status(404).json({ error: "Decision package not found" });
        return;
      }
      assertCompanyAccess(req, existing.companyId);
      const updated = await decisionSvc.update(id, req.body);

      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId: existing.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "decision_package.updated",
        entityType: "decision_package",
        entityId: id,
        details: {},
      });

      res.json(updated);
    },
  );

  // Decide on a decision package
  router.post(
    "/decision-packages/:id/decide",
    validate(decideDecisionPackageSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const existing = await decisionSvc.getById(id);
      if (!existing) {
        res.status(404).json({ error: "Decision package not found" });
        return;
      }
      assertCompanyAccess(req, existing.companyId);

      const actor = getActorInfo(req);
      const userId = actor.actorType === "user" ? actor.actorId : "system";
      const updated = await decisionSvc.decide(id, req.body.decidedOption, userId);

      await logActivity(db, {
        companyId: existing.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "decision_package.decided",
        entityType: "decision_package",
        entityId: id,
        details: { decidedOption: req.body.decidedOption },
      });

      res.json(updated);
    },
  );

  // Defer a decision package
  router.post("/decision-packages/:id/defer", async (req, res) => {
    const id = req.params.id as string;
    const existing = await decisionSvc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Decision package not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const updated = await decisionSvc.defer(id);

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "decision_package.deferred",
      entityType: "decision_package",
      entityId: id,
      details: {},
    });

    res.json(updated);
  });

  // Reopen a deferred decision package
  router.post("/decision-packages/:id/reopen", async (req, res) => {
    const id = req.params.id as string;
    const existing = await decisionSvc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Decision package not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const updated = await decisionSvc.reopen(id);

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "decision_package.reopened",
      entityType: "decision_package",
      entityId: id,
      details: {},
    });

    res.json(updated);
  });

  return router;
}
