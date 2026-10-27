import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { parseRuntimeDatabaseConfig } from "./config.js";
import * as schema from "./schema.js";
import { createAuthCredentialLock } from "./auth-credential-lock.js";

export function createRuntimeDatabase(environment: NodeJS.ProcessEnv) {
  const config = parseRuntimeDatabaseConfig(environment);
  const pool = new Pool({
    connectionString: config.connectionString,
    max: config.poolMax - 1,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    idleTimeoutMillis: config.idleTimeoutMs,
  });
  const credentialPool = new Pool({
    connectionString: config.connectionString,
    max: 1,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    idleTimeoutMillis: config.idleTimeoutMs,
    query_timeout: config.statementTimeoutMs,
    statement_timeout: config.statementTimeoutMs,
    idle_in_transaction_session_timeout: config.transactionIdleTimeoutMs,
  });
  return {
    database: drizzle(pool, { casing: "snake_case", schema }),
    withAuthCredentialLock: createAuthCredentialLock(credentialPool),
    close: async () => {
      await Promise.all([pool.end(), credentialPool.end()]);
    },
  };
}
