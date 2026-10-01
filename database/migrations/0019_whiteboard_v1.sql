CREATE TABLE "whiteboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"title" text NOT NULL,
	"external_reference" text,
	"status" text DEFAULT 'active' NOT NULL,
	"current_revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whiteboards_status_check" CHECK ("whiteboards"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "whiteboard_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whiteboards" ADD CONSTRAINT "whiteboards_integration_tenant_fk" FOREIGN KEY ("organization_id","workspace_id","integration_id") REFERENCES "public"."integrations"("organization_id","workspace_id","id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "whiteboards_id_workspace_unique" ON "whiteboards" USING btree ("id","workspace_id");
--> statement-breakpoint
ALTER TABLE "whiteboard_snapshots" ADD CONSTRAINT "whiteboard_snapshots_board_workspace_fk" FOREIGN KEY ("board_id","workspace_id") REFERENCES "public"."whiteboards"("id","workspace_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "whiteboard_snapshots_board_revision_unique" ON "whiteboard_snapshots" USING btree ("board_id","revision");
--> statement-breakpoint
CREATE UNIQUE INDEX "whiteboard_snapshots_id_workspace_unique" ON "whiteboard_snapshots" USING btree ("id","workspace_id")