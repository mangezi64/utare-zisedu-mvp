// =============================================================================
// UTARE ZEM AI — Cryptographically Signed Session Tokens (Edge & Node Safe)
// =============================================================================
// Uses Web Crypto API (crypto.subtle) with HMAC-SHA256 so session cookies can
// be verified in both Next.js Edge Middleware and Node.js API route handlers.
// =============================================================================

import { OrgRole, UserRole } from "@/types";

export const SESSION_COOKIE_NAME = "utare_session";
export const OAUTH_INTENT_COOKIE_NAME = "utare_oauth_intent";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEFAULT_OAUTH_INTENT_TTL_SECONDS = 60 * 10; // 10 minutes

export interface SessionPayload {
  sub: string; // user ID
  email: string;
  name: string;
  role: UserRole;
  orgRole?: OrgRole;
  employerId?: string;
  hubId?: string;
  emailConfirmed: boolean;
  companyName?: string;
  city?: string;
  qualification?: string;
  fieldOfStudy?: string;
  iat: number;
  exp: number;
}

export interface OAuthIntentPayload {
  intent: "login" | "register";
  accountType?: "candidate" | "employer";
  companyName?: string;
  website?: string;
  industry?: string;
  hiringModel?: string;
  city?: string;
  qualification?: string;
  fieldOfStudy?: string;
  dataPolicyAccepted?: boolean;
  redirectUrl?: string;
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  return (
    process.env.AUTH_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.POSTGRES_PASSWORD ||
    "utare-zem-v2-hmac-fallback-dev-secret-change-in-prod-9f8a7b6c5d4e3f2a"
  );
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeBytes(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  if (typeof atob === "function") {
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  }
  return new Uint8Array(Buffer.from(padded, "base64"));
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signHmacPayload<T extends object>(
  payloadData: T,
  ttlSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ...payloadData,
    iat: now,
    exp: now + ttlSeconds,
  };
  const enc = new TextEncoder();
  const payloadB64 = base64UrlEncodeBytes(enc.encode(JSON.stringify(payload)));
  const key = await getHmacKey();
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigB64 = base64UrlEncodeBytes(new Uint8Array(sigBuf));
  return `${payloadB64}.${sigB64}`;
}

async function verifyHmacPayload<T extends { exp?: number }>(
  token?: string | null
): Promise<T | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await getHmacKey();
    const enc = new TextEncoder();
    const sigBytes = base64UrlDecodeBytes(sigB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(payloadB64)
    );
    if (!valid) return null;

    const jsonStr = new TextDecoder().decode(base64UrlDecodeBytes(payloadB64));
    const payload = JSON.parse(jsonStr) as T;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function signSessionToken(
  user: Omit<SessionPayload, "iat" | "exp">,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<string> {
  return signHmacPayload(user, ttlSeconds);
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  const payload = await verifyHmacPayload<SessionPayload>(token);
  if (!payload || !payload.sub || !payload.email || !payload.role) return null;
  return payload;
}

/**
 * Signs a short-lived HTTP-only token carrying the user's pre-OAuth signup/login
 * intent and Zimbabwe Data Policy consent so /auth/callback can provision new
 * Google accounts without polluting the OAuth redirect_to URL.
 */
export async function signOAuthIntentToken(
  intent: Omit<OAuthIntentPayload, "iat" | "exp">,
  ttlSeconds = DEFAULT_OAUTH_INTENT_TTL_SECONDS
): Promise<string> {
  return signHmacPayload(intent, ttlSeconds);
}

/**
 * Verifies and decodes the signed OAuth intent token.
 */
export async function verifyOAuthIntentToken(
  token?: string | null
): Promise<OAuthIntentPayload | null> {
  const payload = await verifyHmacPayload<OAuthIntentPayload>(token);
  if (!payload || (payload.intent !== "login" && payload.intent !== "register")) {
    return null;
  }
  return payload;
}
