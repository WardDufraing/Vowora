CREATE TABLE "wedding_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wedding_id" uuid NOT NULL,
	"invited_email" text NOT NULL,
	"role" text NOT NULL,
	"token_digest" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"issued_by_actor_id" uuid NOT NULL,
	"accepted_by_actor_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"reminder_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"replaced_by_invitation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_invitations_email_normalized" CHECK ("wedding_invitations"."invited_email" = lower(btrim("wedding_invitations"."invited_email"))),
	CONSTRAINT "wedding_invitations_role" CHECK ("wedding_invitations"."role" IN ('partner')),
	CONSTRAINT "wedding_invitations_status" CHECK ("wedding_invitations"."status" IN ('pending', 'accepted', 'revoked', 'replaced')),
	CONSTRAINT "wedding_invitations_token_digest" CHECK ("wedding_invitations"."token_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "wedding_invitations_deadlines" CHECK ("wedding_invitations"."reminder_at" < "wedding_invitations"."expires_at"),
	CONSTRAINT "wedding_invitations_acceptance_consistent" CHECK (("wedding_invitations"."status" = 'accepted') = ("wedding_invitations"."accepted_at" IS NOT NULL AND "wedding_invitations"."accepted_by_actor_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "wedding_invitations" ADD CONSTRAINT "wedding_invitations_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_invitations" ADD CONSTRAINT "wedding_invitations_issued_by_actor_id_auth_user_id_fk" FOREIGN KEY ("issued_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_invitations" ADD CONSTRAINT "wedding_invitations_accepted_by_actor_id_auth_user_id_fk" FOREIGN KEY ("accepted_by_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_invitations_token_digest_unique_idx" ON "wedding_invitations" USING btree ("token_digest");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_invitations_one_pending_partner_idx" ON "wedding_invitations" USING btree ("wedding_id") WHERE "wedding_invitations"."status" = 'pending' AND "wedding_invitations"."role" = 'partner';--> statement-breakpoint
CREATE INDEX "wedding_invitations_wedding_status_idx" ON "wedding_invitations" USING btree ("wedding_id","status");--> statement-breakpoint
CREATE INDEX "wedding_invitations_reminder_idx" ON "wedding_invitations" USING btree ("reminder_at","status");
