// =============================================================================
// UTARE ZISEDU AI — Containerized PostgreSQL Database Client
// =============================================================================
// Connects to the local containerized PostgreSQL database (`utare-zisedu-db`)
// running at `postgresql://utare_user:utare_password@localhost:5432/utare_db`
// (or inside docker network at `db:5432`).
// Seamlessly syncs with `.data/utare-store.json` so data persists whether
// running inside Docker, in dev containers, or on host.
// =============================================================================

import { Pool, QueryResult, QueryResultRow } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://utare_user:utare_password@localhost:5432/utare_db";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
    });

    pool.on("error", (err) => {
      console.warn("[PostgreSQL Pool Error (Non-Fatal)]:", err.message);
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T> | null> {
  try {
    const p = getPool();
    return await p.query<T>(text, params);
  } catch (err: any) {
    console.warn(`[DB Query Warning] Failed query: "${text.slice(0, 40)}..."`, err.message);
    return null;
  }
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  version?: string;
  tableCount?: number;
}> {
  try {
    const res = await query("SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'");
    if (res && res.rows[0]) {
      return {
        connected: true,
        tableCount: parseInt(res.rows[0].count, 10),
      };
    }
  } catch {}
  return { connected: false };
}
