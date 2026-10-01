CREATE TABLE "theory_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text,
	"subject_id" uuid,
	"course_id" uuid,
	"topic_id" uuid,
	"skill_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theory_materials_status_check" CHECK ("theory_materials"."status" IN ('draft', 'published'))
);
--> statement-breakpoint
CREATE TABLE "theory_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"content" jsonb NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_by_user_id" uuid,
	"published_by_user_id" uuid,
	"published_by_principal" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theory_versions_status_check" CHECK ("theory_versions"."status" IN ('draft', 'published')),
	CONSTRAINT "theory_versions_published_state_check" CHECK (("theory_versions"."status" = 'draft' AND "theory_versions"."published_at" IS NULL) OR ("theory_versions"."status" = 'published' AND "theory_versions"."published_at" IS NOT NULL AND "theory_versions"."published_by_principal" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "theory_material_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "theory_materials" ADD CONSTRAINT "theory_materials_workspace_fk" FOREIGN KEY ("workspace_id","organization_id") REFERENCES "public"."workspaces"("id","organization_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_materials" ADD CONSTRAINT "theory_materials_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_materials" ADD CONSTRAINT "theory_materials_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_materials" ADD CONSTRAINT "theory_materials_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_materials" ADD CONSTRAINT "theory_materials_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_materials" ADD CONSTRAINT "theory_materials_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_materials" ADD CONSTRAINT "theory_materials_course_workspace_fk" FOREIGN KEY ("course_id","workspace_id") REFERENCES "public"."courses"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "theory_materials_id_workspace_unique" ON "theory_materials" USING btree ("id","workspace_id");
--> statement-breakpoint
ALTER TABLE "theory_versions" ADD CONSTRAINT "theory_versions_material_workspace_fk" FOREIGN KEY ("material_id","workspace_id") REFERENCES "public"."theory_materials"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_versions" ADD CONSTRAINT "theory_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_versions" ADD CONSTRAINT "theory_versions_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_material_tasks" ADD CONSTRAINT "theory_material_tasks_material_workspace_fk" FOREIGN KEY ("material_id","workspace_id") REFERENCES "public"."theory_materials"("id","workspace_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "theory_material_tasks" ADD CONSTRAINT "theory_material_tasks_task_workspace_fk" FOREIGN KEY ("task_id","workspace_id") REFERENCES "public"."tasks"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "theory_versions_material_version_unique" ON "theory_versions" USING btree ("material_id","version");
--> statement-breakpoint
CREATE UNIQUE INDEX "theory_versions_id_workspace_unique" ON "theory_versions" USING btree ("id","workspace_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "theory_versions_one_draft_per_material_unique" ON "theory_versions" USING btree ("material_id") WHERE "theory_versions"."status" = 'draft';
--> statement-breakpoint
CREATE UNIQUE INDEX "theory_material_tasks_material_task_unique" ON "theory_material_tasks" USING btree ("material_id","task_id");
--> statement-breakpoint
CREATE FUNCTION prevent_published_theory_version_mutation() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'Published theory versions are immutable';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER theory_versions_published_immutable
  BEFORE UPDATE OR DELETE ON "theory_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_published_theory_version_mutation();
