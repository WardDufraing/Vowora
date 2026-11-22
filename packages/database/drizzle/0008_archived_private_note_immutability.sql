CREATE FUNCTION "reject_archived_organization_private_note_update"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
	IF OLD.status = 'archived' THEN
		RAISE EXCEPTION 'archived organization private notes are immutable'
			USING ERRCODE = '55000';
	END IF;
	RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION "reject_archived_organization_private_note_update"() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER "organization_private_notes_archived_immutable"
	BEFORE UPDATE ON "organization_private_notes"
	FOR EACH ROW
	EXECUTE FUNCTION "reject_archived_organization_private_note_update"();
