import type { ProductionPacketStatus } from "../constants.js";

export interface ProductionPacket {
  id: string;
  companyId: string;
  issueId: string;
  projectId: string | null;
  status: ProductionPacketStatus;
  ownerAgentId: string | null;
  createdByAgentId: string | null;
  createdByUserId: string | null;
  startedAt: Date | null;
  submittedForReviewAt: Date | null;
  completedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
