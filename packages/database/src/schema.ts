import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { createUuidV7 } from "./uuid.js";

/**
 * Infrastructure-only marker for migration compatibility checks. Product
 * entities begin in their owning tasks and must not be added here speculatively.
 */
export const schemaMetadata = pgTable("schema_metadata", {
  id: uuid("id").primaryKey().$defaultFn(createUuidV7),
  key: text("key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export type SchemaMetadata = typeof schemaMetadata.$inferSelect;
export type NewSchemaMetadata = typeof schemaMetadata.$inferInsert;
