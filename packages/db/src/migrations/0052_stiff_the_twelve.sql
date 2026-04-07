CREATE TABLE "decision_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"bundle_id" uuid NOT NULL,
	"ceo_assessment" text,
	"risk_summary" text,
	"assumptions_snapshot" jsonb,
	"decision_options" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"decided_option" text,
	"decided_by_user_id" text,
	"decided_at" timestamp with time zone,
	"created_by_agent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decision_packages" ADD CONSTRAINT "decision_packages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_packages" ADD CONSTRAINT "decision_packages_bundle_id_deliverable_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."deliverable_bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_packages" ADD CONSTRAINT "decision_packages_created_by_agent_id_agents_id_fk" FOREIGN KEY ("created_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "decision_packages_bundle_unique_idx" ON "decision_packages" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "decision_packages_company_status_idx" ON "decision_packages" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "decision_packages_company_created_idx" ON "decision_packages" USING btree ("company_id","created_at");