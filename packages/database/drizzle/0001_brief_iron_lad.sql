CREATE TABLE "audit_events" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"schema_version" integer NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"actor_id" uuid NOT NULL,
	"wedding_id" uuid,
	"organization_id" uuid,
	"correlation_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"metadata" jsonb NOT NULL,
	CONSTRAINT "audit_events_has_scope" CHECK ("audit_events"."wedding_id" IS NOT NULL OR "audit_events"."organization_id" IS NOT NULL),
	CONSTRAINT "audit_events_schema_version_positive" CHECK ("audit_events"."schema_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"schema_version" integer NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"actor_id" uuid NOT NULL,
	"wedding_id" uuid,
	"organization_id" uuid,
	"correlation_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "outbox_events_has_scope" CHECK ("outbox_events"."wedding_id" IS NOT NULL OR "outbox_events"."organization_id" IS NOT NULL),
	CONSTRAINT "outbox_events_schema_version_positive" CHECK ("outbox_events"."schema_version" > 0)
);
--> statement-breakpoint
CREATE INDEX "audit_events_wedding_occurred_idx" ON "audit_events" USING btree ("wedding_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_events_organization_occurred_idx" ON "audit_events" USING btree ("organization_id","occurred_at");--> statement-breakpoint
CREATE INDEX "outbox_events_wedding_created_idx" ON "outbox_events" USING btree ("wedding_id","created_at");--> statement-breakpoint
CREATE INDEX "outbox_events_organization_created_idx" ON "outbox_events" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE FUNCTION reject_audit_event_mutation() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION 'audit events are append-only' USING ERRCODE = '55000';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_events_append_only
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION reject_audit_event_mutation();
--> statement-breakpoint
CREATE TRIGGER audit_events_no_truncate
BEFORE TRUNCATE ON "audit_events"
FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_event_mutation();
