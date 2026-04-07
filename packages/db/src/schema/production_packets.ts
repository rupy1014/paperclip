import { pgTable, uuid, text, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { issues } from "./issues.js";
import { projects } from "./projects.js";
import { agents } from "./agents.js";

export const productionPackets = pgTable(
  "production_packets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    issueId: uuid("issue_id").notNull().references(() => issues.id),
    projectId: uuid("project_id").references(() => projects.id),
    status: text("status").notNull().default("draft"),
    ownerAgentId: uuid("owner_agent_id").references(() => agents.id),
    createdByAgentId: uuid("created_by_agent_id").references(() => agents.id),
    createdByUserId: text("created_by_user_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    submittedForReviewAt: timestamp("submitted_for_review_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("production_packets_company_status_idx").on(
      table.companyId,
      table.status,
    ),
    issueUniqueIdx: uniqueIndex("production_packets_issue_unique_idx").on(table.issueId),
    companyProjectIdx: index("production_packets_company_project_idx").on(
      table.companyId,
      table.projectId,
    ),
    ownerAgentIdx: index("production_packets_owner_agent_idx").on(
      table.companyId,
      table.ownerAgentId,
      table.status,
    ),
  }),
);
