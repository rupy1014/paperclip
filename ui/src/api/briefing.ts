import { api } from "./client";

export interface BriefingSummary {
  activePackets: number;
  pendingBundles: number;
  pendingDecisions: number;
  pendingApprovals: number;
  blockedIssues: number;
  monthSpendCents: number;
  monthBudgetCents: number;
  unverifiedAssumptionCount: number;
  riskHighlights: { decisionId: string; riskSummary: string }[];
}

export interface CeoBriefing {
  companyId: string;
  pushing: unknown[];
  judgment: {
    decisions: unknown[];
    bundles: unknown[];
  };
  results: unknown[];
  blocked: unknown[];
  summary: BriefingSummary;
}

export const briefingApi = {
  get: (companyId: string) =>
    api.get<CeoBriefing>(`/companies/${companyId}/ceo-briefing`),
};
