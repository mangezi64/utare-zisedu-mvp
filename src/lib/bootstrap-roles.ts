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

/**
 * Resolves the post-login destination for each user role while guarding
 * explicit `?redirect=` targets against cross-role mismatches.
 */
export function resolvePostLoginDestination(
  role: UserRole | string | undefined,
  redirectUrl?: string | null
): string {
  const isAdminRole = role === "admin" || role === "superuser";
  const isEmployerRole = role === "employer";

  const isSafeRedirect =
    Boolean(redirectUrl) &&
    redirectUrl!.startsWith("/") &&
    !redirectUrl!.startsWith("//") &&
    !(redirectUrl!.startsWith("/admin") && !isAdminRole) &&
    !(
      redirectUrl!.startsWith("/employer") &&
      !redirectUrl!.startsWith("/employers") &&
      !isEmployerRole &&
      !isAdminRole
    ) &&
    !(
      (redirectUrl!.startsWith("/account") ||
        redirectUrl!.startsWith("/pathway")) &&
      isEmployerRole
    );

  if (isSafeRedirect && redirectUrl) {
    return redirectUrl;
  }
  if (isAdminRole) return "/admin";
  if (isEmployerRole) return "/employer";
  return "/account";
}
