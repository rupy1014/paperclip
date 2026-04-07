import { index, pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { productionPackets } from "./production_packets.js";
import { agents } from "./agents.js";
import { issues } from "./issues.js";

export const learningEvents = pgTable(
  "learning_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    triggerType: text("trigger_type").notNull(), // 'deviation_detected' | 'assumption_falsified' | 'retro_generated'
    packetId: uuid("packet_id").references(() => productionPackets.id),
    sourceAgentId: uuid("source_agent_id").references(() => agents.id),
    targetAgentIds: jsonb("target_agent_ids").$type<string[]>(),
    expectedOutcome: text("expected_outcome"),
    actualOutcome: text("actual_outcome"),
    deviationMagnitude: text("deviation_magnitude"), // 'minor' | 'significant' | 'major'
    retroIssueId: uuid("retro_issue_id").references(() => issues.id),
    constraintText: text("constraint_text"),
    status: text("status").notNull().default("pending"), // pending | retro_created | propagated | dismissed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("learning_events_company_status_idx").on(
      table.companyId,
      table.status,
    ),
    companyTriggerIdx: index("learning_events_company_trigger_idx").on(
      table.companyId,
      table.triggerType,
    ),
    packetIdx: index("learning_events_packet_idx").on(table.packetId),
  }),
);
