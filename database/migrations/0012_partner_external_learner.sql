ALTER TABLE "external_users" ADD COLUMN "learner_id" uuid;--> statement-breakpoint
ALTER TABLE "external_users" ADD CONSTRAINT "external_users_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "external_users_workspace_integration_learner_unique" ON "external_users" USING btree ("workspace_id","integration_id","learner_id") WHERE "external_users"."learner_id" IS NOT NULL;
