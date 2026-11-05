CREATE TABLE "wedding_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wedding_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"access_expires_at" timestamp with time zone,
	"permission_overrides" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"permission_scope_version" integer DEFAULT 1 NOT NULL,
	"last_opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_memberships_role" CHECK ("wedding_memberships"."role" IN ('partner', 'planner', 'coordinator', 'helper', 'read_only_guest')),
	CONSTRAINT "wedding_memberships_status" CHECK ("wedding_memberships"."status" IN ('active', 'revoked')),
	CONSTRAINT "wedding_memberships_scope_version_positive" CHECK ("wedding_memberships"."permission_scope_version" > 0),
	CONSTRAINT "wedding_memberships_partner_no_expiry" CHECK ("wedding_memberships"."role" <> 'partner' OR "wedding_memberships"."access_expires_at" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "weddings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"wedding_date" date,
	"time_zone" text NOT NULL,
	"creation_mode" text NOT NULL,
	"creator_actor_id" uuid NOT NULL,
	"creation_request_id" uuid NOT NULL,
	"creation_request_fingerprint" text NOT NULL,
	"settings_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weddings_name_length" CHECK (char_length(btrim("weddings"."name")) BETWEEN 1 AND 120),
	CONSTRAINT "weddings_time_zone_length" CHECK (char_length("weddings"."time_zone") BETWEEN 1 AND 64),
	CONSTRAINT "weddings_creation_mode" CHECK ("weddings"."creation_mode" IN ('couple', 'planner')),
	CONSTRAINT "weddings_creation_request_fingerprint" CHECK ("weddings"."creation_request_fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "weddings_settings_version_positive" CHECK ("weddings"."settings_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "wedding_memberships" ADD CONSTRAINT "wedding_memberships_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_memberships" ADD CONSTRAINT "wedding_memberships_actor_id_auth_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_creator_actor_id_auth_user_id_fk" FOREIGN KEY ("creator_actor_id") REFERENCES "auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_memberships_wedding_actor_unique_idx" ON "wedding_memberships" USING btree ("wedding_id","actor_id");--> statement-breakpoint
CREATE INDEX "wedding_memberships_actor_idx" ON "wedding_memberships" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "wedding_memberships_wedding_idx" ON "wedding_memberships" USING btree ("wedding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weddings_creator_request_unique_idx" ON "weddings" USING btree ("creator_actor_id","creation_request_id");--> statement-breakpoint
CREATE INDEX "weddings_creator_idx" ON "weddings" USING btree ("creator_actor_id");
