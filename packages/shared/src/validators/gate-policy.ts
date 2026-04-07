import { z } from "zod";
import {
  GATE_POLICY_SCOPE_TYPES,
  GATE_POLICY_ACTIONS,
  GATE_POLICY_FULFILLER_TYPES,
  GATE_POLICY_MODES,
} from "../constants.js";

export const gatePolicyScopeTypeSchema = z.enum(GATE_POLICY_SCOPE_TYPES);
export const gatePolicyActionSchema = z.enum(GATE_POLICY_ACTIONS);
export const gatePolicyFulfillerTypeSchema = z.enum(GATE_POLICY_FULFILLER_TYPES);
export const gatePolicyModeSchema = z.enum(GATE_POLICY_MODES);

export const upsertGatePolicySchema = z.object({
  scopeType: gatePolicyScopeTypeSchema,
  scopeId: z.string().uuid(),
  action: gatePolicyActionSchema,
  fulfillerType: gatePolicyFulfillerTypeSchema.optional().default("board"),
  fulfillerId: z.string().max(500).optional().nullable(),
  mode: gatePolicyModeSchema.optional().default("blocking"),
  isActive: z.boolean().optional().default(true),
});
export type UpsertGatePolicy = z.infer<typeof upsertGatePolicySchema>;

export const checkGatesSchema = z.object({
  action: gatePolicyActionSchema,
  scopeType: gatePolicyScopeTypeSchema.optional(),
  scopeId: z.string().uuid().optional(),
});
export type CheckGates = z.infer<typeof checkGatesSchema>;
