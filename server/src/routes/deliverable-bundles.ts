import { Router } from "express";
import type { Db } from "@paperclipai/db";
import {
  createDeliverableBundleSchema,
  updateDeliverableBundleSchema,
  addBundleItemSchema,
  decideBundleSchema,
} from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { deliverableBundleService, gatePolicyService, productionPacketService, logActivity } from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";

export function deliverableBundleRoutes(db: Db) {
  const router = Router();
  const svc = deliverableBundleService(db);
  const gateSvc = gatePolicyService(db);
  const packetSvc = productionPacketService(db);

  // List deliverable bundles for a company
  router.get("/companies/:companyId/deliverable-bundles", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const { status, packetId } = req.query as Record<string, string | undefined>;
    const result = await svc.list(companyId, { status, packetId });
    res.json(result);
  });

  // Get a single deliverable bundle
  router.get("/deliverable-bundles/:id", async (req, res) => {
    const id = req.params.id as string;
    const bundle = await svc.getById(id);
    if (!bundle) {
      res.status(404).json({ error: "Deliverable bundle not found" });
      return;
    }
    assertCompanyAccess(req, bundle.companyId);
    res.json(bundle);
  });

  // Create a deliverable bundle
  router.post(
    "/companies/:companyId/deliverable-bundles",
    validate(createDeliverableBundleSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const actor = getActorInfo(req);
      const bundle = await svc.create(companyId, {
        ...req.body,
        createdByAgentId: actor.actorType === "agent" ? actor.actorId : null,
      });

      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "deliverable_bundle.created",
        entityType: "deliverable_bundle",
        entityId: bundle.id,
        details: { packetId: bundle.packetId, title: bundle.title },
      });

      res.status(201).json(bundle);
    },
  );

  // Update a deliverable bundle
  router.patch(
    "/deliverable-bundles/:id",
    validate(updateDeliverableBundleSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const existing = await svc.getById(id);
      if (!existing) {
        res.status(404).json({ error: "Deliverable bundle not found" });
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
        action: "deliverable_bundle.updated",
        entityType: "deliverable_bundle",
        entityId: id,
        details: {},
      });

      res.json(updated);
    },
  );

  // Present a bundle (transition to presented)
  router.post("/deliverable-bundles/:id/present", async (req, res) => {
    const id = req.params.id as string;
    const existing = await svc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Deliverable bundle not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const updated = await svc.transitionStatus(id, "presented");

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "deliverable_bundle.presented",
      entityType: "deliverable_bundle",
      entityId: id,
      details: {},
    });

    res.json(updated);
  });

  // Decide on a bundle (approve/reject/revision_requested)
  router.post(
    "/deliverable-bundles/:id/decide",
    validate(decideBundleSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const existing = await svc.getById(id);
      if (!existing) {
        res.status(404).json({ error: "Deliverable bundle not found" });
        return;
      }
      assertCompanyAccess(req, existing.companyId);

      // Gate check: "release" action on approve (pass project scope via packet)
      if (req.body.decision === "approved") {
        const packet = await packetSvc.getById(existing.packetId);
        const gates = await gateSvc.checkGates(
          existing.companyId,
          "release",
          packet?.projectId ? { scopeType: "project", scopeId: packet.projectId } : undefined,
        );
        if (gates.some((g) => g.mode === "blocking")) {
          res.status(403).json({
            error: "Blocked by gate policy",
            gates: gates.filter((g) => g.mode === "blocking"),
          });
          return;
        }
      }

      const actor = getActorInfo(req);
      const userId = actor.actorType === "user" ? actor.actorId : "system";
      const updated = await svc.decide(id, req.body.decision, userId, req.body.decisionNote);

      await logActivity(db, {
        companyId: existing.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: `deliverable_bundle.${req.body.decision}`,
        entityType: "deliverable_bundle",
        entityId: id,
        details: { decision: req.body.decision },
      });

      res.json(updated);
    },
  );

  // Resubmit (revision_requested → pending)
  router.post("/deliverable-bundles/:id/resubmit", async (req, res) => {
    const id = req.params.id as string;
    const existing = await svc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Deliverable bundle not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const updated = await svc.transitionStatus(id, "pending");

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "deliverable_bundle.resubmitted",
      entityType: "deliverable_bundle",
      entityId: id,
      details: {},
    });

    res.json(updated);
  });

  // --- Bundle items ---

  // List items in a bundle
  router.get("/deliverable-bundles/:id/items", async (req, res) => {
    const id = req.params.id as string;
    const bundle = await svc.getById(id);
    if (!bundle) {
      res.status(404).json({ error: "Deliverable bundle not found" });
      return;
    }
    assertCompanyAccess(req, bundle.companyId);
    const items = await svc.listItemsHydrated(id);
    res.json(items);
  });

  // Add item to a bundle
  router.post(
    "/deliverable-bundles/:id/items",
    validate(addBundleItemSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const bundle = await svc.getById(id);
      if (!bundle) {
        res.status(404).json({ error: "Deliverable bundle not found" });
        return;
      }
      assertCompanyAccess(req, bundle.companyId);
      const item = await svc.addItem(id, req.body);

      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId: bundle.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "deliverable_bundle.item_added",
        entityType: "deliverable_bundle",
        entityId: id,
        details: { itemType: req.body.itemType, itemId: req.body.itemId },
      });

      res.status(201).json(item);
    },
  );

  // Remove item from a bundle
  router.delete("/deliverable-bundles/:bundleId/items/:itemId", async (req, res) => {
    const { bundleId, itemId } = req.params;
    const bundle = await svc.getById(bundleId as string);
    if (!bundle) {
      res.status(404).json({ error: "Deliverable bundle not found" });
      return;
    }
    assertCompanyAccess(req, bundle.companyId);
    await svc.removeItem(itemId as string);

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: bundle.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "deliverable_bundle.item_removed",
      entityType: "deliverable_bundle",
      entityId: bundleId as string,
      details: { itemId },
    });

    res.json({ ok: true });
  });

  return router;
}
