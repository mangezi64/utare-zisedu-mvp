// =============================================================================
// UTARE ZEM AI — PostgreSQL Database Client & Idempotent Schema Migration
// =============================================================================
// Connects to cloud PostgreSQL (SUPABASE_DB_URL / POSTGRES_URL) or the local
// containerized PostgreSQL database (`utare-zisedu-db`) and runs the additive
// 14-table DDL automatically on first query with retry cooldown on transient
// startup errors.
// =============================================================================

import { Pool, QueryResult, QueryResultRow } from "pg";
import { ADDITIVE_SCHEMA_DDL } from "@/lib/db-schema";

const connectionString =
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgresql://utare_user:utare_password@localhost:5432/utare_db";

function isLocalPostgresHost(connStr: string): boolean {
  try {
    const hostname = new URL(connStr).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "db" ||
      hostname === "::1"
    );
  } catch {
    return /@(localhost|127\.0\.0\.1|db)(:|\/|$)/i.test(connStr);
  }
}

let pool: Pool | null = null;
let schemaMigrationPromise: Promise<void> | null = null;
let schemaMigrated = false;
let lastMigrationAttemptAt = 0;
const MIGRATION_RETRY_COOLDOWN_MS = 60_000;

function getPool(): Pool {
  if (!pool) {
    const isLocal = isLocalPostgresHost(connectionString);
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: isLocal ? 3000 : 8000,
      idleTimeoutMillis: 10000,
      ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
    });

    pool.on("error", (err) => {
      console.warn("[PostgreSQL Pool Error (Non-Fatal)]:", err.message);
    });
  }
  return pool;
}

export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaMigrated) return;

  const now = Date.now();
  if (
    !schemaMigrationPromise &&
    now - lastMigrationAttemptAt >= MIGRATION_RETRY_COOLDOWN_MS
  ) {
    lastMigrationAttemptAt = now;
    schemaMigrationPromise = (async () => {
      try {
        const p = getPool();
        await p.query(ADDITIVE_SCHEMA_DDL);
        schemaMigrated = true;
      } catch {
        // Non-fatal if running in fallback mode without direct PG socket; allow retry after cooldown
        schemaMigrationPromise = null;
      }
    })();
  }

  if (schemaMigrationPromise) {
    await schemaMigrationPromise;
  }
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T> | null> {
  try {
    await ensureDatabaseSchema();
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
    const res = await query(
      "SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
    );
    if (res && res.rows[0]) {
      return {
        connected: true,
        tableCount: parseInt(res.rows[0].count, 10),
      };
    }
  } catch {}
  return { connected: false };
}
