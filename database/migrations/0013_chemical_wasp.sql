ALTER TYPE "public"."membership_role" ADD VALUE 'content_editor';--> statement-breakpoint
CREATE TABLE "task_source_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"task_source_id" uuid NOT NULL,
	"external_task_id" text NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"checksum" text NOT NULL,
	"imported_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"integration_id" uuid,
	"name" text NOT NULL,
	"source_type" text NOT NULL,
	"mode" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_sources_mode_check" CHECK ("task_sources"."mode" IN ('imported_snapshot', 'external_reference')),
	CONSTRAINT "task_sources_status_check" CHECK ("task_sources"."status" IN ('active', 'disabled'))
);
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "subject_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "course_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "topic_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "skill_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "task_versions" ADD COLUMN "raw_snapshot_id" uuid;--> statement-breakpoint
ALTER TABLE "task_versions" ADD COLUMN "published_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "task_source_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "external_task_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "task_sources_id_workspace_unique" ON "task_sources" USING btree ("id","workspace_id");--> statement-breakpoint
ALTER TABLE "task_source_snapshots" ADD CONSTRAINT "task_source_snapshots_imported_by_user_id_users_id_fk" FOREIGN KEY ("imported_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_source_snapshots" ADD CONSTRAINT "task_snapshots_task_workspace_fk" FOREIGN KEY ("task_id","workspace_id") REFERENCES "public"."tasks"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_source_snapshots" ADD CONSTRAINT "task_snapshots_source_workspace_fk" FOREIGN KEY ("task_source_id","workspace_id") REFERENCES "public"."task_sources"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_sources" ADD CONSTRAINT "task_sources_workspace_fk" FOREIGN KEY ("workspace_id","organization_id") REFERENCES "public"."workspaces"("id","organization_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_sources" ADD CONSTRAINT "task_sources_integration_fk" FOREIGN KEY ("organization_id","workspace_id","integration_id") REFERENCES "public"."integrations"("organization_id","workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "task_snapshots_task_checksum_unique" ON "task_source_snapshots" USING btree ("task_id","checksum");--> statement-breakpoint
CREATE UNIQUE INDEX "task_snapshots_id_task_workspace_unique" ON "task_source_snapshots" USING btree ("id","task_id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_sources_id_org_workspace_unique" ON "task_sources" USING btree ("id","organization_id","workspace_id");--> statement-breakpoint
ALTER TABLE "task_versions" ADD CONSTRAINT "task_versions_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_versions" ADD CONSTRAINT "task_versions_snapshot_lineage_fk" FOREIGN KEY ("raw_snapshot_id","task_id","workspace_id") REFERENCES "public"."task_source_snapshots"("id","task_id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_source_workspace_fk" FOREIGN KEY ("task_source_id","workspace_id") REFERENCES "public"."task_sources"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_source_external_unique" ON "tasks" USING btree ("workspace_id","task_source_id","external_task_id") WHERE "tasks"."task_source_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_source_identity_check" CHECK (("tasks"."task_source_id" IS NULL) = ("tasks"."external_task_id" IS NULL));
