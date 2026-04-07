CREATE TABLE "deliverable_bundle_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"item_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"annotation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliverable_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"packet_id" uuid NOT NULL,
	"title" text NOT NULL,
	"ceo_summary" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"decision_note" text,
	"decided_by_user_id" text,
	"decided_at" timestamp with time zone,
	"presented_at" timestamp with time zone,
	"created_by_agent_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deliverable_bundle_items" ADD CONSTRAINT "deliverable_bundle_items_bundle_id_deliverable_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."deliverable_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverable_bundles" ADD CONSTRAINT "deliverable_bundles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverable_bundles" ADD CONSTRAINT "deliverable_bundles_packet_id_production_packets_id_fk" FOREIGN KEY ("packet_id") REFERENCES "public"."production_packets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverable_bundles" ADD CONSTRAINT "deliverable_bundles_created_by_agent_id_agents_id_fk" FOREIGN KEY ("created_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deliverable_bundle_items_unique_idx" ON "deliverable_bundle_items" USING btree ("bundle_id","item_type","item_id");--> statement-breakpoint
CREATE INDEX "deliverable_bundle_items_bundle_sort_idx" ON "deliverable_bundle_items" USING btree ("bundle_id","sort_order");--> statement-breakpoint
CREATE INDEX "deliverable_bundles_company_status_idx" ON "deliverable_bundles" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "deliverable_bundles_packet_idx" ON "deliverable_bundles" USING btree ("packet_id");--> statement-breakpoint
CREATE INDEX "deliverable_bundles_company_created_idx" ON "deliverable_bundles" USING btree ("company_id","created_at");