import { and, eq, desc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { productionPackets, issues, documents, issueDocuments, issueWorkProducts } from "@paperclipai/db";
import type { ProductionPacketStatus } from "@paperclipai/shared";
import { notFound, unprocessable } from "../errors.js";

const VALID_TRANSITIONS: Record<ProductionPacketStatus, ProductionPacketStatus[]> = {
  draft: ["executing"],
  executing: ["review"],
  review: ["done", "retry", "archive"],
  retry: ["executing"],
  done: ["archive"],
  archive: [],
};

export function productionPacketService(db: Db) {
  async function getExisting(id: string) {
    const row = await db
      .select()
      .from(productionPackets)
      .where(eq(productionPackets.id, id))
      .then((rows) => rows[0] ?? null);
    if (!row) throw notFound("Production packet not found");
    return row;
  }

  return {
    create: (
      companyId: string,
      data: {
        issueId: string;
        projectId?: string | null;
        ownerAgentId?: string | null;
        createdByAgentId?: string | null;
        createdByUserId?: string | null;
        metadata?: Record<string, unknown> | null;
      },
    ) =>
      db
        .insert(productionPackets)
        .values({ ...data, companyId })
        .returning()
        .then((rows) => rows[0]),

    getById: (id: string) =>
      db
        .select()
        .from(productionPackets)
        .where(eq(productionPackets.id, id))
        .then((rows) => rows[0] ?? null),

    getHydrated: async (id: string) => {
      const packet = await getExisting(id);

      const issue = await db
        .select()
        .from(issues)
        .where(eq(issues.id, packet.issueId))
        .then((rows) => rows[0] ?? null);

      const childIssues = await db
        .select()
        .from(issues)
        .where(eq(issues.parentId, packet.issueId))
        .orderBy(desc(issues.updatedAt));

      const docs = await db
        .select({ doc: documents })
        .from(issueDocuments)
        .innerJoin(documents, eq(documents.id, issueDocuments.documentId))
        .where(eq(issueDocuments.issueId, packet.issueId))
        .then((rows) => rows.map((r) => r.doc));

      const workProducts = await db
        .select()
        .from(issueWorkProducts)
        .where(eq(issueWorkProducts.issueId, packet.issueId))
        .orderBy(desc(issueWorkProducts.updatedAt));

      return { ...packet, issue, childIssues, documents: docs, workProducts };
    },

    list: (companyId: string, filters?: { status?: string; projectId?: string; ownerAgentId?: string }) => {
      const conditions = [eq(productionPackets.companyId, companyId)];
      if (filters?.status) conditions.push(eq(productionPackets.status, filters.status));
      if (filters?.projectId) conditions.push(eq(productionPackets.projectId, filters.projectId));
      if (filters?.ownerAgentId) conditions.push(eq(productionPackets.ownerAgentId, filters.ownerAgentId));
      return db
        .select()
        .from(productionPackets)
        .where(and(...conditions))
        .orderBy(desc(productionPackets.updatedAt));
    },

    update: async (id: string, patch: { ownerAgentId?: string | null; metadata?: Record<string, unknown> | null }) => {
      const existing = await getExisting(id);
      const updated = await db
        .update(productionPackets)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(productionPackets.id, existing.id))
        .returning()
        .then((rows) => rows[0]);
      return updated;
    },

    transitionStatus: async (id: string, targetStatus: ProductionPacketStatus) => {
      const existing = await getExisting(id);
      const currentStatus = existing.status as ProductionPacketStatus;
      const allowed = VALID_TRANSITIONS[currentStatus];
      if (!allowed?.includes(targetStatus)) {
        throw unprocessable(
          `Cannot transition production packet from "${currentStatus}" to "${targetStatus}". ` +
            `Allowed transitions: ${allowed?.join(", ") || "none"}`,
        );
      }

      const now = new Date();
      const timestamps: Record<string, Date> = { updatedAt: now };
      if (targetStatus === "executing" && !existing.startedAt) timestamps.startedAt = now;
      if (targetStatus === "review") timestamps.submittedForReviewAt = now;
      if (targetStatus === "done" || targetStatus === "archive") timestamps.completedAt = now;

      const updated = await db
        .update(productionPackets)
        .set({ status: targetStatus, ...timestamps })
        .where(eq(productionPackets.id, existing.id))
        .returning()
        .then((rows) => rows[0]);
      return updated;
    },
  };
}
