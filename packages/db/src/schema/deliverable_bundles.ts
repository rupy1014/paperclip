import { pgTable, uuid, text, timestamp, jsonb, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { productionPackets } from "./production_packets.js";
import { agents } from "./agents.js";

export const deliverableBundles = pgTable(
  "deliverable_bundles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    packetId: uuid("packet_id").notNull().references(() => productionPackets.id),
    title: text("title").notNull(),
    ceoSummary: text("ceo_summary"),
    status: text("status").notNull().default("pending"),
    decisionNote: text("decision_note"),
    decidedByUserId: text("decided_by_user_id"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    presentedAt: timestamp("presented_at", { withTimezone: true }),
    createdByAgentId: uuid("created_by_agent_id").references(() => agents.id),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("deliverable_bundles_company_status_idx").on(
      table.companyId,
      table.status,
    ),
    packetIdx: index("deliverable_bundles_packet_idx").on(table.packetId),
    companyCreatedIdx: index("deliverable_bundles_company_created_idx").on(
      table.companyId,
      table.createdAt,
    ),
  }),
);

export const deliverableBundleItems = pgTable(
  "deliverable_bundle_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bundleId: uuid("bundle_id")
      .notNull()
      .references(() => deliverableBundles.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(), // 'document' | 'work_product' | 'issue'
    itemId: uuid("item_id").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    annotation: text("annotation"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bundleItemUniqueIdx: uniqueIndex("deliverable_bundle_items_unique_idx").on(
      table.bundleId,
      table.itemType,
      table.itemId,
    ),
    bundleSortIdx: index("deliverable_bundle_items_bundle_sort_idx").on(
      table.bundleId,
      table.sortOrder,
    ),
  }),
);
