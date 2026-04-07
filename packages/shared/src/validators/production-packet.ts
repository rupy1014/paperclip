import { z } from "zod";
import { PRODUCTION_PACKET_STATUSES } from "../constants.js";

export const productionPacketStatusSchema = z.enum(PRODUCTION_PACKET_STATUSES);

export const createProductionPacketSchema = z.object({
  issueId: z.string().uuid(),
  projectId: z.string().uuid().optional().nullable(),
  ownerAgentId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type CreateProductionPacket = z.infer<typeof createProductionPacketSchema>;

export const updateProductionPacketSchema = z.object({
  status: productionPacketStatusSchema.optional(),
  ownerAgentId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type UpdateProductionPacket = z.infer<typeof updateProductionPacketSchema>;
