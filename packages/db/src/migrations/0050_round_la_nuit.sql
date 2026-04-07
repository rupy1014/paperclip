CREATE TABLE "production_packets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"issue_id" uuid NOT NULL,
	"project_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"owner_agent_id" uuid,
	"created_by_agent_id" uuid,
	"created_by_user_id" text,
	"started_at" timestamp with time zone,
	"submitted_for_review_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "production_packets" ADD CONSTRAINT "production_packets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_packets" ADD CONSTRAINT "production_packets_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_packets" ADD CONSTRAINT "production_packets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_packets" ADD CONSTRAINT "production_packets_owner_agent_id_agents_id_fk" FOREIGN KEY ("owner_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_packets" ADD CONSTRAINT "production_packets_created_by_agent_id_agents_id_fk" FOREIGN KEY ("created_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "production_packets_company_status_idx" ON "production_packets" USING btree ("company_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "production_packets_issue_unique_idx" ON "production_packets" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "production_packets_company_project_idx" ON "production_packets" USING btree ("company_id","project_id");--> statement-breakpoint
CREATE INDEX "production_packets_owner_agent_idx" ON "production_packets" USING btree ("company_id","owner_agent_id","status");