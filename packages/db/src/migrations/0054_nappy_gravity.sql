CREATE TABLE "assumption_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"packet_id" uuid,
	"agent_id" uuid,
	"statement" text NOT NULL,
	"confidence" text DEFAULT 'medium' NOT NULL,
	"source_description" text,
	"verification_method" text,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"verified_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"trigger_type" text NOT NULL,
	"packet_id" uuid,
	"source_agent_id" uuid,
	"target_agent_ids" jsonb,
	"expected_outcome" text,
	"actual_outcome" text,
	"deviation_magnitude" text,
	"retro_issue_id" uuid,
	"constraint_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assumption_entries" ADD CONSTRAINT "assumption_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assumption_entries" ADD CONSTRAINT "assumption_entries_packet_id_production_packets_id_fk" FOREIGN KEY ("packet_id") REFERENCES "public"."production_packets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assumption_entries" ADD CONSTRAINT "assumption_entries_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_packet_id_production_packets_id_fk" FOREIGN KEY ("packet_id") REFERENCES "public"."production_packets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_source_agent_id_agents_id_fk" FOREIGN KEY ("source_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_retro_issue_id_issues_id_fk" FOREIGN KEY ("retro_issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assumption_entries_company_status_idx" ON "assumption_entries" USING btree ("company_id","verification_status");--> statement-breakpoint
CREATE INDEX "assumption_entries_company_source_idx" ON "assumption_entries" USING btree ("company_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "assumption_entries_packet_idx" ON "assumption_entries" USING btree ("packet_id");--> statement-breakpoint
CREATE INDEX "learning_events_company_status_idx" ON "learning_events" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "learning_events_company_trigger_idx" ON "learning_events" USING btree ("company_id","trigger_type");--> statement-breakpoint
CREATE INDEX "learning_events_packet_idx" ON "learning_events" USING btree ("packet_id");