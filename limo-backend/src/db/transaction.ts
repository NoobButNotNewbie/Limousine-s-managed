import { PoolClient } from "pg";

export async function transaction<T>(
  client: PoolClient,
  fn: () => Promise<T>
): Promise<T> {
  try {
    await client.query("BEGIN");
    const result = await fn();
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}
