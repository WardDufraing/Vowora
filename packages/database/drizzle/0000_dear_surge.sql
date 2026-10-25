CREATE TABLE "schema_metadata" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schema_metadata_key_unique" UNIQUE("key")
);
