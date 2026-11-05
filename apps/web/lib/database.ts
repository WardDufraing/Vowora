import { createRuntimeDatabase } from "@vowora/database";

let runtimeDatabase: ReturnType<typeof createRuntimeDatabase> | undefined;

export function getRuntimeDatabase() {
  runtimeDatabase ??= createRuntimeDatabase(process.env);
  return runtimeDatabase;
}
