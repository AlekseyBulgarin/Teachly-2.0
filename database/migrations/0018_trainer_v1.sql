ALTER TABLE "attempts" ALTER COLUMN "assignment_id" DROP NOT NULL;
--> statement-breakpoint
CREATE TABLE "trainer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"external_user_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"subject_id" uuid,
	"course_id" uuid,
	"topic_id" uuid,
	"skill_id" uuid,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "trainer_sessions_status_check" CHECK ("trainer_sessions"."status" IN ('active', 'completed')),
	CONSTRAINT "trainer_sessions_completion_state_check" CHECK (("trainer_sessions"."status" = 'active' AND "trainer_sessions"."completed_at" IS NULL) OR ("trainer_sessions"."status" = 'completed' AND "trainer_sessions"."completed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "trainer_session_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"task_version_id" uuid NOT NULL,
	"attempt_id" uuid,
	"result_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trainer_session_items_status_check" CHECK ("trainer_session_items"."status" IN ('pending', 'started', 'submitted'))
);
--> statement-breakpoint
ALTER TABLE "trainer_sessions" ADD CONSTRAINT "trainer_sessions_integration_tenant_fk" FOREIGN KEY ("organization_id","workspace_id","integration_id") REFERENCES "public"."integrations"("organization_id","workspace_id","id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_sessions" ADD CONSTRAINT "trainer_sessions_external_user_id_external_users_id_fk" FOREIGN KEY ("external_user_id") REFERENCES "public"."external_users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_sessions" ADD CONSTRAINT "trainer_sessions_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_sessions" ADD CONSTRAINT "trainer_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_sessions" ADD CONSTRAINT "trainer_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_sessions" ADD CONSTRAINT "trainer_sessions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_sessions" ADD CONSTRAINT "trainer_sessions_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_sessions" ADD CONSTRAINT "trainer_sessions_course_workspace_fk" FOREIGN KEY ("course_id","workspace_id") REFERENCES "public"."courses"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "trainer_sessions_id_workspace_unique" ON "trainer_sessions" USING btree ("id","workspace_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "trainer_sessions_idempotency_unique" ON "trainer_sessions" USING btree ("workspace_id","integration_id","external_user_id","idempotency_key");
--> statement-breakpoint
ALTER TABLE "trainer_session_items" ADD CONSTRAINT "trainer_session_items_session_workspace_fk" FOREIGN KEY ("session_id","workspace_id") REFERENCES "public"."trainer_sessions"("id","workspace_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_session_items" ADD CONSTRAINT "trainer_session_items_task_version_workspace_fk" FOREIGN KEY ("task_version_id","workspace_id") REFERENCES "public"."task_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_session_items" ADD CONSTRAINT "trainer_session_items_attempt_workspace_fk" FOREIGN KEY ("attempt_id","workspace_id") REFERENCES "public"."attempts"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trainer_session_items" ADD CONSTRAINT "trainer_session_items_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "trainer_session_items_session_position_unique" ON "trainer_session_items" USING btree ("session_id","position");
--> statement-breakpoint
CREATE UNIQUE INDEX "trainer_session_items_session_task_version_unique" ON "trainer_session_items" USING btree ("session_id","task_version_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "trainer_session_items_id_workspace_unique" ON "trainer_session_items" USING btree ("id","workspace_id");
--> statement-breakpoint
CREATE FUNCTION prevent_completed_trainer_item_mutation() RETURNS trigger AS $$
DECLARE
  target_session_id uuid;
BEGIN
  target_session_id := CASE WHEN TG_OP = 'INSERT' THEN NEW.session_id ELSE OLD.session_id END;
  IF EXISTS (SELECT 1 FROM trainer_sessions WHERE id = target_session_id AND status = 'completed') THEN
    RAISE EXCEPTION 'Completed trainer sessions cannot accept item changes';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trainer_session_items_completed_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON "trainer_session_items"
  FOR EACH ROW EXECUTE FUNCTION prevent_completed_trainer_item_mutation();

