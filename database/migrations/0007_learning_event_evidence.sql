CREATE TYPE "public"."learning_event_type" AS ENUM('attempt_submitted', 'result_recorded');--> statement-breakpoint
CREATE TABLE "learning_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"event_type" "learning_event_type" NOT NULL,
	"learner_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"task_version_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"outcome" "result_outcome",
	"evaluation_rule" text,
	"correlation_id" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"learning_event_id" uuid NOT NULL,
	"rule" text NOT NULL,
	"outcome" "result_outcome" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "learning_events_id_workspace_unique" ON "learning_events" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_events_source_unique" ON "learning_events" USING btree ("workspace_id","event_type","source_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_evidence_id_workspace_unique" ON "skill_evidence" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_evidence_event_rule_unique" ON "skill_evidence" USING btree ("workspace_id","learning_event_id","rule");--> statement-breakpoint
CREATE INDEX "skill_evidence_learner_skill_idx" ON "skill_evidence" USING btree ("workspace_id","learner_id","skill_id","occurred_at");--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_task_version_workspace_fk" FOREIGN KEY ("task_version_id","workspace_id") REFERENCES "public"."task_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_course_workspace_fk" FOREIGN KEY ("course_id","workspace_id") REFERENCES "public"."courses"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_workspace_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_course_workspace_fk" FOREIGN KEY ("course_id","workspace_id") REFERENCES "public"."courses"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_event_workspace_fk" FOREIGN KEY ("learning_event_id","workspace_id") REFERENCES "public"."learning_events"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
