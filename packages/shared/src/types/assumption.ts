import type {
  AssumptionSourceType,
  AssumptionConfidenceLevel,
  AssumptionVerificationStatus,
} from "../constants.js";

export interface AssumptionEntry {
  id: string;
  companyId: string;
  sourceType: AssumptionSourceType;
  sourceId: string;
  packetId: string | null;
  agentId: string | null;
  statement: string;
  confidence: AssumptionConfidenceLevel;
  sourceDescription: string | null;
  source: string | null;
  verificationMethod: string | null;
  verificationStatus: AssumptionVerificationStatus;
  verifiedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
