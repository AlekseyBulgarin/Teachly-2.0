CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."external_user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('organization_admin', 'workspace_admin', 'educator');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" text[] NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "api_keys_scopes_required_check" CHECK (cardinality("api_keys"."scopes") > 0),
	CONSTRAINT "api_keys_revoked_state_check" CHECK (
    ("api_keys"."status" = 'active' AND "api_keys"."revoked_at" IS NULL)
    OR ("api_keys"."status" = 'revoked' AND "api_keys"."revoked_at" IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "external_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"external_user_id" text NOT NULL,
	"status" "external_user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "integration_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"role" "membership_role" NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_role_scope_check" CHECK (
    ("memberships"."role" = 'organization_admin' AND "memberships"."workspace_id" IS NULL)
    OR ("memberships"."role" <> 'organization_admin' AND "memberships"."workspace_id" IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_prefix_unique" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "external_users_workspace_integration_external_unique" ON "external_users" USING btree ("workspace_id","integration_id","external_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_tenant_id_unique" ON "integrations" USING btree ("organization_id","workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_organization_unique" ON "memberships" USING btree ("user_id","organization_id") WHERE "memberships"."workspace_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_workspace_unique" ON "memberships" USING btree ("user_id","workspace_id") WHERE "memberships"."workspace_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_id_organization_unique" ON "workspaces" USING btree ("id","organization_id");--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_integration_tenant_fk" FOREIGN KEY ("organization_id","workspace_id","integration_id") REFERENCES "public"."integrations"("organization_id","workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_users" ADD CONSTRAINT "external_users_integration_tenant_fk" FOREIGN KEY ("organization_id","workspace_id","integration_id") REFERENCES "public"."integrations"("organization_id","workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_organization_fk" FOREIGN KEY ("workspace_id","organization_id") REFERENCES "public"."workspaces"("id","organization_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_organization_fk" FOREIGN KEY ("workspace_id","organization_id") REFERENCES "public"."workspaces"("id","organization_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
