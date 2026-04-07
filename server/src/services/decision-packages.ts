import { and, eq, desc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { decisionPackages } from "@paperclipai/db";
import type { DecisionPackageStatus } from "@paperclipai/shared";
import { notFound, unprocessable } from "../errors.js";

const VALID_TRANSITIONS: Record<DecisionPackageStatus, DecisionPackageStatus[]> = {
  pending: ["decided", "deferred"],
  decided: [],
  deferred: ["pending"],
};

export function decisionPackageService(db: Db) {
  async function getExisting(id: string) {
    const row = await db
      .select()
      .from(decisionPackages)
      .where(eq(decisionPackages.id, id))
      .then((rows) => rows[0] ?? null);
    if (!row) throw notFound("Decision package not found");
    return row;
  }

  return {
    create: (
      companyId: string,
      data: {
        bundleId: string;
        ceoAssessment?: string | null;
        riskSummary?: string | null;
        assumptionsSnapshot?: Record<string, unknown>[] | null;
        decisionOptions?: { label: string; description: string; recommended: boolean }[] | null;
        deadline?: string | null;
        createdByAgentId?: string | null;
      },
    ) =>
      db
        .insert(decisionPackages)
        .values({
          ...data,
          companyId,
          deadline: data.deadline ? new Date(data.deadline) : null,
        })
        .returning()
        .then((rows) => rows[0]),

    getById: (id: string) =>
      db
        .select()
        .from(decisionPackages)
        .where(eq(decisionPackages.id, id))
        .then((rows) => rows[0] ?? null),

    list: (companyId: string, filters?: { status?: string; bundleId?: string }) => {
      const conditions = [eq(decisionPackages.companyId, companyId)];
      if (filters?.status) conditions.push(eq(decisionPackages.status, filters.status));
      if (filters?.bundleId) conditions.push(eq(decisionPackages.bundleId, filters.bundleId));
      return db
        .select()
        .from(decisionPackages)
        .where(and(...conditions))
        .orderBy(desc(decisionPackages.updatedAt));
    },

    update: async (
      id: string,
      patch: {
        ceoAssessment?: string | null;
        riskSummary?: string | null;
        assumptionsSnapshot?: Record<string, unknown>[] | null;
        decisionOptions?: { label: string; description: string; recommended: boolean }[] | null;
        deadline?: string | null;
      },
    ) => {
      const existing = await getExisting(id);
      const { deadline, ...rest } = patch;
      return db
        .update(decisionPackages)
        .set({
          ...rest,
          ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
          updatedAt: new Date(),
        })
        .where(eq(decisionPackages.id, existing.id))
        .returning()
        .then((rows) => rows[0]);
    },

    decide: async (id: string, decidedOption: string, decidedByUserId: string) => {
      const existing = await getExisting(id);
      const currentStatus = existing.status as DecisionPackageStatus;
      if (currentStatus !== "pending") {
        throw unprocessable(
          `Decision package must be in "pending" status to decide. Current: "${currentStatus}"`,
        );
      }

      const now = new Date();
      return db
        .update(decisionPackages)
        .set({
          status: "decided",
          decidedOption,
          decidedByUserId,
          decidedAt: now,
          updatedAt: now,
        })
        .where(eq(decisionPackages.id, existing.id))
        .returning()
        .then((rows) => rows[0]);
    },

    defer: async (id: string) => {
      const existing = await getExisting(id);
      const currentStatus = existing.status as DecisionPackageStatus;
      const allowed = VALID_TRANSITIONS[currentStatus];
      if (!allowed?.includes("deferred")) {
        throw unprocessable(
          `Cannot defer decision package from "${currentStatus}". Allowed transitions: ${allowed?.join(", ") || "none"}`,
        );
      }

      return db
        .update(decisionPackages)
        .set({ status: "deferred", updatedAt: new Date() })
        .where(eq(decisionPackages.id, existing.id))
        .returning()
        .then((rows) => rows[0]);
    },

    reopen: async (id: string) => {
      const existing = await getExisting(id);
      const currentStatus = existing.status as DecisionPackageStatus;
      if (currentStatus !== "deferred") {
        throw unprocessable(
          `Can only reopen deferred decision packages. Current: "${currentStatus}"`,
        );
      }

      return db
        .update(decisionPackages)
        .set({ status: "pending", updatedAt: new Date() })
        .where(eq(decisionPackages.id, existing.id))
        .returning()
        .then((rows) => rows[0]);
    },
  };
}
