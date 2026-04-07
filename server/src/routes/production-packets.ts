import { Router } from "express";
import type { Db } from "@paperclipai/db";
import {
  createProductionPacketSchema,
  updateProductionPacketSchema,
  productionPacketStatusSchema,
} from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { productionPacketService, gatePolicyService, logActivity } from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";

export function productionPacketRoutes(db: Db) {
  const router = Router();
  const svc = productionPacketService(db);
  const gateSvc = gatePolicyService(db);

  // List production packets for a company
  router.get("/companies/:companyId/production-packets", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { status, projectId, ownerAgentId } = req.query as Record<string, string | undefined>;
    const result = await svc.list(companyId, { status, projectId, ownerAgentId });
    res.json(result);
  });

  // Get a single production packet (optionally hydrated with issue/docs/work-products)
  router.get("/production-packets/:id", async (req, res) => {
    const id = req.params.id as string;
    const hydrate = req.query.hydrate === "true";

    if (hydrate) {
      const hydrated = await svc.getHydrated(id);
      assertCompanyAccess(req, hydrated.companyId);
      res.json(hydrated);
      return;
    }

    const packet = await svc.getById(id);
    if (!packet) {
      res.status(404).json({ error: "Production packet not found" });
      return;
    }
    assertCompanyAccess(req, packet.companyId);
    res.json(packet);
  });

  // Create a production packet
  router.post(
    "/companies/:companyId/production-packets",
    validate(createProductionPacketSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const actor = getActorInfo(req);
      const packet = await svc.create(companyId, {
        ...req.body,
        createdByUserId: actor.actorType === "user" ? actor.actorId : null,
        createdByAgentId: actor.actorType === "agent" ? actor.actorId : null,
      });

      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "production_packet.created",
        entityType: "production_packet",
        entityId: packet.id,
        details: { issueId: packet.issueId, projectId: packet.projectId },
      });

      res.status(201).json(packet);
    },
  );

  // Update a production packet
  router.patch(
    "/production-packets/:id",
    validate(updateProductionPacketSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const existing = await svc.getById(id);
      if (!existing) {
        res.status(404).json({ error: "Production packet not found" });
        return;
      }
      assertCompanyAccess(req, existing.companyId);

      const { status, ...patch } = req.body;

      // If status transition requested, use the state machine
      let updated;
      if (status) {
        updated = await svc.transitionStatus(id, status);
      }
      if (Object.keys(patch).length > 0) {
        updated = await svc.update(id, patch);
      }

      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId: existing.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "production_packet.updated",
        entityType: "production_packet",
        entityId: id,
        details: { status: status ?? undefined },
      });

      res.json(updated ?? existing);
    },
  );

  // Submit for review (convenience endpoint)
  router.post("/production-packets/:id/submit-for-review", async (req, res) => {
    const id = req.params.id as string;
    const existing = await svc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Production packet not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);

    // Gate check: "publish" action (pass project scope if available)
    const gates = await gateSvc.checkGates(
      existing.companyId,
      "publish",
      existing.projectId ? { scopeType: "project", scopeId: existing.projectId } : undefined,
    );
    if (gates.some((g) => g.mode === "blocking")) {
      res.status(403).json({
        error: "Blocked by gate policy",
        gates: gates.filter((g) => g.mode === "blocking"),
      });
      return;
    }

    const updated = await svc.transitionStatus(id, "review");

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "production_packet.submitted_for_review",
      entityType: "production_packet",
      entityId: id,
      details: {},
    });

    res.json(updated);
  });

  return router;
}
