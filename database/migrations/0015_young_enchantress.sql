CREATE TABLE "external_result_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"external_learner_id" text NOT NULL,
	"task_source_id" uuid NOT NULL,
	"external_task_id" text NOT NULL,
	"task_version_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"outcome" "result_outcome",
	"score" integer,
	"observed_at" timestamp with time zone NOT NULL,
	"source_metadata" jsonb NOT NULL,
	"learning_handoff" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "external_result_observations_handoff_check" CHECK ("external_result_observations"."learning_handoff" IN ('recorded', 'skipped_skill_unmapped'))
);
--> statement-breakpoint
CREATE TABLE "task_curriculum_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_source_id" uuid NOT NULL,
	"mapping_type" text NOT NULL,
	"external_value" text NOT NULL,
	"subject_id" uuid,
	"course_id" uuid,
	"topic_id" uuid,
	"skill_id" uuid,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_curriculum_mappings_type_check" CHECK ("task_curriculum_mappings"."mapping_type" IN ('subject', 'course', 'topic', 'skill', 'category', 'section'))
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "review_status" text DEFAULT 'evaluated' NOT NULL;--> statement-breakpoint
ALTER TABLE "external_result_observations" ADD CONSTRAINT "external_result_observations_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_result_observations" ADD CONSTRAINT "external_result_observations_integration_tenant_fk" FOREIGN KEY ("organization_id","workspace_id","integration_id") REFERENCES "public"."integrations"("organization_id","workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_result_observations" ADD CONSTRAINT "external_result_observations_source_workspace_fk" FOREIGN KEY ("task_source_id","workspace_id") REFERENCES "public"."task_sources"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_result_observations" ADD CONSTRAINT "external_result_observations_task_version_workspace_fk" FOREIGN KEY ("task_version_id","workspace_id") REFERENCES "public"."task_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_curriculum_mappings" ADD CONSTRAINT "task_curriculum_mappings_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_curriculum_mappings" ADD CONSTRAINT "task_curriculum_mappings_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_curriculum_mappings" ADD CONSTRAINT "task_curriculum_mappings_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_curriculum_mappings" ADD CONSTRAINT "task_curriculum_mappings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_curriculum_mappings" ADD CONSTRAINT "task_curriculum_mappings_source_tenant_fk" FOREIGN KEY ("task_source_id","organization_id","workspace_id") REFERENCES "public"."task_sources"("id","organization_id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_curriculum_mappings" ADD CONSTRAINT "task_curriculum_mappings_course_workspace_fk" FOREIGN KEY ("course_id","workspace_id") REFERENCES "public"."courses"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "external_result_observations_idempotency_unique" ON "external_result_observations" USING btree ("workspace_id","integration_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "external_result_observations_id_workspace_unique" ON "external_result_observations" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_curriculum_mappings_external_unique" ON "task_curriculum_mappings" USING btree ("workspace_id","task_source_id","mapping_type","external_value");--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_review_status_check" CHECK ("submissions"."review_status" IN ('evaluated', 'pending_manual_review'));