// =============================================================================
// UTARE ZEM AI — Server-side Email Domain Deliverability Check
// =============================================================================
// Confirms that the domain of an email address actually publishes MX records
// (i.e. can receive mail). This catches made-up domains such as
// "farai@asdkjhqwe.com" that pass a plain format check.
//
// SERVER ONLY — uses Node's DNS resolver. Do not import from client components.
// =============================================================================

import { resolveMx } from "node:dns/promises";

const DNS_TIMEOUT_MS = 3000;

export type DomainCheckResult = "deliverable" | "undeliverable" | "unknown";

/**
 * Returns:
 *  - "deliverable"   → domain has at least one MX record
 *  - "undeliverable" → domain does not exist or publishes no MX records
 *  - "unknown"       → DNS lookup failed/timed out (caller should fail open)
 */
export async function checkEmailDomain(email: string): Promise<DomainCheckResult> {
  const domain = (email.split("@")[1] || "").trim().toLowerCase();
  if (!domain) return "undeliverable";

  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), DNS_TIMEOUT_MS)
      ),
    ]);
    const usable = records.filter((r) => r.exchange && r.exchange !== ".");
    return usable.length > 0 ? "deliverable" : "undeliverable";
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA" || code === "NXDOMAIN") {
      return "undeliverable";
    }
    return "unknown";
  }
}
