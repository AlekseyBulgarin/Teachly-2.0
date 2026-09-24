CREATE UNIQUE INDEX "submissions_attempt_id_id_unique" ON "submissions" USING btree ("attempt_id","id");--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_submission_attempt_fk" FOREIGN KEY ("attempt_id","submission_id") REFERENCES "public"."submissions"("attempt_id","id") ON DELETE no action ON UPDATE no action;
