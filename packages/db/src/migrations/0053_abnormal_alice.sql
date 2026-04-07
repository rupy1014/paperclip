CREATE TABLE "gate_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"scope_type" text NOT NULL,
	"scope_id" uuid NOT NULL,
	"action" text NOT NULL,
	"fulfiller_type" text DEFAULT 'board' NOT NULL,
	"fulfiller_id" text,
	"mode" text DEFAULT 'blocking' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gate_policies" ADD CONSTRAINT "gate_policies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gate_policies_company_scope_action_unique_idx" ON "gate_policies" USING btree ("company_id","scope_type","scope_id","action");--> statement-breakpoint
CREATE INDEX "gate_policies_company_scope_active_idx" ON "gate_policies" USING btree ("company_id","scope_type","scope_id","is_active");--> statement-breakpoint
CREATE INDEX "gate_policies_company_action_idx" ON "gate_policies" USING btree ("company_id","action");