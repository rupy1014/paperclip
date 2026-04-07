import { z } from "zod";
import { DECISION_PACKAGE_STATUSES } from "../constants.js";

export const decisionPackageStatusSchema = z.enum(DECISION_PACKAGE_STATUSES);

export const decisionOptionSchema = z.object({
  label: z.string().min(1).max(200),
  description: z.string().max(2000),
  recommended: z.boolean(),
});

export const createDecisionPackageSchema = z.object({
  bundleId: z.string().uuid(),
  ceoAssessment: z.string().max(10000).optional().nullable(),
  riskSummary: z.string().max(10000).optional().nullable(),
  assumptionsSnapshot: z.array(z.record(z.unknown())).optional().nullable(),
  decisionOptions: z.array(decisionOptionSchema).optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
});
export type CreateDecisionPackage = z.infer<typeof createDecisionPackageSchema>;

export const updateDecisionPackageSchema = z.object({
  ceoAssessment: z.string().max(10000).optional().nullable(),
  riskSummary: z.string().max(10000).optional().nullable(),
  assumptionsSnapshot: z.array(z.record(z.unknown())).optional().nullable(),
  decisionOptions: z.array(decisionOptionSchema).optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
});
export type UpdateDecisionPackage = z.infer<typeof updateDecisionPackageSchema>;

export const decideDecisionPackageSchema = z.object({
  decidedOption: z.string().min(1).max(500),
});
export type DecideDecisionPackage = z.infer<typeof decideDecisionPackageSchema>;
