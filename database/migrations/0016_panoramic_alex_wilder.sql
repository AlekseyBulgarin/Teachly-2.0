CREATE TABLE "variant_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_version_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"task_version_id" uuid,
	"external_task_id" text,
	"required" boolean DEFAULT true NOT NULL,
	"resolution_status" text DEFAULT 'unresolved' NOT NULL,
	"section" text,
	"metadata" jsonb NOT NULL,
	CONSTRAINT "variant_items_resolution_check" CHECK (("variant_items"."resolution_status" = 'resolved' AND "variant_items"."task_version_id" IS NOT NULL) OR ("variant_items"."resolution_status" = 'unresolved'))
);
--> statement-breakpoint
CREATE TABLE "variant_source_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_source_id" uuid NOT NULL,
	"external_variant_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"checksum" text NOT NULL,
	"imported_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variant_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"title" text,
	"description" text,
	"metadata" jsonb NOT NULL,
	"raw_snapshot_id" uuid,
	"provenance" jsonb NOT NULL,
	"published_by_user_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "variant_versions_status_check" CHECK ("variant_versions"."status" IN ('draft', 'published', 'archived')),
	CONSTRAINT "variant_versions_published_date_check" CHECK ("variant_versions"."status" <> 'published' OR "variant_versions"."published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"task_source_id" uuid,
	"external_variant_id" text,
	"source_kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "variant_items_id_workspace_unique" ON "variant_items" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_items_version_position_unique" ON "variant_items" USING btree ("variant_version_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_snapshots_id_variant_workspace_unique" ON "variant_source_snapshots" USING btree ("id","variant_id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_snapshots_source_idempotency_unique" ON "variant_source_snapshots" USING btree ("workspace_id","task_source_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_versions_variant_version_unique" ON "variant_versions" USING btree ("variant_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_versions_id_workspace_unique" ON "variant_versions" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_source_external_unique" ON "variants" USING btree ("workspace_id","task_source_id","external_variant_id") WHERE "variants"."task_source_id" IS NOT NULL AND "variants"."external_variant_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "variants_id_workspace_unique" ON "variants" USING btree ("id","workspace_id");--> statement-breakpoint
ALTER TABLE "variant_items" ADD CONSTRAINT "variant_items_version_workspace_fk" FOREIGN KEY ("variant_version_id","workspace_id") REFERENCES "public"."variant_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_items" ADD CONSTRAINT "variant_items_task_version_workspace_fk" FOREIGN KEY ("task_version_id","workspace_id") REFERENCES "public"."task_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_source_snapshots" ADD CONSTRAINT "variant_source_snapshots_imported_by_user_id_users_id_fk" FOREIGN KEY ("imported_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_source_snapshots" ADD CONSTRAINT "variant_snapshots_variant_workspace_fk" FOREIGN KEY ("variant_id","workspace_id") REFERENCES "public"."variants"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_source_snapshots" ADD CONSTRAINT "variant_snapshots_source_workspace_fk" FOREIGN KEY ("task_source_id","workspace_id") REFERENCES "public"."task_sources"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_versions" ADD CONSTRAINT "variant_versions_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_versions" ADD CONSTRAINT "variant_versions_variant_workspace_fk" FOREIGN KEY ("variant_id","workspace_id") REFERENCES "public"."variants"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_versions" ADD CONSTRAINT "variant_versions_snapshot_lineage_fk" FOREIGN KEY ("raw_snapshot_id","variant_id","workspace_id") REFERENCES "public"."variant_source_snapshots"("id","variant_id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_workspace_fk" FOREIGN KEY ("workspace_id","organization_id") REFERENCES "public"."workspaces"("id","organization_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_source_workspace_fk" FOREIGN KEY ("task_source_id","workspace_id") REFERENCES "public"."task_sources"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE FUNCTION prevent_published_variant_version_mutation() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'Published variant versions are immutable';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER variant_versions_published_immutable
  BEFORE UPDATE OR DELETE ON "variant_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_published_variant_version_mutation();--> statement-breakpoint
CREATE FUNCTION prevent_published_variant_item_mutation() RETURNS trigger AS $$
DECLARE
  target_variant_version_id uuid;
BEGIN
  target_variant_version_id := CASE WHEN TG_OP = 'INSERT' THEN NEW.variant_version_id ELSE OLD.variant_version_id END;
  IF EXISTS (SELECT 1 FROM variant_versions WHERE id = target_variant_version_id AND status = 'published') THEN
    RAISE EXCEPTION 'Published variant versions are immutable';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER variant_items_published_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON "variant_items"
  FOR EACH ROW EXECUTE FUNCTION prevent_published_variant_item_mutation();
