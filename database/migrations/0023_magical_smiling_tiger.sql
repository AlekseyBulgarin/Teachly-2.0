CREATE TABLE "rate_limit_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"total_hits" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_limit_counters_expires_at_idx" ON "rate_limit_counters" USING btree ("expires_at");