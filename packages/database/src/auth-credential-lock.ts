export type AuthCredentialLockTarget =
  { readonly email: string } | { readonly resetToken: string };

export type AuthCredentialLock = <T>(
  target: AuthCredentialLockTarget,
  operation: () => Promise<T>,
) => Promise<T>;

interface QueryResult<Row> {
  readonly rows: Row[];
}

interface LockClient {
  query(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<Record<string, unknown>>>;
  release(destroy?: boolean): void;
}

interface LockPool {
  connect(): Promise<LockClient>;
}

/**
 * Serializes password sign-in and password replacement for one identity.
 *
 * The lock lives on auth_user while Better Auth performs its work through its
 * own connection. `FOR NO KEY UPDATE` conflicts with another coordinator but
 * remains compatible with the foreign-key key-share lock taken by session
 * insertion, avoiding a self-deadlock.
 */
export function createAuthCredentialLock(pool: LockPool): AuthCredentialLock {
  return async (target, operation) => {
    const client = await pool.connect();
    let transactionOpen = false;
    let destroyClient = false;
    let released = false;
    try {
      await client.query("BEGIN");
      transactionOpen = true;
      const result =
        "email" in target
          ? await client.query(
              "SELECT id::text AS id FROM auth_user WHERE email = $1 FOR NO KEY UPDATE",
              [target.email.toLowerCase()],
            )
          : await client.query(
              "SELECT u.id::text AS id FROM auth_verification v JOIN auth_user u ON u.id::text = v.value WHERE v.identifier = $1 FOR NO KEY UPDATE OF u",
              [`reset-password:${target.resetToken}`],
            );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        client.release();
        released = true;
        return operation();
      }

      const response = await operation();
      await client.query("COMMIT");
      transactionOpen = false;
      return response;
    } catch (error) {
      if (transactionOpen) {
        try {
          await client.query("ROLLBACK");
        } catch {
          destroyClient = true;
        }
      }
      throw error;
    } finally {
      if (!released) client.release(destroyClient);
    }
  };
}
