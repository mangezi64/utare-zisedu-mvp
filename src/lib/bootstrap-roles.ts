import { UserRole } from "@/types";

/**
 * Default fallback superuser email addresses for founders and system administrators.
 * Used when SUPERUSER_EMAILS environment variable is not explicitly configured or
 * while bootstrapping on new environments.
 */
export const DEFAULT_BOOTSTRAP_SUPERUSERS: string[] = [
  "admin@utare.co.zw",
  "admin@utarezem.ai",
  "stewart@utare.co.zw",
  "stewart.mangezi@utare.co.zw",
  "mangezi64@gmail.com",
];

/**
 * Checks whether an email address is listed in backend environment variables
 * (`SUPERUSER_EMAILS` or `ADMIN_EMAILS`) or default founding accounts so
 * administrators receive superuser/admin privileges upon signup, login, and
 * session verification.
 */
export function resolveBootstrapRole(
  email: string,
  fallbackRole: UserRole = "candidate"
): UserRole {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return fallbackRole;

  const superusers = (process.env.SUPERUSER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (
    superusers.includes(normalized) ||
    DEFAULT_BOOTSTRAP_SUPERUSERS.includes(normalized)
  ) {
    return "superuser";
  }

  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (admins.includes(normalized)) {
    return "admin";
  }

  return fallbackRole;
}
