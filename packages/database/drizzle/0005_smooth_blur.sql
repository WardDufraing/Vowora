CREATE TABLE "organization_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"invited_email" text NOT NULL,
	"role" text NOT NULL,
	"token_digest" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"issued_by_actor_id" uuid NOT NULL,
	"issuance_request_id" uuid NOT NULL,
	"issuance_request_fingerprint" text NOT NULL,
	"accepted_by_actor_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"reminder_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"replaced_by_invitation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invitations_email_normalized" CHECK ("organization_invitations"."invited_email" = lower(btrim("organization_invitations"."invited_email"))),
	CONSTRAINT "organization_invitations_role" CHECK ("organization_invitations"."role" IN ('manager', 'employee')),
	CONSTRAINT "organization_invitations_status" CHECK ("organization_invitations"."status" IN ('pending', 'accepted', 'revoked', 'replaced')),
	CONSTRAINT "organization_invitations_token_digest" CHECK ("organization_invitations"."token_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "organization_invitations_deadlines" CHECK ("organization_invitations"."reminder_at" < "organization_invitations"."expires_at"),
	CONSTRAINT "organization_invitations_acceptance_consistent" CHECK (("organization_invitations"."status" = 'accepted') = ("organization_invitations"."accepted_at" IS NOT NULL AND "organization_invitations"."accepted_by_actor_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"permission_overrides" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"permission_scope_version" integer DEFAULT 1 NOT NULL,
	"deactivated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_memberships_role" CHECK ("organization_memberships"."role" IN ('owner', 'manager', 'employee')),
	CONSTRAINT "organization_memberships_status" CHECK ("organization_memberships"."status" IN ('active', 'revoked')),
	CONSTRAINT "organization_memberships_deactivation_consistent" CHECK (("organization_memberships"."status" = 'revoked') = ("organization_memberships"."deactivated_at" IS NOT NULL)),
	CONSTRAINT "organization_memberships_owner_immutable" CHECK ("organization_memberships"."role" <> 'owner' OR ("organization_memberships"."status" = 'active' AND "organization_memberships"."deactivated_at" IS NULL)),
	CONSTRAINT "organization_memberships_scope_version_positive" CHECK ("organization_memberships"."permission_scope_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"creator_actor_id" uuid NOT NULL,
	"creation_request_id" uuid NOT NULL,
	"creation_request_fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_name_length" CHECK (char_length(btrim("organizations"."name")) BETWEEN 1 AND 120)
);
--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_issued_by_actor_id_auth_user_id_fk" FOREIGN KEY ("issued_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_accepted_by_actor_id_auth_user_id_fk" FOREIGN KEY ("accepted_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_replaced_by_fk" FOREIGN KEY ("replaced_by_invitation_id") REFERENCES "organization_invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_actor_id_auth_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_creator_actor_id_auth_user_id_fk" FOREIGN KEY ("creator_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_invitations_token_unique_idx" ON "organization_invitations" USING btree ("token_digest");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_invitations_issuance_request_unique_idx" ON "organization_invitations" USING btree ("organization_id","issued_by_actor_id","issuance_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_invitations_pending_email_unique_idx" ON "organization_invitations" USING btree ("organization_id","invited_email") WHERE "organization_invitations"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "organization_invitations_org_status_idx" ON "organization_invitations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "organization_invitations_reminder_idx" ON "organization_invitations" USING btree ("reminder_at","status");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_actor_unique_idx" ON "organization_memberships" USING btree ("organization_id","actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_owner_unique_idx" ON "organization_memberships" USING btree ("organization_id") WHERE "organization_memberships"."role" = 'owner';--> statement-breakpoint
CREATE INDEX "organization_memberships_actor_status_idx" ON "organization_memberships" USING btree ("actor_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_creator_request_unique_idx" ON "organizations" USING btree ("creator_actor_id","creation_request_id");
