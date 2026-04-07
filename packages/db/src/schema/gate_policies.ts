import { boolean, index, pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const gatePolicies = pgTable(
  "gate_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    scopeType: text("scope_type").notNull(), // 'company' | 'project' | 'agent'
    scopeId: uuid("scope_id").notNull(),
    action: text("action").notNull(), // 'publish' | 'budget_exception' | 'release' | 'deploy' | 'strategy_change'
    fulfillerType: text("fulfiller_type").notNull().default("board"), // 'board' | 'ceo_agent' | 'user'
    fulfillerId: text("fulfiller_id"),
    mode: text("mode").notNull().default("blocking"), // 'blocking' | 'advisory'
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyScopeActionUniqueIdx: uniqueIndex("gate_policies_company_scope_action_unique_idx").on(
      table.companyId,
      table.scopeType,
      table.scopeId,
      table.action,
    ),
    companyScopeActiveIdx: index("gate_policies_company_scope_active_idx").on(
      table.companyId,
      table.scopeType,
      table.scopeId,
      table.isActive,
    ),
    companyActionIdx: index("gate_policies_company_action_idx").on(
      table.companyId,
      table.action,
    ),
  }),
);
