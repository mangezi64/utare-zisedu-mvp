#!/usr/bin/env node
// =============================================================================
// UTARE ZEM AI — Release-Time Additive Database Schema Migration Script
// =============================================================================
// Runs automatically during `npm run build` (Vercel / Docker / CI releases) and
// on demand via `npm run db:migrate` or `npm run db:migrate:strict`.
//
// Applies `supabase/additive-schema.sql` using:
//   1. Direct PostgreSQL connection (`SUPABASE_DB_URL`, `POSTGRES_URL_NON_POOLING`,
//      `POSTGRES_URL`, or `DATABASE_URL`) with SSL auto-enabled for remote hosts.
//   2. Optional Supabase Management API fallback (`SUPABASE_ACCESS_TOKEN` +
//      `NEXT_PUBLIC_SUPABASE_URL`) if no direct Postgres URL is set.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const EXPECTED_TABLES = [
  "auth_users",
  "innovation_hubs",
  "coaches",
  "candidate_profiles",
  "skills_assessments",
  "ai_career_pathways",
  "remote_jobs",
  "job_applications",
  "employer_registrations",
  "skills_courses",
  "contact_messages",
  "candidate_documents",
  "candidate_cv_artifacts",
  "audit_logs",
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let val = line.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined && val.length > 0) {
      process.env[key] = val;
    }
  }
}

function isLocalHost(connStr) {
  try {
    const host = new URL(connStr).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "db" ||
      host === "::1"
    );
  } catch {
    return /@(localhost|127\.0\.0\.1|db)(:|\/|$)/i.test(connStr);
  }
}

function resolvePostgresUrl() {
  const candidates = [
    process.env.SUPABASE_DB_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
  ];
  for (const c of candidates) {
    if (c && c.trim().length > 0) {
      return c.trim();
    }
  }
  return "";
}

async function runManagementApiMigration(ddlSql, supabaseUrl, accessToken) {
  const match = supabaseUrl.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  if (!match) {
    throw new Error(
      `Cannot extract Supabase project ref from NEXT_PUBLIC_SUPABASE_URL (${supabaseUrl}).`
    );
  }
  const projectRef = match[1];
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: ddlSql }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Supabase Management API query failed (${res.status}): ${errText.slice(0, 300)}`
    );
  }

  const verifyRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query:
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
    }),
  });

  if (verifyRes.ok) {
    const rows = await verifyRes.json().catch(() => []);
    const present = new Set(
      Array.isArray(rows) ? rows.map((r) => r.table_name) : []
    );
    const missing = EXPECTED_TABLES.filter((t) => !present.has(t));
    if (missing.length > 0) {
      throw new Error(
        `Schema verification failed; missing public tables: ${missing.join(", ")}`
      );
    }
  }

  console.log(
    `✓ [db:migrate] Database schema synced via Supabase Management API (${EXPECTED_TABLES.length}/${EXPECTED_TABLES.length} tables verified)`
  );
}

async function main() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, ".env.local"));
  loadEnvFile(path.join(cwd, ".env"));

  const strict =
    process.argv.includes("--strict") || process.env.MIGRATE_STRICT === "true";

  const schemaPath = path.join(cwd, "supabase", "additive-schema.sql");
  if (!fs.existsSync(schemaPath)) {
    console.error(`✗ [db:migrate] Schema file not found: ${schemaPath}`);
    process.exit(1);
  }
  const ddlSql = fs.readFileSync(schemaPath, "utf8");

  const pgUrl = resolvePostgresUrl();
  const supabaseAccessToken = (process.env.SUPABASE_ACCESS_TOKEN || "").trim();
  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
  const isHostedBuild = Boolean(process.env.VERCEL || process.env.CI);

  // In Vercel/CI builds, skip local Docker/localhost database URLs unless --strict
  if (isHostedBuild && (!pgUrl || isLocalHost(pgUrl)) && !strict) {
    if (supabaseAccessToken && supabaseUrl) {
      try {
        await runManagementApiMigration(ddlSql, supabaseUrl, supabaseAccessToken);
        return;
      } catch (err) {
        console.warn(
          `[db:migrate] Supabase Management API migration skipped: ${err.message}`
        );
        return;
      }
    }

    console.warn(
      "[db:migrate] No cloud Postgres URL (SUPABASE_DB_URL / POSTGRES_URL) set — skipping cloud DDL migration; set SUPABASE_DB_URL in Vercel Environment Variables to auto-migrate Supabase on every release."
    );
    return;
  }

  if (!pgUrl) {
    if (supabaseAccessToken && supabaseUrl) {
      await runManagementApiMigration(ddlSql, supabaseUrl, supabaseAccessToken);
      return;
    }
    if (strict) {
      console.error(
        "✗ [db:migrate] No Postgres connection string configured (SUPABASE_DB_URL / POSTGRES_URL / DATABASE_URL)."
      );
      process.exit(1);
    }
    console.warn(
      "[db:migrate] No Postgres URL configured — skipping build-time DDL migration."
    );
    return;
  }

  const local = isLocalHost(pgUrl);
  const client = new Client({
    connectionString: pgUrl,
    connectionTimeoutMillis: local ? 3000 : 8000,
    ...(local ? {} : { ssl: { rejectUnauthorized: false } }),
  });

  try {
    await client.connect();
  } catch (connErr) {
    if (supabaseAccessToken && supabaseUrl) {
      try {
        await runManagementApiMigration(ddlSql, supabaseUrl, supabaseAccessToken);
        return;
      } catch (apiErr) {
        if (strict) {
          console.error(`✗ [db:migrate] Migration failed: ${apiErr.message}`);
          process.exit(1);
        }
        console.warn(
          `[db:migrate] Migration skipped (DB and Management API unreachable): ${apiErr.message}`
        );
        return;
      }
    }

    if (strict) {
      console.error(
        `✗ [db:migrate] Could not connect to PostgreSQL: ${connErr.message}`
      );
      process.exit(1);
    }
    console.warn(
      `[db:migrate] Skipping build-time migration (database unreachable): ${connErr.message}`
    );
    return;
  }

  try {
    await client.query(ddlSql);
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    const present = new Set(res.rows.map((r) => r.table_name));
    const missing = EXPECTED_TABLES.filter((t) => !present.has(t));
    if (missing.length > 0) {
      console.error(
        `✗ [db:migrate] Missing expected tables after migration: ${missing.join(", ")}`
      );
      process.exit(1);
    }
    console.log(
      `✓ [db:migrate] Database schema synced and verified (${EXPECTED_TABLES.length}/${EXPECTED_TABLES.length} tables present)`
    );
  } catch (sqlErr) {
    console.error(`✗ [db:migrate] SQL execution error: ${sqlErr.message}`);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
