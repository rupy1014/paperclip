import { index, pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { productionPackets } from "./production_packets.js";
import { agents } from "./agents.js";

export const assumptionEntries = pgTable(
  "assumption_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    sourceType: text("source_type").notNull(), // 'document' | 'work_product' | 'decision_package'
    sourceId: uuid("source_id").notNull(),
    packetId: uuid("packet_id").references(() => productionPackets.id),
    agentId: uuid("agent_id").references(() => agents.id),
    statement: text("statement").notNull(),
    confidence: text("confidence").notNull().default("medium"), // low | medium | high
    sourceDescription: text("source_description"),
    source: text("source"), // 'estimate' | 'benchmark' | 'verified' (data provenance)
    verificationMethod: text("verification_method"),
    verificationStatus: text("verification_status").notNull().default("unverified"), // unverified | verified | falsified
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("assumption_entries_company_status_idx").on(
      table.companyId,
      table.verificationStatus,
    ),
    companySourceIdx: index("assumption_entries_company_source_idx").on(
      table.companyId,
      table.sourceType,
      table.sourceId,
    ),
    packetIdx: index("assumption_entries_packet_idx").on(table.packetId),
  }),
);
