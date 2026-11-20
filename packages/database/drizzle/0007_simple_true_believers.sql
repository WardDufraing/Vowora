CREATE TABLE "organization_private_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"wedding_id" uuid,
	"created_by_membership_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_private_notes_status" CHECK ("organization_private_notes"."status" IN ('active', 'archived')),
	CONSTRAINT "organization_private_notes_archive_consistent" CHECK (("organization_private_notes"."status" = 'archived') = ("organization_private_notes"."archived_at" IS NOT NULL)),
	CONSTRAINT "organization_private_notes_title_length" CHECK (char_length("organization_private_notes"."title") BETWEEN 1 AND 160),
	CONSTRAINT "organization_private_notes_body_length" CHECK (char_length("organization_private_notes"."body") BETWEEN 1 AND 20000)
);
--> statement-breakpoint
CREATE TABLE "wedding_organization_handovers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"access_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"wedding_id" uuid NOT NULL,
	"initiated_by_membership_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"request_id" uuid NOT NULL,
	"request_fingerprint" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_organization_handovers_mode" CHECK ("wedding_organization_handovers"."mode" IN ('guided', 'immediate')),
	CONSTRAINT "wedding_organization_handovers_fingerprint" CHECK ("wedding_organization_handovers"."request_fingerprint" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "organization_private_notes" ADD CONSTRAINT "organization_private_notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_private_notes" ADD CONSTRAINT "organization_private_notes_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_private_notes" ADD CONSTRAINT "organization_private_notes_created_by_membership_id_organization_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_handovers" ADD CONSTRAINT "wedding_organization_handovers_access_id_wedding_organization_accesses_id_fk" FOREIGN KEY ("access_id") REFERENCES "wedding_organization_accesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_handovers" ADD CONSTRAINT "wedding_organization_handovers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_handovers" ADD CONSTRAINT "wedding_organization_handovers_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_handovers" ADD CONSTRAINT "wedding_organization_handovers_initiated_by_membership_id_organization_memberships_id_fk" FOREIGN KEY ("initiated_by_membership_id") REFERENCES "organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_private_notes_org_status_idx" ON "organization_private_notes" USING btree ("organization_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "organization_private_notes_wedding_idx" ON "organization_private_notes" USING btree ("wedding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_handovers_access_unique_idx" ON "wedding_organization_handovers" USING btree ("access_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_handovers_request_unique_idx" ON "wedding_organization_handovers" USING btree ("organization_id","initiated_by_membership_id","request_id");--> statement-breakpoint
CREATE INDEX "wedding_organization_handovers_wedding_idx" ON "wedding_organization_handovers" USING btree ("wedding_id");
