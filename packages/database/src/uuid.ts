import { validate, v7, version } from "uuid";

/**
 * Identifiers are generated in the application so the convention works on
 * every supported Neon PostgreSQL version without a database extension.
 */
export function createUuidV7(): string {
  return v7();
}

export function isUuidV7(value: string): boolean {
  return validate(value) && version(value) === 7;
}
