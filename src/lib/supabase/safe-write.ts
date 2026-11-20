// =============================================================================
// UTARE ZEM AI — Schema-Drift-Resilient Supabase Write Helpers
// =============================================================================
// Isolated in its own module (separate from client.ts) so existing Vitest
// suites mocking `@/lib/supabase/client` continue operating cleanly while live
// routes tolerate missing columns (`PGRST204` / `42703`) or missing ON CONFLICT
// unique indexes (`42P10`) until additive migrations run.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value?: string | null): boolean {
  return Boolean(value && UUID_REGEX.test(value.trim()));
}

interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

function extractMissingColumn(error?: SupabaseErrorLike | null): string | null {
  if (!error) return null;
  const code = String(error.code || "");
  const msg = `${error.message || ""} ${error.details || ""}`;

  // PostgREST schema cache miss: "Could not find the 'foo' column of 'bar' in the schema cache"
  if (code === "PGRST204" || /Could not find the '[^']+' column/i.test(msg)) {
    const m = msg.match(/Could not find the '([^']+)' column/i);
    if (m?.[1]) return m[1];
  }

  // PostgreSQL undefined_column: column "foo" [of relation "bar"] does not exist
  if (code === "42703" || /column\s+.+\s+does not exist/i.test(msg)) {
    const m = msg.match(
      /column\s+(?:"?[\w]+"?\.)?"?([\w]+)"?(?:\s+of\s+relation\s+"?[\w.]+"?)?\s+does not exist/i
    );
    if (m?.[1]) return m[1];
  }

  return null;
}

function isMissingConflictConstraint(error?: SupabaseErrorLike | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P10" ||
    /no unique or exclusion constraint matching the ON CONFLICT/i.test(
      error.message || ""
    )
  );
}

export interface SafeWriteResult {
  data: any;
  error: SupabaseErrorLike | null;
  strippedColumns: string[];
}

export async function safeSupabaseUpsert(
  sb: SupabaseClient | null | undefined,
  table: string,
  row: Record<string, unknown>,
  onConflict?: string,
  options?: { select?: string }
): Promise<SafeWriteResult> {
  if (!sb) {
    return { data: null, error: null, strippedColumns: [] };
  }

  const payload: Record<string, unknown> = { ...row };
  const strippedColumns: string[] = [];
  let mode: "upsert" | "insert" | "update" = "upsert";
  let updateTargetId: string | number | null = null;
  let lastError: SupabaseErrorLike | null = null;

  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      let res: { data: any; error: SupabaseErrorLike | null };

      if (mode === "update" && updateTargetId !== null) {
        const q = sb.from(table).update(payload).eq("id", updateTargetId);
        res = options?.select
          ? await q.select(options.select).maybeSingle()
          : await q;
      } else if (mode === "insert") {
        const q = sb.from(table).insert(payload);
        res = options?.select
          ? await q.select(options.select).maybeSingle()
          : await q;
      } else {
        const q = sb
          .from(table)
          .upsert(payload, onConflict ? { onConflict } : undefined);
        res = options?.select
          ? await q.select(options.select).maybeSingle()
          : await q;
      }

      if (!res.error) {
        if (strippedColumns.length > 0) {
          console.warn(
            `[Supabase SafeWrite] Synced '${table}' after skipping pending migration columns: ${strippedColumns.join(", ")}`
          );
        }
        return { data: res.data, error: null, strippedColumns };
      }

      lastError = res.error;

      // 1. Missing column in live DB / PostgREST cache -> strip & retry
      const missingCol = extractMissingColumn(res.error);
      if (missingCol && Object.prototype.hasOwnProperty.call(payload, missingCol)) {
        delete payload[missingCol];
        strippedColumns.push(missingCol);
        continue;
      }

      // 2. Missing UNIQUE index for ON CONFLICT -> fall back to select + update/insert
      if (
        mode === "upsert" &&
        onConflict &&
        payload[onConflict] !== undefined &&
        isMissingConflictConstraint(res.error)
      ) {
        const { data: existing, error: selErr } = await sb
          .from(table)
          .select("id")
          .eq(onConflict, payload[onConflict] as string)
          .maybeSingle();

        if (!selErr && existing?.id) {
          mode = "update";
          updateTargetId = existing.id;
        } else {
          mode = "insert";
        }
        continue;
      }

      break;
    } catch (err: any) {
      lastError = { message: err?.message || String(err) };
      break;
    }
  }

  if (lastError) {
    console.warn(
      `[Supabase SafeWrite Warning] '${table}' sync error:`,
      lastError.message || lastError.code || "Unknown error"
    );
  }
  return { data: null, error: lastError, strippedColumns };
}

export async function safeSupabaseUpdate(
  sb: SupabaseClient | null | undefined,
  table: string,
  patch: Record<string, unknown>,
  matchColumn: string,
  matchValue: string,
  options?: { caseInsensitive?: boolean }
): Promise<SafeWriteResult> {
  if (!sb) {
    return { data: null, error: null, strippedColumns: [] };
  }

  const payload: Record<string, unknown> = { ...patch };
  const strippedColumns: string[] = [];
  let lastError: SupabaseErrorLike | null = null;

  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const base = sb.from(table).update(payload);
      const res = options?.caseInsensitive
        ? await base.ilike(matchColumn, matchValue)
        : await base.eq(matchColumn, matchValue);

      if (!res.error) {
        return { data: res.data, error: null, strippedColumns };
      }

      lastError = res.error;
      const missingCol = extractMissingColumn(res.error);
      if (missingCol && Object.prototype.hasOwnProperty.call(payload, missingCol)) {
        delete payload[missingCol];
        strippedColumns.push(missingCol);
        if (Object.keys(payload).length === 0) break;
        continue;
      }

      break;
    } catch (err: any) {
      lastError = { message: err?.message || String(err) };
      break;
    }
  }

  if (lastError) {
    console.warn(
      `[Supabase SafeWrite Update Warning] '${table}' error:`,
      lastError.message || lastError.code || "Unknown error"
    );
  }
  return { data: null, error: lastError, strippedColumns };
}
