import { pgTable, uuid, text, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { deliverableBundles } from "./deliverable_bundles.js";
import { agents } from "./agents.js";

export const decisionPackages = pgTable(
  "decision_packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    bundleId: uuid("bundle_id").notNull().references(() => deliverableBundles.id),
    ceoAssessment: text("ceo_assessment"),
    riskSummary: text("risk_summary"),
    assumptionsSnapshot: jsonb("assumptions_snapshot").$type<Record<string, unknown>[]>(),
    decisionOptions: jsonb("decision_options").$type<
      { label: string; description: string; recommended: boolean }[]
    >(),
    status: text("status").notNull().default("pending"),
    decidedOption: text("decided_option"),
    decidedByUserId: text("decided_by_user_id"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    deadline: timestamp("deadline", { withTimezone: true }),
    createdByAgentId: uuid("created_by_agent_id").references(() => agents.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bundleUniqueIdx: uniqueIndex("decision_packages_bundle_unique_idx").on(table.bundleId),
    companyStatusIdx: index("decision_packages_company_status_idx").on(table.companyId, table.status),
    companyCreatedIdx: index("decision_packages_company_created_idx").on(table.companyId, table.createdAt),
  }),
);
