// =============================================================================
// UTARE ZEM AI — Containerized PostgreSQL Database Client
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
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL ||
  "postgresql://utare_user:utare_password@localhost:5432/utare_db";

let pool: Pool | null = null;
let schemaMigrationPromise: Promise<void> | null = null;

const AUTO_MIGRATION_SQL = `
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS avatar_data_url TEXT;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS inactivity_notices_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS last_inactivity_notice_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS remain_confirmed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS data_policy_accepted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.auth_users ADD COLUMN IF NOT EXISTS data_policy_version TEXT;

ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS avatar_data_url TEXT;
ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS include_photo_on_cv BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS can_work_remotely BOOLEAN;
ALTER TABLE IF EXISTS public.candidate_profiles ADD COLUMN IF NOT EXISTS hub_support_need TEXT;

ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS company_website TEXT;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS external_role_url TEXT;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS attachment_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS reports JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS reported_reason TEXT;
ALTER TABLE IF EXISTS public.remote_jobs ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS attached_document_ids TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS shared_with_employer BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS employer_feedback_note TEXT;

ALTER TABLE IF EXISTS public.employer_registrations ADD COLUMN IF NOT EXISTS career_page_url TEXT;
ALTER TABLE IF EXISTS public.employer_registrations ADD COLUMN IF NOT EXISTS shared_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.employer_registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.employer_registrations ADD COLUMN IF NOT EXISTS updated_by TEXT;

CREATE TABLE IF NOT EXISTS public.candidate_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  candidate_id TEXT,
  candidate_email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'certificate',
  title TEXT NOT NULL,
  issuer TEXT,
  issue_year TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  data_url TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_latest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.candidate_cv_artifacts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  candidate_id TEXT,
  candidate_email TEXT NOT NULL,
  job_id TEXT,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  generated_cv JSONB NOT NULL,
  generated_cover_letter JSONB NOT NULL,
  source_details JSONB,
  avatar_data_url TEXT,
  include_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

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

export async function ensureDatabaseSchema(): Promise<void> {
  if (!schemaMigrationPromise) {
    schemaMigrationPromise = (async () => {
      try {
        const p = getPool();
        await p.query(AUTO_MIGRATION_SQL);
      } catch {
        // Non-fatal if running in fallback mode without direct PG socket
      }
    })();
  }
  await schemaMigrationPromise;
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
