import type { DecisionPackageStatus } from "../constants.js";

export interface DecisionOption {
  label: string;
  description: string;
  recommended: boolean;
}

export interface DecisionPackage {
  id: string;
  companyId: string;
  bundleId: string;
  ceoAssessment: string | null;
  riskSummary: string | null;
  assumptionsSnapshot: Record<string, unknown>[] | null;
  decisionOptions: DecisionOption[] | null;
  status: DecisionPackageStatus;
  decidedOption: string | null;
  decidedByUserId: string | null;
  decidedAt: Date | null;
  deadline: Date | null;
  createdByAgentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
