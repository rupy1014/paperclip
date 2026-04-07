import type { GatePolicyScopeType, GatePolicyAction, GatePolicyFulfillerType, GatePolicyMode } from "../constants.js";

export interface GatePolicy {
  id: string;
  companyId: string;
  scopeType: GatePolicyScopeType;
  scopeId: string;
  action: GatePolicyAction;
  fulfillerType: GatePolicyFulfillerType;
  fulfillerId: string | null;
  mode: GatePolicyMode;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
