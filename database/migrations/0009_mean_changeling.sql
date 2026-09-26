CREATE TYPE "public"."knowledge_external_ai_permission" AS ENUM('not_reviewed', 'allowed', 'prohibited');--> statement-breakpoint
DROP INDEX "knowledge_raw_imports_idempotency_unique";--> statement-breakpoint
ALTER TABLE "knowledge_document_versions" ADD COLUMN "external_ai_permission" "knowledge_external_ai_permission" DEFAULT 'not_reviewed' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_versions_id_document_workspace_unique" ON "knowledge_document_versions" USING btree ("id","document_id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_versions_one_approved_per_document_unique" ON "knowledge_document_versions" USING btree ("workspace_id","document_id") WHERE "knowledge_document_versions"."status" = 'approved';--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_raw_imports_id_document_workspace_unique" ON "knowledge_raw_imports" USING btree ("id","document_id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_raw_imports_idempotency_unique" ON "knowledge_raw_imports" USING btree ("workspace_id","document_id","idempotency_key");--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_version_document_workspace_fk" FOREIGN KEY ("document_version_id","document_id","workspace_id") REFERENCES "public"."knowledge_document_versions"("id","document_id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_document_versions" ADD CONSTRAINT "knowledge_versions_raw_document_workspace_fk" FOREIGN KEY ("raw_import_id","document_id","workspace_id") REFERENCES "public"."knowledge_raw_imports"("id","document_id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."prevent_approved_knowledge_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'knowledge_document_versions' THEN
    IF OLD.approved_at IS NOT NULL AND (
      NEW.workspace_id IS DISTINCT FROM OLD.workspace_id OR
      NEW.document_id IS DISTINCT FROM OLD.document_id OR
      NEW.raw_import_id IS DISTINCT FROM OLD.raw_import_id OR
      NEW.version IS DISTINCT FROM OLD.version OR
      NEW.normalized_content IS DISTINCT FROM OLD.normalized_content OR
      NEW.content_checksum IS DISTINCT FROM OLD.content_checksum OR
      NEW.license_status IS DISTINCT FROM OLD.license_status
    ) THEN
      RAISE EXCEPTION 'Approved knowledge version content and lineage are immutable';
    END IF;
  ELSIF TG_TABLE_NAME = 'knowledge_raw_imports' THEN
    IF EXISTS (
      SELECT 1
      FROM knowledge_document_versions
      WHERE workspace_id = OLD.workspace_id
        AND raw_import_id = OLD.id
        AND approved_at IS NOT NULL
    ) AND (
      NEW.workspace_id IS DISTINCT FROM OLD.workspace_id OR
      NEW.document_id IS DISTINCT FROM OLD.document_id OR
      NEW.raw_content IS DISTINCT FROM OLD.raw_content OR
      NEW.content_checksum IS DISTINCT FROM OLD.content_checksum OR
      NEW.source_reference IS DISTINCT FROM OLD.source_reference OR
      NEW.imported_at IS DISTINCT FROM OLD.imported_at
    ) THEN
      RAISE EXCEPTION 'Raw content used by approved knowledge is immutable';
    END IF;
  ELSIF TG_TABLE_NAME = 'knowledge_chunks' THEN
    IF EXISTS (
      SELECT 1
      FROM knowledge_document_versions
      WHERE id = OLD.document_version_id
        AND workspace_id = OLD.workspace_id
        AND approved_at IS NOT NULL
    ) AND (
      NEW.workspace_id IS DISTINCT FROM OLD.workspace_id OR
      NEW.document_id IS DISTINCT FROM OLD.document_id OR
      NEW.document_version_id IS DISTINCT FROM OLD.document_version_id OR
      NEW.ordinal IS DISTINCT FROM OLD.ordinal OR
      NEW.section IS DISTINCT FROM OLD.section OR
      NEW.content IS DISTINCT FROM OLD.content OR
      NEW.content_checksum IS DISTINCT FROM OLD.content_checksum
    ) THEN
      RAISE EXCEPTION 'Chunks used by approved knowledge are immutable';
    END IF;
  ELSIF TG_TABLE_NAME = 'knowledge_sources' THEN
    IF EXISTS (
      SELECT 1
      FROM knowledge_documents d
      JOIN knowledge_document_versions v
        ON v.document_id = d.id
       AND v.workspace_id = d.workspace_id
      WHERE d.source_id = OLD.id
        AND d.workspace_id = OLD.workspace_id
        AND v.approved_at IS NOT NULL
    ) AND (
      NEW.workspace_id IS DISTINCT FROM OLD.workspace_id OR
      NEW.source_type IS DISTINCT FROM OLD.source_type OR
      NEW.external_reference IS DISTINCT FROM OLD.external_reference OR
      NEW.license_status IS DISTINCT FROM OLD.license_status
    ) THEN
      RAISE EXCEPTION 'Source provenance used by approved knowledge is immutable';
    END IF;
  ELSIF TG_TABLE_NAME = 'knowledge_documents' THEN
    IF EXISTS (
      SELECT 1
      FROM knowledge_document_versions
      WHERE document_id = OLD.id
        AND workspace_id = OLD.workspace_id
        AND approved_at IS NOT NULL
    ) AND (
      NEW.workspace_id IS DISTINCT FROM OLD.workspace_id OR
      NEW.source_id IS DISTINCT FROM OLD.source_id OR
      NEW.document_key IS DISTINCT FROM OLD.document_key
    ) THEN
      RAISE EXCEPTION 'Document provenance used by approved knowledge is immutable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER knowledge_document_versions_immutable_trigger
BEFORE UPDATE ON "knowledge_document_versions"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_approved_knowledge_mutation"();--> statement-breakpoint
CREATE TRIGGER knowledge_raw_imports_immutable_trigger
BEFORE UPDATE ON "knowledge_raw_imports"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_approved_knowledge_mutation"();--> statement-breakpoint
CREATE TRIGGER knowledge_chunks_immutable_trigger
BEFORE UPDATE ON "knowledge_chunks"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_approved_knowledge_mutation"();--> statement-breakpoint
CREATE TRIGGER knowledge_sources_immutable_trigger
BEFORE UPDATE ON "knowledge_sources"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_approved_knowledge_mutation"();--> statement-breakpoint
CREATE TRIGGER knowledge_documents_immutable_trigger
BEFORE UPDATE ON "knowledge_documents"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_approved_knowledge_mutation"();--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."prevent_approved_knowledge_chunk_membership_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1
      FROM knowledge_document_versions
      WHERE id = NEW.document_version_id
        AND workspace_id = NEW.workspace_id
        AND approved_at IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Chunks cannot be added to approved knowledge';
    END IF;
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM knowledge_document_versions
    WHERE id = OLD.document_version_id
      AND workspace_id = OLD.workspace_id
      AND approved_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Chunks cannot be removed from approved knowledge';
  END IF;
  RETURN OLD;
END;
$$;--> statement-breakpoint
CREATE TRIGGER knowledge_chunks_immutable_insert_trigger
BEFORE INSERT ON "knowledge_chunks"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_approved_knowledge_chunk_membership_mutation"();--> statement-breakpoint
CREATE TRIGGER knowledge_chunks_immutable_delete_trigger
BEFORE DELETE ON "knowledge_chunks"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_approved_knowledge_chunk_membership_mutation"();
