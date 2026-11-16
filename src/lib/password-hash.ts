// =============================================================================
// UTARE ZEM AI — Server-Side Password Hashing & Verification (Node Crypto)
// =============================================================================
// Uses Node's built-in `scryptSync` and `timingSafeEqual` for memory-hard
// password hashing without native addon build dependencies.
// =============================================================================

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;
  try {
    const derived = scryptSync(password, salt, KEY_LEN);
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function generateRandomToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}
