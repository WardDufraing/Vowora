import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { parseRuntimeDatabaseConfig } from "./config.js";
import * as schema from "./schema.js";

export function createRuntimeDatabase(environment: NodeJS.ProcessEnv) {
  const config = parseRuntimeDatabaseConfig(environment);
  const pool = new Pool({
    connectionString: config.connectionString,
    max: config.poolMax,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    idleTimeoutMillis: config.idleTimeoutMs,
    options: [
      `-c statement_timeout=${config.statementTimeoutMs}`,
      `-c idle_in_transaction_session_timeout=${config.transactionIdleTimeoutMs}`,
    ].join(" "),
  });
  return {
    database: drizzle(pool, { casing: "snake_case", schema }),
    close: () => pool.end(),
  };
}
