import { z } from "zod";
import {
  ASSUMPTION_SOURCE_TYPES,
  ASSUMPTION_CONFIDENCE_LEVELS,
  ASSUMPTION_VERIFICATION_STATUSES,
  ASSUMPTION_SOURCE_PROVENANCES,
} from "../constants.js";

export const assumptionSourceTypeSchema = z.enum(ASSUMPTION_SOURCE_TYPES);
export const assumptionConfidenceLevelSchema = z.enum(ASSUMPTION_CONFIDENCE_LEVELS);
export const assumptionVerificationStatusSchema = z.enum(ASSUMPTION_VERIFICATION_STATUSES);

export const createAssumptionEntrySchema = z.object({
  sourceType: assumptionSourceTypeSchema,
  sourceId: z.string().uuid(),
  packetId: z.string().uuid().optional().nullable(),
  agentId: z.string().uuid().optional().nullable(),
  statement: z.string().min(1).max(5000),
  confidence: assumptionConfidenceLevelSchema.optional().default("medium"),
  sourceDescription: z.string().max(2000).optional().nullable(),
  source: z.enum(ASSUMPTION_SOURCE_PROVENANCES).optional().nullable(),
  verificationMethod: z.string().max(2000).optional().nullable(),
});
export type CreateAssumptionEntry = z.infer<typeof createAssumptionEntrySchema>;

export const updateAssumptionEntrySchema = z.object({
  statement: z.string().min(1).max(5000).optional(),
  confidence: assumptionConfidenceLevelSchema.optional(),
  sourceDescription: z.string().max(2000).optional().nullable(),
  source: z.enum(ASSUMPTION_SOURCE_PROVENANCES).optional().nullable(),
  verificationMethod: z.string().max(2000).optional().nullable(),
});
export type UpdateAssumptionEntry = z.infer<typeof updateAssumptionEntrySchema>;

export const verifyAssumptionSchema = z.object({
  verificationStatus: z.enum(["verified", "falsified"]),
});
export type VerifyAssumption = z.infer<typeof verifyAssumptionSchema>;
