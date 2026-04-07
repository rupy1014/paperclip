import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { upsertGatePolicySchema } from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { gatePolicyService, logActivity } from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";

export function gatePolicyRoutes(db: Db) {
  const router = Router();
  const svc = gatePolicyService(db);

  // List gate policies for a company
  router.get("/companies/:companyId/gate-policies", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { scopeType, scopeId, action } = req.query as Record<string, string | undefined>;
    const result = await svc.list(companyId, { scopeType, scopeId, action });
    res.json(result);
  });

  // Upsert a gate policy (create or update by scope+action)
  router.post(
    "/companies/:companyId/gate-policies",
    validate(upsertGatePolicySchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const actor = getActorInfo(req);
      const policy = await svc.create(companyId, req.body);

      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "gate_policy.upserted",
        entityType: "gate_policy",
        entityId: policy.id,
        details: { policyAction: policy.action, scopeType: policy.scopeType },
      });

      res.status(201).json(policy);
    },
  );

  // Get a single gate policy
  router.get("/gate-policies/:id", async (req, res) => {
    const id = req.params.id as string;
    const policy = await svc.getById(id);
    if (!policy) {
      res.status(404).json({ error: "Gate policy not found" });
      return;
    }
    assertCompanyAccess(req, policy.companyId);
    res.json(policy);
  });

  // Update a gate policy
  router.patch("/gate-policies/:id", async (req, res) => {
    const id = req.params.id as string;
    const existing = await svc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Gate policy not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const updated = await svc.update(id, req.body);

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "gate_policy.updated",
      entityType: "gate_policy",
      entityId: id,
      details: {},
    });

    res.json(updated);
  });

  // Delete a gate policy
  router.delete("/gate-policies/:id", async (req, res) => {
    const id = req.params.id as string;
    const existing = await svc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Gate policy not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    await svc.remove(id);

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "gate_policy.deleted",
      entityType: "gate_policy",
      entityId: id,
      details: { policyAction: existing.action },
    });

    res.status(204).end();
  });

  // Check gates — which policies apply for a given action
  router.get("/companies/:companyId/gate-policies/check", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { action, scopeType, scopeId } = req.query as Record<string, string | undefined>;
    if (!action) {
      res.status(400).json({ error: "action query parameter is required" });
      return;
    }
    const scope = scopeType && scopeId ? { scopeType: scopeType as "company" | "project" | "agent", scopeId } : undefined;
    const gates = await svc.checkGates(companyId, action as "publish" | "budget_exception" | "release" | "deploy" | "strategy_change", scope);
    res.json({ gates, blocked: gates.some((g) => g.mode === "blocking") });
  });

  return router;
}
