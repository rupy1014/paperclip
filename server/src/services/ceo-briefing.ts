import { and, eq, sql, desc, inArray } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import {
  productionPackets,
  deliverableBundles,
  decisionPackages,
  issues,
  approvals,
  costEvents,
  companies,
  assumptionEntries,
} from "@paperclipai/db";
import { notFound } from "../errors.js";

export function ceoBriefingService(db: Db) {
  return {
    getBriefing: async (companyId: string) => {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .then((rows) => rows[0] ?? null);
      if (!company) throw notFound("Company not found");

      // Active packets (executing or review)
      const activePackets = await db
        .select()
        .from(productionPackets)
        .where(
          and(
            eq(productionPackets.companyId, companyId),
            inArray(productionPackets.status, ["executing", "review"]),
          ),
        )
        .orderBy(desc(productionPackets.updatedAt));

      // Pending bundles (presented — awaiting decision)
      const pendingBundles = await db
        .select()
        .from(deliverableBundles)
        .where(
          and(
            eq(deliverableBundles.companyId, companyId),
            eq(deliverableBundles.status, "presented"),
          ),
        )
        .orderBy(desc(deliverableBundles.updatedAt));

      // Pending decision packages
      const pendingDecisions = await db
        .select()
        .from(decisionPackages)
        .where(
          and(
            eq(decisionPackages.companyId, companyId),
            eq(decisionPackages.status, "pending"),
          ),
        )
        .orderBy(desc(decisionPackages.updatedAt));

      // Recently completed bundles (approved in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const completedBundles = await db
        .select()
        .from(deliverableBundles)
        .where(
          and(
            eq(deliverableBundles.companyId, companyId),
            eq(deliverableBundles.status, "approved"),
            sql`${deliverableBundles.decidedAt} >= ${sevenDaysAgo}`,
          ),
        )
        .orderBy(desc(deliverableBundles.decidedAt));

      // Blocked issues
      const blockedIssues = await db
        .select()
        .from(issues)
        .where(
          and(
            eq(issues.companyId, companyId),
            eq(issues.status, "blocked"),
          ),
        )
        .orderBy(desc(issues.updatedAt));

      // Pending approvals count
      const pendingApprovalsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(approvals)
        .where(
          and(eq(approvals.companyId, companyId), eq(approvals.status, "pending")),
        )
        .then((rows) => Number(rows[0]?.count ?? 0));

      // Month spend
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthSpendCents = await db
        .select({ total: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int` })
        .from(costEvents)
        .where(
          and(
            eq(costEvents.companyId, companyId),
            sql`${costEvents.occurredAt} >= ${monthStart}`,
          ),
        )
        .then((rows) => Number(rows[0]?.total ?? 0));

      // Unverified assumption count
      const unverifiedAssumptionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(assumptionEntries)
        .where(
          and(
            eq(assumptionEntries.companyId, companyId),
            eq(assumptionEntries.verificationStatus, "unverified"),
          ),
        )
        .then((rows) => Number(rows[0]?.count ?? 0));

      // Risk highlights from pending decisions
      const riskHighlights = pendingDecisions
        .filter((d) => d.riskSummary)
        .map((d) => ({ decisionId: d.id, riskSummary: d.riskSummary }));

      return {
        companyId,
        pushing: activePackets,
        judgment: {
          decisions: pendingDecisions,
          bundles: pendingBundles,
        },
        results: completedBundles,
        blocked: blockedIssues,
        summary: {
          activePackets: activePackets.length,
          pendingBundles: pendingBundles.length,
          pendingDecisions: pendingDecisions.length,
          pendingApprovals: pendingApprovalsCount,
          blockedIssues: blockedIssues.length,
          monthSpendCents,
          monthBudgetCents: company.budgetMonthlyCents,
          unverifiedAssumptionCount,
          riskHighlights,
        },
      };
    },
  };
}
