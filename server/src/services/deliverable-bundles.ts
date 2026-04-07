import { and, eq, desc, asc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { deliverableBundles, deliverableBundleItems, documents, issueWorkProducts, issues } from "@paperclipai/db";
import type { DeliverableBundleStatus, DeliverableBundleItemType } from "@paperclipai/shared";
import { notFound, unprocessable } from "../errors.js";

const VALID_TRANSITIONS: Record<DeliverableBundleStatus, DeliverableBundleStatus[]> = {
  pending: ["presented"],
  presented: ["approved", "rejected", "revision_requested"],
  approved: [],
  rejected: [],
  revision_requested: ["pending"],
};

export function deliverableBundleService(db: Db) {
  async function getExisting(id: string) {
    const row = await db
      .select()
      .from(deliverableBundles)
      .where(eq(deliverableBundles.id, id))
      .then((rows) => rows[0] ?? null);
    if (!row) throw notFound("Deliverable bundle not found");
    return row;
  }

  return {
    create: (
      companyId: string,
      data: {
        packetId: string;
        title: string;
        ceoSummary?: string | null;
        createdByAgentId?: string | null;
        metadata?: Record<string, unknown> | null;
      },
    ) =>
      db
        .insert(deliverableBundles)
        .values({ ...data, companyId })
        .returning()
        .then((rows) => rows[0]),

    getById: (id: string) =>
      db
        .select()
        .from(deliverableBundles)
        .where(eq(deliverableBundles.id, id))
        .then((rows) => rows[0] ?? null),

    list: (companyId: string, filters?: { status?: string; packetId?: string }) => {
      const conditions = [eq(deliverableBundles.companyId, companyId)];
      if (filters?.status) conditions.push(eq(deliverableBundles.status, filters.status));
      if (filters?.packetId) conditions.push(eq(deliverableBundles.packetId, filters.packetId));
      return db
        .select()
        .from(deliverableBundles)
        .where(and(...conditions))
        .orderBy(desc(deliverableBundles.updatedAt));
    },

    update: async (
      id: string,
      patch: { title?: string; ceoSummary?: string | null; metadata?: Record<string, unknown> | null },
    ) => {
      const existing = await getExisting(id);
      return db
        .update(deliverableBundles)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(deliverableBundles.id, existing.id))
        .returning()
        .then((rows) => rows[0]);
    },

    transitionStatus: async (id: string, targetStatus: DeliverableBundleStatus) => {
      const existing = await getExisting(id);
      const currentStatus = existing.status as DeliverableBundleStatus;
      const allowed = VALID_TRANSITIONS[currentStatus];
      if (!allowed?.includes(targetStatus)) {
        throw unprocessable(
          `Cannot transition bundle from "${currentStatus}" to "${targetStatus}". ` +
            `Allowed transitions: ${allowed?.join(", ") || "none"}`,
        );
      }

      const now = new Date();
      const timestamps: Record<string, Date> = { updatedAt: now };
      if (targetStatus === "presented") timestamps.presentedAt = now;

      return db
        .update(deliverableBundles)
        .set({ status: targetStatus, ...timestamps })
        .where(eq(deliverableBundles.id, existing.id))
        .returning()
        .then((rows) => rows[0]);
    },

    decide: async (
      id: string,
      decision: "approved" | "rejected" | "revision_requested",
      decidedByUserId: string,
      decisionNote?: string | null,
    ) => {
      const existing = await getExisting(id);
      const currentStatus = existing.status as DeliverableBundleStatus;
      if (currentStatus !== "presented") {
        throw unprocessable(`Bundle must be in "presented" status to decide. Current: "${currentStatus}"`);
      }

      const now = new Date();
      return db
        .update(deliverableBundles)
        .set({
          status: decision,
          decisionNote: decisionNote ?? null,
          decidedByUserId,
          decidedAt: now,
          updatedAt: now,
        })
        .where(eq(deliverableBundles.id, existing.id))
        .returning()
        .then((rows) => rows[0]);
    },

    // Bundle items
    addItem: (
      bundleId: string,
      data: {
        itemType: DeliverableBundleItemType;
        itemId: string;
        sortOrder?: number;
        annotation?: string | null;
      },
    ) =>
      db
        .insert(deliverableBundleItems)
        .values({ bundleId, ...data })
        .returning()
        .then((rows) => rows[0]),

    removeItem: async (itemId: string) => {
      const deleted = await db
        .delete(deliverableBundleItems)
        .where(eq(deliverableBundleItems.id, itemId))
        .returning()
        .then((rows) => rows[0] ?? null);
      if (!deleted) throw notFound("Bundle item not found");
      return deleted;
    },

    listItems: (bundleId: string) =>
      db
        .select()
        .from(deliverableBundleItems)
        .where(eq(deliverableBundleItems.bundleId, bundleId))
        .orderBy(asc(deliverableBundleItems.sortOrder)),

    listItemsHydrated: async (bundleId: string) => {
      const items = await db
        .select()
        .from(deliverableBundleItems)
        .where(eq(deliverableBundleItems.bundleId, bundleId))
        .orderBy(asc(deliverableBundleItems.sortOrder));

      const hydrated = await Promise.all(
        items.map(async (item) => {
          let resolvedTitle: string | null = null;
          if (item.itemType === "document") {
            const [doc] = await db
              .select({ title: documents.title })
              .from(documents)
              .where(eq(documents.id, item.itemId));
            resolvedTitle = doc?.title ?? null;
          } else if (item.itemType === "work_product") {
            const [wp] = await db
              .select({ title: issueWorkProducts.title })
              .from(issueWorkProducts)
              .where(eq(issueWorkProducts.id, item.itemId));
            resolvedTitle = wp?.title ?? null;
          } else if (item.itemType === "issue") {
            const [iss] = await db
              .select({ title: issues.title })
              .from(issues)
              .where(eq(issues.id, item.itemId));
            resolvedTitle = iss?.title ?? null;
          }
          return { ...item, resolvedTitle };
        }),
      );

      return hydrated;
    },
  };
}
