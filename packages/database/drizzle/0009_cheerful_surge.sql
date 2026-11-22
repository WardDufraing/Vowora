CREATE TABLE "milestone_phases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wedding_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'custom' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"trashed_at" timestamp with time zone,
	"position" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "milestone_phases_name_length" CHECK (char_length(btrim("milestone_phases"."name")) BETWEEN 1 AND 80),
	CONSTRAINT "milestone_phases_kind" CHECK ("milestone_phases"."kind" IN ('suggested', 'custom')),
	CONSTRAINT "milestone_phases_status" CHECK ("milestone_phases"."status" IN ('active', 'hidden', 'trashed')),
	CONSTRAINT "milestone_phases_kind_status" CHECK (("milestone_phases"."kind" = 'suggested' AND "milestone_phases"."status" IN ('active', 'hidden') AND "milestone_phases"."trashed_at" IS NULL) OR ("milestone_phases"."kind" = 'custom' AND "milestone_phases"."status" IN ('active', 'trashed') AND (("milestone_phases"."status" = 'trashed') = ("milestone_phases"."trashed_at" IS NOT NULL)))),
	CONSTRAINT "milestone_phases_position_nonnegative" CHECK ("milestone_phases"."position" >= 0),
	CONSTRAINT "milestone_phases_version_positive" CHECK ("milestone_phases"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "planning_milestones" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wedding_id" uuid NOT NULL,
	"phase_id" uuid,
	"restorable_phase_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"planned_date" date NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"lifecycle" text DEFAULT 'active' NOT NULL,
	"trashed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "planning_milestones_title_length" CHECK (char_length(btrim("planning_milestones"."title")) BETWEEN 1 AND 200),
	CONSTRAINT "planning_milestones_description_length" CHECK ("planning_milestones"."description" IS NULL OR char_length("planning_milestones"."description") <= 10000),
	CONSTRAINT "planning_milestones_status" CHECK ("planning_milestones"."status" IN ('not_started', 'in_progress', 'complete')),
	CONSTRAINT "planning_milestones_lifecycle" CHECK ("planning_milestones"."lifecycle" IN ('active', 'trashed')),
	CONSTRAINT "planning_milestones_trash_consistent" CHECK (("planning_milestones"."lifecycle" = 'trashed') = ("planning_milestones"."trashed_at" IS NOT NULL)),
	CONSTRAINT "planning_milestones_version_positive" CHECK ("planning_milestones"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "planning_tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wedding_id" uuid NOT NULL,
	"phase_id" uuid,
	"owner_membership_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"due_date" date,
	"status" text DEFAULT 'not_started' NOT NULL,
	"blocked_reason" text,
	"lifecycle" text DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "planning_tasks_title_length" CHECK (char_length(btrim("planning_tasks"."title")) BETWEEN 1 AND 200),
	CONSTRAINT "planning_tasks_description_length" CHECK ("planning_tasks"."description" IS NULL OR char_length("planning_tasks"."description") <= 10000),
	CONSTRAINT "planning_tasks_status" CHECK ("planning_tasks"."status" IN ('not_started', 'in_progress', 'blocked', 'complete')),
	CONSTRAINT "planning_tasks_blocked_reason_consistent" CHECK ("planning_tasks"."blocked_reason" IS NULL OR ("planning_tasks"."status" = 'blocked' AND char_length(btrim("planning_tasks"."blocked_reason")) BETWEEN 1 AND 500)),
	CONSTRAINT "planning_tasks_lifecycle" CHECK ("planning_tasks"."lifecycle" IN ('active', 'archived')),
	CONSTRAINT "planning_tasks_archive_consistent" CHECK (("planning_tasks"."lifecycle" = 'archived') = ("planning_tasks"."archived_at" IS NOT NULL)),
	CONSTRAINT "planning_tasks_completion_consistent" CHECK (("planning_tasks"."status" = 'complete') = ("planning_tasks"."completed_at" IS NOT NULL)),
	CONSTRAINT "planning_tasks_version_positive" CHECK ("planning_tasks"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "task_phases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wedding_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_phases_name_length" CHECK (char_length(btrim("task_phases"."name")) BETWEEN 1 AND 80),
	CONSTRAINT "task_phases_position_nonnegative" CHECK ("task_phases"."position" >= 0),
	CONSTRAINT "task_phases_version_positive" CHECK ("task_phases"."version" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "milestone_phases_wedding_id_unique_idx" ON "milestone_phases" USING btree ("wedding_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_phases_wedding_id_unique_idx" ON "task_phases" USING btree ("wedding_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_memberships_wedding_id_unique_idx" ON "wedding_memberships" USING btree ("wedding_id","id");--> statement-breakpoint
ALTER TABLE "milestone_phases" ADD CONSTRAINT "milestone_phases_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_milestones" ADD CONSTRAINT "planning_milestones_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_milestones" ADD CONSTRAINT "planning_milestones_phase_id_milestone_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "milestone_phases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_milestones" ADD CONSTRAINT "planning_milestones_restorable_phase_id_milestone_phases_id_fk" FOREIGN KEY ("restorable_phase_id") REFERENCES "milestone_phases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_milestones" ADD CONSTRAINT "planning_milestones_phase_same_wedding_fk" FOREIGN KEY ("wedding_id","phase_id") REFERENCES "milestone_phases"("wedding_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_milestones" ADD CONSTRAINT "planning_milestones_restorable_phase_same_wedding_fk" FOREIGN KEY ("wedding_id","restorable_phase_id") REFERENCES "milestone_phases"("wedding_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_tasks" ADD CONSTRAINT "planning_tasks_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_tasks" ADD CONSTRAINT "planning_tasks_phase_id_task_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "task_phases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_tasks" ADD CONSTRAINT "planning_tasks_owner_membership_id_wedding_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "wedding_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_tasks" ADD CONSTRAINT "planning_tasks_phase_same_wedding_fk" FOREIGN KEY ("wedding_id","phase_id") REFERENCES "task_phases"("wedding_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_tasks" ADD CONSTRAINT "planning_tasks_owner_same_wedding_fk" FOREIGN KEY ("wedding_id","owner_membership_id") REFERENCES "wedding_memberships"("wedding_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_phases" ADD CONSTRAINT "task_phases_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "milestone_phases_wedding_name_unique_idx" ON "milestone_phases" USING btree ("wedding_id",lower(btrim("name"))) WHERE "milestone_phases"."status" <> 'trashed';--> statement-breakpoint
CREATE INDEX "milestone_phases_wedding_position_idx" ON "milestone_phases" USING btree ("wedding_id","position");--> statement-breakpoint
CREATE INDEX "planning_milestones_wedding_date_idx" ON "planning_milestones" USING btree ("wedding_id","planned_date","status");--> statement-breakpoint
CREATE INDEX "planning_tasks_wedding_status_due_idx" ON "planning_tasks" USING btree ("wedding_id","lifecycle","status","due_date");--> statement-breakpoint
CREATE INDEX "planning_tasks_owner_idx" ON "planning_tasks" USING btree ("owner_membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_phases_wedding_name_unique_idx" ON "task_phases" USING btree ("wedding_id",lower(btrim("name")));--> statement-breakpoint
CREATE INDEX "task_phases_wedding_position_idx" ON "task_phases" USING btree ("wedding_id","position");--> statement-breakpoint
CREATE FUNCTION "vowora_guard_planning_task_lifecycle"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $function$
BEGIN
	IF OLD.lifecycle = 'archived' THEN
		IF NEW.lifecycle <> 'active'
			OR NEW.archived_at IS NOT NULL
			OR NEW.phase_id IS DISTINCT FROM OLD.phase_id
			OR NEW.owner_membership_id IS DISTINCT FROM OLD.owner_membership_id
			OR NEW.title IS DISTINCT FROM OLD.title
			OR NEW.description IS DISTINCT FROM OLD.description
			OR NEW.due_date IS DISTINCT FROM OLD.due_date
			OR NEW.status IS DISTINCT FROM OLD.status
			OR NEW.blocked_reason IS DISTINCT FROM OLD.blocked_reason
			OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
			OR NEW.version <> OLD.version + 1 THEN
			RAISE EXCEPTION 'archived planning task is immutable except for restore' USING ERRCODE = '23514';
		END IF;
	ELSIF NEW.lifecycle = 'archived' THEN
		IF NEW.archived_at IS NULL
			OR NEW.phase_id IS DISTINCT FROM OLD.phase_id
			OR NEW.owner_membership_id IS DISTINCT FROM OLD.owner_membership_id
			OR NEW.title IS DISTINCT FROM OLD.title
			OR NEW.description IS DISTINCT FROM OLD.description
			OR NEW.due_date IS DISTINCT FROM OLD.due_date
			OR NEW.status IS DISTINCT FROM OLD.status
			OR NEW.blocked_reason IS DISTINCT FROM OLD.blocked_reason
			OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
			OR NEW.version <> OLD.version + 1 THEN
			RAISE EXCEPTION 'planning task archive must preserve task contents' USING ERRCODE = '23514';
		END IF;
	END IF;
	RETURN NEW;
END;
$function$;--> statement-breakpoint
CREATE TRIGGER "planning_tasks_lifecycle_guard"
BEFORE UPDATE ON "planning_tasks"
FOR EACH ROW
EXECUTE FUNCTION "vowora_guard_planning_task_lifecycle"();--> statement-breakpoint
CREATE FUNCTION "vowora_guard_planning_milestone_lifecycle"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $function$
BEGIN
	IF OLD.lifecycle = 'trashed' THEN
		IF NEW.lifecycle <> 'active'
			OR NEW.trashed_at IS NOT NULL
			OR NEW.phase_id IS DISTINCT FROM OLD.phase_id
			OR NEW.restorable_phase_id IS DISTINCT FROM OLD.restorable_phase_id
			OR NEW.title IS DISTINCT FROM OLD.title
			OR NEW.description IS DISTINCT FROM OLD.description
			OR NEW.planned_date IS DISTINCT FROM OLD.planned_date
			OR NEW.status IS DISTINCT FROM OLD.status
			OR NEW.version <> OLD.version + 1 THEN
			RAISE EXCEPTION 'trashed planning milestone is immutable except for restore' USING ERRCODE = '23514';
		END IF;
	ELSIF NEW.lifecycle = 'trashed' THEN
		IF NEW.trashed_at IS NULL
			OR NEW.phase_id IS DISTINCT FROM OLD.phase_id
			OR NEW.restorable_phase_id IS DISTINCT FROM OLD.restorable_phase_id
			OR NEW.title IS DISTINCT FROM OLD.title
			OR NEW.description IS DISTINCT FROM OLD.description
			OR NEW.planned_date IS DISTINCT FROM OLD.planned_date
			OR NEW.status IS DISTINCT FROM OLD.status
			OR NEW.version <> OLD.version + 1 THEN
			RAISE EXCEPTION 'planning milestone trash must preserve milestone contents' USING ERRCODE = '23514';
		END IF;
	END IF;
	RETURN NEW;
END;
$function$;--> statement-breakpoint
CREATE TRIGGER "planning_milestones_lifecycle_guard"
BEFORE UPDATE ON "planning_milestones"
FOR EACH ROW
EXECUTE FUNCTION "vowora_guard_planning_milestone_lifecycle"();--> statement-breakpoint
CREATE FUNCTION "vowora_apply_milestone_phase_lifecycle"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $function$
BEGIN
	IF OLD.kind = 'custom' AND OLD.status IS DISTINCT FROM NEW.status THEN
		IF NEW.version <> OLD.version + 1 THEN
			RAISE EXCEPTION 'milestone phase lifecycle change requires the next version' USING ERRCODE = '23514';
		END IF;
		IF NEW.status = 'trashed' THEN
			EXECUTE pg_catalog.format(
				'UPDATE %I.planning_milestones SET phase_id = NULL, restorable_phase_id = $2, version = version + 1, updated_at = $3 WHERE wedding_id = $1 AND phase_id = $2',
				TG_TABLE_SCHEMA
			) USING OLD.wedding_id, OLD.id, NEW.updated_at;
		ELSIF OLD.status = 'trashed' AND NEW.status = 'active' THEN
			EXECUTE pg_catalog.format(
				'UPDATE %I.planning_milestones SET phase_id = $2, restorable_phase_id = NULL, version = version + 1, updated_at = $3 WHERE wedding_id = $1 AND restorable_phase_id = $2 AND phase_id IS NULL',
				TG_TABLE_SCHEMA
			) USING OLD.wedding_id, OLD.id, NEW.updated_at;
			EXECUTE pg_catalog.format(
				'UPDATE %I.planning_milestones SET restorable_phase_id = NULL, updated_at = $3 WHERE wedding_id = $1 AND restorable_phase_id = $2',
				TG_TABLE_SCHEMA
			) USING OLD.wedding_id, OLD.id, NEW.updated_at;
		END IF;
	END IF;
	RETURN NULL;
END;
$function$;--> statement-breakpoint
CREATE TRIGGER "milestone_phases_lifecycle_apply"
AFTER UPDATE OF "status" ON "milestone_phases"
FOR EACH ROW
EXECUTE FUNCTION "vowora_apply_milestone_phase_lifecycle"();--> statement-breakpoint
REVOKE ALL ON FUNCTION "vowora_guard_planning_task_lifecycle"() FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION "vowora_guard_planning_milestone_lifecycle"() FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION "vowora_apply_milestone_phase_lifecycle"() FROM PUBLIC;
