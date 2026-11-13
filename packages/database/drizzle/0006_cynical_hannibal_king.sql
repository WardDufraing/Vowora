CREATE TABLE "wedding_organization_accesses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wedding_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"permission_ceiling" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"permission_scope_version" integer DEFAULT 1 NOT NULL,
	"granted_by_actor_id" uuid NOT NULL,
	"revoked_by_actor_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_organization_accesses_status" CHECK ("wedding_organization_accesses"."status" IN ('active', 'revoked')),
	CONSTRAINT "wedding_organization_accesses_revocation_consistent" CHECK (("wedding_organization_accesses"."status" = 'revoked') = ("wedding_organization_accesses"."revoked_at" IS NOT NULL AND "wedding_organization_accesses"."revoked_by_actor_id" IS NOT NULL)),
	CONSTRAINT "wedding_organization_accesses_scope_version_positive" CHECK ("wedding_organization_accesses"."permission_scope_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "wedding_organization_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wedding_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"permission_ceiling" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"issued_by_actor_id" uuid NOT NULL,
	"issuance_request_id" uuid NOT NULL,
	"issuance_request_fingerprint" text NOT NULL,
	"accepted_by_actor_id" uuid,
	"rejected_by_actor_id" uuid,
	"revoked_by_actor_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"replaced_by_invitation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_organization_invitations_status" CHECK ("wedding_organization_invitations"."status" IN ('pending', 'accepted', 'rejected', 'revoked', 'replaced')),
	CONSTRAINT "wedding_organization_invitations_fingerprint" CHECK ("wedding_organization_invitations"."issuance_request_fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "wedding_organization_invitations_lifecycle_consistent" CHECK ((("wedding_organization_invitations"."status" = 'pending' AND "wedding_organization_invitations"."accepted_by_actor_id" IS NULL AND "wedding_organization_invitations"."accepted_at" IS NULL AND "wedding_organization_invitations"."rejected_by_actor_id" IS NULL AND "wedding_organization_invitations"."rejected_at" IS NULL AND "wedding_organization_invitations"."revoked_by_actor_id" IS NULL AND "wedding_organization_invitations"."revoked_at" IS NULL AND "wedding_organization_invitations"."replaced_by_invitation_id" IS NULL) OR ("wedding_organization_invitations"."status" = 'accepted' AND "wedding_organization_invitations"."accepted_by_actor_id" IS NOT NULL AND "wedding_organization_invitations"."accepted_at" IS NOT NULL AND "wedding_organization_invitations"."rejected_by_actor_id" IS NULL AND "wedding_organization_invitations"."rejected_at" IS NULL AND "wedding_organization_invitations"."revoked_by_actor_id" IS NULL AND "wedding_organization_invitations"."revoked_at" IS NULL AND "wedding_organization_invitations"."replaced_by_invitation_id" IS NULL) OR ("wedding_organization_invitations"."status" = 'rejected' AND "wedding_organization_invitations"."accepted_by_actor_id" IS NULL AND "wedding_organization_invitations"."accepted_at" IS NULL AND "wedding_organization_invitations"."rejected_by_actor_id" IS NOT NULL AND "wedding_organization_invitations"."rejected_at" IS NOT NULL AND "wedding_organization_invitations"."revoked_by_actor_id" IS NULL AND "wedding_organization_invitations"."revoked_at" IS NULL AND "wedding_organization_invitations"."replaced_by_invitation_id" IS NULL) OR ("wedding_organization_invitations"."status" = 'revoked' AND "wedding_organization_invitations"."accepted_by_actor_id" IS NULL AND "wedding_organization_invitations"."accepted_at" IS NULL AND "wedding_organization_invitations"."rejected_by_actor_id" IS NULL AND "wedding_organization_invitations"."rejected_at" IS NULL AND "wedding_organization_invitations"."revoked_by_actor_id" IS NOT NULL AND "wedding_organization_invitations"."revoked_at" IS NOT NULL AND "wedding_organization_invitations"."replaced_by_invitation_id" IS NULL) OR ("wedding_organization_invitations"."status" = 'replaced' AND "wedding_organization_invitations"."accepted_by_actor_id" IS NULL AND "wedding_organization_invitations"."accepted_at" IS NULL AND "wedding_organization_invitations"."rejected_by_actor_id" IS NULL AND "wedding_organization_invitations"."rejected_at" IS NULL AND "wedding_organization_invitations"."revoked_by_actor_id" IS NULL AND "wedding_organization_invitations"."revoked_at" IS NULL AND "wedding_organization_invitations"."replaced_by_invitation_id" IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "wedding_organization_staff_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"access_id" uuid NOT NULL,
	"organization_membership_id" uuid NOT NULL,
	"wedding_membership_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_lead" boolean DEFAULT false NOT NULL,
	"permission_overrides" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"permission_scope_version" integer DEFAULT 1 NOT NULL,
	"assigned_by_actor_id" uuid NOT NULL,
	"revoked_at" timestamp with time zone,
	"absence_starts_at" timestamp with time zone,
	"absence_ends_at" timestamp with time zone,
	"absence_exceptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_organization_staff_status" CHECK ("wedding_organization_staff_assignments"."status" IN ('active', 'revoked')),
	CONSTRAINT "wedding_organization_staff_revocation_consistent" CHECK (("wedding_organization_staff_assignments"."status" = 'revoked') = ("wedding_organization_staff_assignments"."revoked_at" IS NOT NULL)),
	CONSTRAINT "wedding_organization_staff_scope_version_positive" CHECK ("wedding_organization_staff_assignments"."permission_scope_version" > 0),
	CONSTRAINT "wedding_organization_staff_absence_consistent" CHECK (("wedding_organization_staff_assignments"."absence_starts_at" IS NULL AND "wedding_organization_staff_assignments"."absence_ends_at" IS NULL) OR ("wedding_organization_staff_assignments"."absence_starts_at" IS NOT NULL AND "wedding_organization_staff_assignments"."absence_ends_at" IS NOT NULL AND "wedding_organization_staff_assignments"."absence_starts_at" < "wedding_organization_staff_assignments"."absence_ends_at"))
);
--> statement-breakpoint
CREATE TABLE "wedding_organization_staff_restrictions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"access_id" uuid NOT NULL,
	"organization_membership_id" uuid NOT NULL,
	"status" text DEFAULT 'blocked' NOT NULL,
	"changed_by_actor_id" uuid NOT NULL,
	"blocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lifted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_organization_staff_restrictions_status" CHECK ("wedding_organization_staff_restrictions"."status" IN ('blocked', 'lifted')),
	CONSTRAINT "wedding_organization_staff_restrictions_lift_consistent" CHECK (("wedding_organization_staff_restrictions"."status" = 'lifted') = ("wedding_organization_staff_restrictions"."lifted_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "wedding_organization_accesses" ADD CONSTRAINT "wedding_organization_accesses_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_accesses" ADD CONSTRAINT "wedding_organization_accesses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_accesses" ADD CONSTRAINT "wedding_organization_accesses_invitation_id_wedding_organization_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "wedding_organization_invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_accesses" ADD CONSTRAINT "wedding_organization_accesses_granted_by_actor_id_auth_user_id_fk" FOREIGN KEY ("granted_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_accesses" ADD CONSTRAINT "wedding_organization_accesses_revoked_by_actor_id_auth_user_id_fk" FOREIGN KEY ("revoked_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_invitations" ADD CONSTRAINT "wedding_organization_invitations_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_invitations" ADD CONSTRAINT "wedding_organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_invitations" ADD CONSTRAINT "wedding_organization_invitations_issued_by_actor_id_auth_user_id_fk" FOREIGN KEY ("issued_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_invitations" ADD CONSTRAINT "wedding_organization_invitations_accepted_by_actor_id_auth_user_id_fk" FOREIGN KEY ("accepted_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_invitations" ADD CONSTRAINT "wedding_organization_invitations_rejected_by_actor_id_auth_user_id_fk" FOREIGN KEY ("rejected_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_invitations" ADD CONSTRAINT "wedding_organization_invitations_revoked_by_actor_id_auth_user_id_fk" FOREIGN KEY ("revoked_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_invitations" ADD CONSTRAINT "wedding_organization_invitations_replaced_by_fk" FOREIGN KEY ("replaced_by_invitation_id") REFERENCES "wedding_organization_invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_staff_assignments" ADD CONSTRAINT "wedding_organization_staff_assignments_access_id_wedding_organization_accesses_id_fk" FOREIGN KEY ("access_id") REFERENCES "wedding_organization_accesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_staff_assignments" ADD CONSTRAINT "wedding_organization_staff_assignments_organization_membership_id_organization_memberships_id_fk" FOREIGN KEY ("organization_membership_id") REFERENCES "organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_staff_assignments" ADD CONSTRAINT "wedding_organization_staff_assignments_wedding_membership_id_wedding_memberships_id_fk" FOREIGN KEY ("wedding_membership_id") REFERENCES "wedding_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_staff_assignments" ADD CONSTRAINT "wedding_organization_staff_assignments_assigned_by_actor_id_auth_user_id_fk" FOREIGN KEY ("assigned_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_staff_restrictions" ADD CONSTRAINT "wedding_organization_staff_restrictions_access_id_wedding_organization_accesses_id_fk" FOREIGN KEY ("access_id") REFERENCES "wedding_organization_accesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_staff_restrictions" ADD CONSTRAINT "wedding_organization_staff_restrictions_organization_membership_id_organization_memberships_id_fk" FOREIGN KEY ("organization_membership_id") REFERENCES "organization_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_organization_staff_restrictions" ADD CONSTRAINT "wedding_organization_staff_restrictions_changed_by_actor_id_auth_user_id_fk" FOREIGN KEY ("changed_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_accesses_invitation_unique_idx" ON "wedding_organization_accesses" USING btree ("invitation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_accesses_one_active_wedding_idx" ON "wedding_organization_accesses" USING btree ("wedding_id") WHERE "wedding_organization_accesses"."status" = 'active';--> statement-breakpoint
CREATE INDEX "wedding_organization_accesses_org_status_idx" ON "wedding_organization_accesses" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "wedding_organization_accesses_wedding_status_idx" ON "wedding_organization_accesses" USING btree ("wedding_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_invitation_request_unique_idx" ON "wedding_organization_invitations" USING btree ("wedding_id","issued_by_actor_id","issuance_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_invitation_pending_wedding_idx" ON "wedding_organization_invitations" USING btree ("wedding_id") WHERE "wedding_organization_invitations"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "wedding_organization_invitation_org_status_idx" ON "wedding_organization_invitations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "wedding_organization_invitation_expiry_idx" ON "wedding_organization_invitations" USING btree ("expires_at","status");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_staff_access_member_unique_idx" ON "wedding_organization_staff_assignments" USING btree ("access_id","organization_membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_staff_wedding_member_unique_idx" ON "wedding_organization_staff_assignments" USING btree ("wedding_membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_staff_one_lead_idx" ON "wedding_organization_staff_assignments" USING btree ("access_id") WHERE "wedding_organization_staff_assignments"."is_lead" = true AND "wedding_organization_staff_assignments"."status" = 'active';--> statement-breakpoint
CREATE INDEX "wedding_organization_staff_access_status_idx" ON "wedding_organization_staff_assignments" USING btree ("access_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_organization_staff_restriction_unique_idx" ON "wedding_organization_staff_restrictions" USING btree ("access_id","organization_membership_id");
