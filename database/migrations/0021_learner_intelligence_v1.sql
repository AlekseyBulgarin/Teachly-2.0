ALTER TABLE "attempts" ADD COLUMN "integration_id" uuid;
--> statement-breakpoint
ALTER TABLE "learning_events" ADD COLUMN "integration_id" uuid;
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
UPDATE "attempts" AS a
SET "integration_id" = ts."integration_id"
FROM "trainer_session_items" AS tsi
INNER JOIN "trainer_sessions" AS ts
  ON ts."id" = tsi."session_id" AND ts."workspace_id" = tsi."workspace_id"
WHERE tsi."attempt_id" = a."id"
  AND tsi."workspace_id" = a."workspace_id"
  AND a."integration_id" IS NULL;
--> statement-breakpoint
UPDATE "learning_events" AS le
SET "integration_id" = ero."integration_id"
FROM "external_result_observations" AS ero
WHERE le."source_type" = 'external_result_observation'
  AND le."source_id" = ero."id"
  AND le."workspace_id" = ero."workspace_id"
  AND le."integration_id" IS NULL;
--> statement-breakpoint
UPDATE "learning_events" AS le
SET "integration_id" = ts."integration_id"
FROM "trainer_session_items" AS tsi
INNER JOIN "trainer_sessions" AS ts
  ON ts."id" = tsi."session_id" AND ts."workspace_id" = tsi."workspace_id"
WHERE le."source_type" = 'result'
  AND le."source_id" = tsi."result_id"
  AND le."workspace_id" = tsi."workspace_id"
  AND le."integration_id" IS NULL;
--> statement-breakpoint
UPDATE "learning_events" AS le
SET "integration_id" = ts."integration_id"
FROM "submissions" AS s
INNER JOIN "trainer_session_items" AS tsi
  ON tsi."attempt_id" = s."attempt_id" AND tsi."workspace_id" = s."workspace_id"
INNER JOIN "trainer_sessions" AS ts
  ON ts."id" = tsi."session_id" AND ts."workspace_id" = tsi."workspace_id"
WHERE le."source_type" = 'submission'
  AND le."source_id" = s."id"
  AND le."workspace_id" = s."workspace_id"
  AND le."integration_id" IS NULL;
--> statement-breakpoint
CREATE INDEX "attempts_learner_intelligence_idx" ON "attempts" USING btree ("workspace_id", "integration_id", "student_id", "started_at" DESC, "id" DESC);
--> statement-breakpoint
CREATE INDEX "learning_events_learner_intelligence_idx" ON "learning_events" USING btree ("workspace_id", "integration_id", "learner_id", "occurred_at" DESC, "id" DESC);
--> statement-breakpoint
CREATE INDEX "skill_evidence_learner_timeline_idx" ON "skill_evidence" USING btree ("workspace_id", "learner_id", "occurred_at" DESC, "id" DESC);
--> statement-breakpoint
CREATE INDEX "trainer_sessions_learner_intelligence_idx" ON "trainer_sessions" USING btree ("workspace_id", "integration_id", "external_user_id", "started_at" DESC, "id" DESC);
