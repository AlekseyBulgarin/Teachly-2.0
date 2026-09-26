INSERT INTO "organizations" ("id", "name", "status", "created_at", "updated_at")
VALUES ('00000000-0000-4000-8000-000000000009', 'Teachly Compatibility Organization', 'active', now(), now())
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "workspaces" ("id", "organization_id", "name", "status", "created_at", "updated_at")
VALUES ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000009', 'Teachly Compatibility Workspace', 'active', now(), now())
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_assignment_task_version_fk";--> statement-breakpoint
ALTER TABLE "results" DROP CONSTRAINT "results_submission_attempt_fk";--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_events" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "task_versions" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
UPDATE "courses" SET "workspace_id" = '00000000-0000-4000-8000-000000000010';--> statement-breakpoint
UPDATE "tasks" SET "workspace_id" = "courses"."workspace_id"
FROM "courses" WHERE "courses"."id" = "tasks"."course_id";--> statement-breakpoint
UPDATE "task_versions" SET "workspace_id" = "tasks"."workspace_id"
FROM "tasks" WHERE "tasks"."id" = "task_versions"."task_id";--> statement-breakpoint
UPDATE "assignments" SET "workspace_id" = "task_versions"."workspace_id"
FROM "task_versions" WHERE "task_versions"."id" = "assignments"."task_version_id";--> statement-breakpoint
UPDATE "attempts" SET "workspace_id" = "assignments"."workspace_id"
FROM "assignments" WHERE "assignments"."id" = "attempts"."assignment_id";--> statement-breakpoint
UPDATE "submissions" SET "workspace_id" = "attempts"."workspace_id"
FROM "attempts" WHERE "attempts"."id" = "submissions"."attempt_id";--> statement-breakpoint
UPDATE "results" SET "workspace_id" = "attempts"."workspace_id"
FROM "attempts" WHERE "attempts"."id" = "results"."attempt_id";--> statement-breakpoint
ALTER TABLE "assignments" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task_versions" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_id_workspace_unique" ON "assignments" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_id_task_version_workspace_unique" ON "assignments" USING btree ("id","task_version_id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_id_workspace_unique" ON "attempts" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_id_workspace_unique" ON "courses" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_attempt_id_id_workspace_unique" ON "submissions" USING btree ("attempt_id","id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_versions_id_workspace_unique" ON "task_versions" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_id_workspace_unique" ON "tasks" USING btree ("id","workspace_id");--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_task_version_workspace_fk" FOREIGN KEY ("task_version_id","workspace_id") REFERENCES "public"."task_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_assignment_workspace_fk" FOREIGN KEY ("assignment_id","workspace_id") REFERENCES "public"."assignments"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_task_version_workspace_fk" FOREIGN KEY ("task_version_id","workspace_id") REFERENCES "public"."task_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_assignment_task_version_fk" FOREIGN KEY ("assignment_id","task_version_id","workspace_id") REFERENCES "public"."assignments"("id","task_version_id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_attempt_workspace_fk" FOREIGN KEY ("attempt_id","workspace_id") REFERENCES "public"."attempts"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_submission_attempt_fk" FOREIGN KEY ("attempt_id","submission_id","workspace_id") REFERENCES "public"."submissions"("attempt_id","id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_attempt_workspace_fk" FOREIGN KEY ("attempt_id","workspace_id") REFERENCES "public"."attempts"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_versions" ADD CONSTRAINT "task_versions_task_workspace_fk" FOREIGN KEY ("task_id","workspace_id") REFERENCES "public"."tasks"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_course_workspace_fk" FOREIGN KEY ("course_id","workspace_id") REFERENCES "public"."courses"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
