ALTER TABLE "attempts" ALTER COLUMN "assignment_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "submission_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_one_per_attempt" ON "submissions" USING btree ("attempt_id");--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_submission_id_unique" UNIQUE("submission_id");--> statement-breakpoint
ALTER TABLE "task_versions" ADD CONSTRAINT "task_versions_published_date" CHECK ("task_versions"."status" <> 'published' OR "task_versions"."published_at" IS NOT NULL);