CREATE TYPE "public"."ai_request_status" AS ENUM('started', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "ai_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"learner_id" uuid,
	"capability" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_hash" text NOT NULL,
	"policy_version" text NOT NULL,
	"prompt_version" text NOT NULL,
	"status" "ai_request_status" DEFAULT 'started' NOT NULL,
	"provider" text,
	"model" text,
	"context_references" jsonb NOT NULL,
	"structured_output" jsonb,
	"failure_category" text,
	"failure_message" text,
	"latency_ms" integer,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"completed_at" timestamptz,
	CONSTRAINT "ai_requests_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict,
	CONSTRAINT "ai_requests_learner_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_requests_id_workspace_unique" ON "ai_requests" USING btree ("id", "workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_requests_idempotency_unique" ON "ai_requests" USING btree ("workspace_id", "capability", "idempotency_key");--> statement-breakpoint
CREATE INDEX "ai_requests_workspace_status_idx" ON "ai_requests" USING btree ("workspace_id", "status", "created_at");--> statement-breakpoint
CREATE TABLE "ai_usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"ai_request_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"estimated_cost_micros" integer,
	"metadata" jsonb,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_records_request_workspace_fk" FOREIGN KEY ("ai_request_id", "workspace_id") REFERENCES "public"."ai_requests"("id", "workspace_id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_records_request_unique" ON "ai_usage_records" USING btree ("workspace_id", "ai_request_id");--> statement-breakpoint
CREATE TABLE "ai_evaluation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"ai_request_id" uuid NOT NULL,
	"evaluator_version" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "ai_evaluation_records_request_workspace_fk" FOREIGN KEY ("ai_request_id", "workspace_id") REFERENCES "public"."ai_requests"("id", "workspace_id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_evaluation_records_request_unique" ON "ai_evaluation_records" USING btree ("workspace_id", "ai_request_id");
