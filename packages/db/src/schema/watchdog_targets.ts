import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { projects } from "./projects.js";
import { agents } from "./agents.js";
import type { WatchdogServiceConfig } from "@paperclipai/shared";

export const watchdogTargets = pgTable(
  "watchdog_targets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    agentId: uuid("agent_id").notNull().references(() => agents.id),
    name: text("name").notNull(),
    serviceType: text("service_type").notNull(), // 'launchd' | 'systemd' | 'pm2' | 'custom'
    serviceConfig: jsonb("service_config").$type<WatchdogServiceConfig>().notNull(),
    status: text("status").notNull().default("active"), // 'active' | 'paused' | 'disabled'
    currentRecoveryLevel: text("current_recovery_level").notNull().default("none"), // 'none' | 'L1' | 'L2' | 'L3'
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    lastHealthyAt: timestamp("last_healthy_at", { withTimezone: true }),
    lastIncidentAt: timestamp("last_incident_at", { withTimezone: true }),
    lastRecoveryAt: timestamp("last_recovery_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("watchdog_targets_company_status_idx").on(table.companyId, table.status),
    companyAgentIdx: index("watchdog_targets_company_agent_idx").on(table.companyId, table.agentId),
  }),
);
