import { z } from "zod";
import { DELIVERABLE_BUNDLE_STATUSES, DELIVERABLE_BUNDLE_ITEM_TYPES } from "../constants.js";

export const deliverableBundleStatusSchema = z.enum(DELIVERABLE_BUNDLE_STATUSES);
export const deliverableBundleItemTypeSchema = z.enum(DELIVERABLE_BUNDLE_ITEM_TYPES);

export const createDeliverableBundleSchema = z.object({
  packetId: z.string().uuid(),
  title: z.string().min(1).max(500),
  ceoSummary: z.string().max(5000).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});
export type CreateDeliverableBundle = z.infer<typeof createDeliverableBundleSchema>;

export const updateDeliverableBundleSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  ceoSummary: z.string().max(5000).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});
export type UpdateDeliverableBundle = z.infer<typeof updateDeliverableBundleSchema>;

export const addBundleItemSchema = z.object({
  itemType: deliverableBundleItemTypeSchema,
  itemId: z.string().uuid(),
  sortOrder: z.number().int().min(0).optional(),
  annotation: z.string().max(2000).optional().nullable(),
});
export type AddBundleItem = z.infer<typeof addBundleItemSchema>;

export const decideBundleSchema = z.object({
  decision: z.enum(["approved", "rejected", "revision_requested"]),
  decisionNote: z.string().max(5000).optional().nullable(),
});
export type DecideBundle = z.infer<typeof decideBundleSchema>;
