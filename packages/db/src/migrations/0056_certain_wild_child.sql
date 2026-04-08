CREATE TABLE "watchdog_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"project_id" uuid,
	"agent_id" uuid NOT NULL,
	"name" text NOT NULL,
	"service_type" text NOT NULL,
	"service_config" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_recovery_level" text DEFAULT 'none' NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_healthy_at" timestamp with time zone,
	"last_incident_at" timestamp with time zone,
	"last_recovery_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "watchdog_targets" ADD CONSTRAINT "watchdog_targets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchdog_targets" ADD CONSTRAINT "watchdog_targets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchdog_targets" ADD CONSTRAINT "watchdog_targets_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "watchdog_targets_company_status_idx" ON "watchdog_targets" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "watchdog_targets_company_agent_idx" ON "watchdog_targets" USING btree ("company_id","agent_id");