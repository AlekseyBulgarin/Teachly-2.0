CREATE TYPE "public"."knowledge_document_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."knowledge_license_status" AS ENUM('unknown', 'allowed', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."knowledge_source_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."knowledge_version_status" AS ENUM('draft', 'approved', 'rejected', 'disabled', 'superseded');--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"section" text,
	"content" text NOT NULL,
	"content_checksum" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"raw_import_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"normalized_content" text NOT NULL,
	"content_checksum" text NOT NULL,
	"license_status" "knowledge_license_status" NOT NULL,
	"status" "knowledge_version_status" DEFAULT 'draft' NOT NULL,
	"approved_by_user_id" uuid,
	"approved_by_principal" text,
	"approved_at" timestamp with time zone,
	"approval_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_versions_approved_metadata_check" CHECK (
    "knowledge_document_versions"."status" <> 'approved'
    OR ("knowledge_document_versions"."approved_at" IS NOT NULL AND "knowledge_document_versions"."approved_by_principal" IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"document_key" text NOT NULL,
	"title" text NOT NULL,
	"status" "knowledge_document_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_raw_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"raw_content" text NOT NULL,
	"content_checksum" text NOT NULL,
	"source_reference" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"imported_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"source_type" text NOT NULL,
	"external_reference" text,
	"license_status" "knowledge_license_status" DEFAULT 'unknown' NOT NULL,
	"status" "knowledge_source_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_chunks_id_workspace_unique" ON "knowledge_chunks" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_chunks_version_ordinal_unique" ON "knowledge_chunks" USING btree ("workspace_id","document_version_id","ordinal");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_versions_id_workspace_unique" ON "knowledge_document_versions" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_versions_document_version_unique" ON "knowledge_document_versions" USING btree ("workspace_id","document_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_documents_id_workspace_unique" ON "knowledge_documents" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_documents_source_key_unique" ON "knowledge_documents" USING btree ("workspace_id","source_id","document_key");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_raw_imports_id_workspace_unique" ON "knowledge_raw_imports" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_raw_imports_idempotency_unique" ON "knowledge_raw_imports" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_sources_id_workspace_unique" ON "knowledge_sources" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_sources_workspace_reference_idx" ON "knowledge_sources" USING btree ("workspace_id","external_reference");--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_workspace_fk" FOREIGN KEY ("document_id","workspace_id") REFERENCES "public"."knowledge_documents"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_version_workspace_fk" FOREIGN KEY ("document_version_id","workspace_id") REFERENCES "public"."knowledge_document_versions"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_document_versions" ADD CONSTRAINT "knowledge_document_versions_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_document_versions" ADD CONSTRAINT "knowledge_versions_document_workspace_fk" FOREIGN KEY ("document_id","workspace_id") REFERENCES "public"."knowledge_documents"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_document_versions" ADD CONSTRAINT "knowledge_versions_raw_import_workspace_fk" FOREIGN KEY ("raw_import_id","workspace_id") REFERENCES "public"."knowledge_raw_imports"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_source_workspace_fk" FOREIGN KEY ("source_id","workspace_id") REFERENCES "public"."knowledge_sources"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_raw_imports" ADD CONSTRAINT "knowledge_raw_imports_imported_by_user_id_users_id_fk" FOREIGN KEY ("imported_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_raw_imports" ADD CONSTRAINT "knowledge_raw_imports_document_workspace_fk" FOREIGN KEY ("document_id","workspace_id") REFERENCES "public"."knowledge_documents"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;
