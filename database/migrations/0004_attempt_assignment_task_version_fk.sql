CREATE UNIQUE INDEX "assignments_id_task_version_unique" ON "assignments" USING btree ("id","task_version_id");--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_assignment_task_version_fk" FOREIGN KEY ("assignment_id","task_version_id") REFERENCES "public"."assignments"("id","task_version_id") ON DELETE restrict ON UPDATE no action;
