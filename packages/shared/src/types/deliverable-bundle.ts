import type { DeliverableBundleStatus, DeliverableBundleItemType } from "../constants.js";

export interface DeliverableBundle {
  id: string;
  companyId: string;
  packetId: string;
  title: string;
  ceoSummary: string | null;
  status: DeliverableBundleStatus;
  decisionNote: string | null;
  decidedByUserId: string | null;
  decidedAt: Date | null;
  presentedAt: Date | null;
  createdByAgentId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliverableBundleItem {
  id: string;
  bundleId: string;
  itemType: DeliverableBundleItemType;
  itemId: string;
  sortOrder: number;
  annotation: string | null;
  createdAt: Date;
}
