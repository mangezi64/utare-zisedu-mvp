# Utare ZEM AI — AI Assistant & Engineering Project Rules

This project follows the non-destructive, zero-data-loss, and backward/forward compatibility rules defined in [AGENTS.md](./AGENTS.md).

---

## Core Safety Invariants (Summary)

1. **Zero Data Loss:**
   - **Never run `docker compose down -v`** in any environment or script (the `-v` flag deletes the database volume `utare_pgdata`).
   - Do not delete or overwrite `.data/utare-store.json`.
   - Seed data must never erase or reset real user accounts, candidate profiles, or job applications.

2. **Non-Destructive Database Migrations:**
   - All SQL changes must be additive: use `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, and safe defaults.
   - Never run `DROP TABLE`, `DROP COLUMN`, or `TRUNCATE` on active datasets.

3. **Backward & Forward Compatibility:**
   - Model and TypeScript interface updates in `src/types/index.ts` and `src/lib/store.ts` must use optional fields (`field?: type`) or safe defaults to avoid breaking existing stored records.
   - Existing API endpoints must accept legacy request formats when introducing new fields.

4. **Stateless Serverless Resilience:**
   - Do not assume local file storage (`/tmp/.data`) persists across Vercel deployments.
   - All production user data must persist in PostgreSQL / Supabase.

Refer to [AGENTS.md](./AGENTS.md) for detailed guidelines and examples.
