// =============================================================================
// UTARE ZEM AI — Supabase Client Configuration (Browser, Server & Service-Role)
// =============================================================================
// Connects to Supabase Auth and Supabase Postgres when NEXT_PUBLIC_SUPABASE_URL
// and NEXT_PUBLIC_SUPABASE_ANON_KEY (plus SUPABASE_SERVICE_ROLE_KEY on the
// server) are configured in .env.local or Vercel environment variables.
// =============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY ||
  "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("your-project")
);

export const isSupabaseAdminConfigured = Boolean(
  isSupabaseConfigured &&
    supabaseServiceRoleKey &&
    !supabaseServiceRoleKey.includes("your-service-role")
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

let adminClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client authenticated with SUPABASE_SERVICE_ROLE_KEY.
 * Used exclusively on the backend to read/write `app_metadata.role` and
 * administer accounts. Never expose this client to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured) return null;
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}

/**
 * Returns the Service-Role Supabase client when configured (bypassing RLS for
 * trusted server-side API routes), or falls back to the public Supabase client.
 */
export function getSupabaseServer(): SupabaseClient | null {
  return getSupabaseAdmin() || supabase;
}
