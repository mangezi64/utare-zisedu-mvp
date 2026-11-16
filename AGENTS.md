# Utare ZEM AI — AI Assistant & Engineering Project Rules

These guidelines are mandatory for all AI agents, automated tools, and developers contributing to `utare-zisedu-mvp`. They enforce data durability, non-destructive schema changes, backward/forward compatibility, and safe deployments.

---

## 1. Zero Data Loss & Non-Destructive Migrations

1. **Additive Database Migrations Only:**
   - Any schema modification in `supabase/schema.sql` or migration scripts must be strictly non-destructive.
   - Always use `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, and safe indexes (`CREATE INDEX IF NOT EXISTS`).
   - Provide safe defaults (`DEFAULT ...`) or allow `NULL` for newly added columns so existing rows remain valid.
   - **NEVER** execute or commit `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or `ALTER TABLE ... DROP CONSTRAINT` against active datasets. If a column or table must be deprecated, follow a phased migration (mark deprecated → stop writing → backfill → archive).

2. **Database Storage & Docker Volume Protection:**
   - The PostgreSQL database runs on named volume `utare_pgdata` (`/var/lib/postgresql/data`).
   - **NEVER** use `docker compose down -v` or prune volumes in deployment workflows. Always use non-destructive restarts:
     ```bash
     docker compose up -d --build
     ```
   - Automated scripts, CI/CD pipelines, and helper commands must never wipe the volume or delete `.data/utare-store.json`.

3. **Backup Before Structural Changes:**
   - Always verify or create a snapshot / database dump before applying structural changes:
     ```bash
     docker compose exec db pg_dump -U utare_user utare_db > backup_pre_change.sql
     ```

---

## 2. Backward & Forward Compatibility Protocols

1. **Schema & Model Compatibility:**
   - Data interfaces in `src/types/index.ts` and `src/lib/store.ts` must maintain backward compatibility with records already stored in `.data/utare-store.json` and PostgreSQL.
   - New properties on existing interfaces must be optional (`newField?: string`) or provide explicit fallback defaults in hydration/read functions.
   - Never rename existing serialized JSON keys or DB column names without a backward-compatible translation layer (e.g., check both `row.new_key || row.old_key`).

2. **API Contract Compatibility:**
   - Public and internal API endpoints (`/api/*`) must remain backward-compatible with active client sessions and external webhooks.
   - Response shapes must not delete existing fields relied on by front-end pages.
   - If an API payload changes, accept both the legacy and the new payload format.

3. **Seed Data Must Never Overwrite Real User Data:**
   - Seed scripts, mock data, and initial state generators (`createInitialState()`) must only initialize default catalogs (e.g. baseline Hubs, baseline Courses, default Coaches) when empty.
   - They must **never** clear, overwrite, or reset user registrations, candidate profiles, CV artifacts, or job applications.

---

## 3. Deployment Safety & Serverless Resilience

1. **Stateless Serverless (Vercel / Lambda) Rule:**
   - Serverless environments have ephemeral, read-only filesystems (fallback `/tmp/.data` is destroyed on redeployments or cold-starts).
   - In production environments, critical persistent state (auth users, candidates, applications, employer listings) must be backed by PostgreSQL / Supabase, not local disk or in-memory arrays alone.
   - Any storage helper must handle hydration from the database on startup rather than assuming in-memory continuity across function instances.

2. **Session & Authentication Stability:**
   - Password hashes, salt rounds, and token signing logic (`AUTH_SESSION_SECRET`) must remain compatible across redeployments so active user sessions are not abruptly logged out or invalidated.
   - Account roles (`candidate`, `employer`, `admin`, `superuser`) and verification statuses must persist across all builds.

---

## 4. Code & Configuration Hygiene

1. **Environment Variables Safety:**
   - Do not commit secrets, private keys, or passwords to git.
   - Always update `.env.example` whenever a new environment variable is introduced, with clear documentation on whether it is optional or required.

2. **Verification Prior to Merging:**
   - Before pushing or proposing a release, run validation checks to ensure tests and type checks pass:
     ```bash
     npm run lint
     npm run test -- --run
     ```
