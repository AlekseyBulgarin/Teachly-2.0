CREATE TABLE "whiteboard_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	"task_version_id" uuid,
	"theory_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whiteboard_resources_type_reference_check" CHECK ((("resource_type" = 'task' AND "task_version_id" IS NOT NULL AND "theory_version_id" IS NULL) OR ("resource_type" = 'theory' AND "theory_version_id" IS NOT NULL AND "task_version_id" IS NULL)))
);
--> statement-breakpoint
ALTER TABLE "whiteboard_resources" ADD CONSTRAINT "whiteboard_resources_board_workspace_fk" FOREIGN KEY ("board_id","workspace_id") REFERENCES "public"."whiteboards"("id","workspace_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "whiteboard_resources" ADD CONSTRAINT "whiteboard_resources_task_version_workspace_fk" FOREIGN KEY ("task_version_id","workspace_id") REFERENCES "public"."task_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "whiteboard_resources" ADD CONSTRAINT "whiteboard_resources_theory_version_workspace_fk" FOREIGN KEY ("theory_version_id","workspace_id") REFERENCES "public"."theory_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "whiteboard_resources_board_task_unique" ON "whiteboard_resources" USING btree ("board_id","task_version_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "whiteboard_resources_board_theory_unique" ON "whiteboard_resources" USING btree ("board_id","theory_version_id")