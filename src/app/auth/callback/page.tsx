"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
} from "lucide-react";
import { resolvePostLoginDestination } from "@/lib/bootstrap-roles";
import { useViewMode } from "@/lib/view-mode-context";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useViewMode();

  const [status, setStatus] = useState<
    "verifying" | "set-password" | "success" | "error"
  >("verifying");
  const [message, setMessage] = useState("Completing sign-in & verifying your account...");
  const [targetHref, setTargetHref] = useState("/account");

  const [resetToken, setResetToken] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [linkType, setLinkType] = useState<"invite" | "recovery" | "">("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;

    const token = searchParams.get("token") || "";
    const urlResetToken = searchParams.get("reset_token") || "";
    const code = searchParams.get("code") || "";
    const tokenHash = searchParams.get("token_hash") || "";
    const queryType = searchParams.get("type") || "";
    const email = searchParams.get("email") || "";
    const queryError =
      searchParams.get("error_description") || searchParams.get("error") || "";

    const hashRaw =
      typeof window !== "undefined"
        ? window.location.hash.replace(/^#/, "")
        : "";
    const hashParams = new URLSearchParams(hashRaw);
    const accessToken = hashParams.get("access_token") || "";
    const refreshToken = hashParams.get("refresh_token") || "";
    const hashType = hashParams.get("type") || "";
    const hashError =
      hashParams.get("error_description") || hashParams.get("error") || "";

    if (email) {
      setResendEmail(email);
      setSetupEmail(email);
    }

    const effectiveType = (queryType || hashType || "").toLowerCase();
    if (urlResetToken) {
      hasStartedRef.current = true;
      setResetToken(urlResetToken);
      setLinkType(effectiveType === "invite" ? "invite" : "recovery");
      setStatus("set-password");
      setMessage(
        effectiveType === "invite"
          ? "Welcome! Set a password to activate your organization account."
          : "Choose a new password for your account."
      );
      return;
    }

    const authError = hashError || queryError;
    if (authError && !token && !code && !tokenHash && !accessToken) {
      hasStartedRef.current = true;
      setStatus("error");
      const decodedError = authError.replace(/\+/g, " ");
      if (decodedError.toLowerCase().includes("provider is not enabled")) {
        setMessage(
          "Google Sign-In is not yet enabled in Supabase Authentication settings. Please enable Google under Supabase → Authentication → Sign In / Providers, or sign in with email and password."
        );
      } else {
        setMessage(
          decodedError || "This verification link is invalid or has expired."
        );
      }
      return;
    }

    if (!token && !code && !tokenHash && !accessToken) {
      hasStartedRef.current = true;
      setStatus("error");
      setMessage("Missing email verification token or code.");
      return;
    }

    hasStartedRef.current = true;

    // Strip tokens from URL bar once captured
    if (typeof window !== "undefined" && window.location.hash) {
      try {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      } catch {}
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        token,
        code,
        tokenHash,
        type: queryType || hashType || "signup",
        accessToken,
        refreshToken,
        email,
      }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(async ({ ok, data }) => {
        if (!ok || data.error) {
          setStatus("error");
          setMessage(data.error || "Invalid or expired confirmation link.");
          return;
        }
        await refreshSession();
        if (effectiveType === "invite" || effectiveType === "recovery") {
          setSetupEmail(data.email || email || "");
          setLinkType(effectiveType === "invite" ? "invite" : "recovery");
          setStatus("set-password");
          setMessage(
            effectiveType === "invite"
              ? "Welcome! Set a password to activate your organization account."
              : "Choose a new password for your account."
          );
          return;
        }
        const role = data.role || "candidate";
        const safeRedirect =
          typeof data.redirectTo === "string" &&
          data.redirectTo.startsWith("/") &&
          !data.redirectTo.startsWith("//")
            ? data.redirectTo
            : null;
        const destination =
          safeRedirect || resolvePostLoginDestination(role);
        setTargetHref(destination);
        setStatus("success");
        setMessage("Signed in! Redirecting you to your workspace...");
        setTimeout(() => {
          router.push(destination);
        }, 1200);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Failed to reach verification server. Please try again.");
      });
  }, [searchParams, router, refreshSession]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (resetToken && !setupEmail.trim()) {
      setPasswordError("Email address is required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSettingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: "set-password",
          email: setupEmail.trim().toLowerCase(),
          resetToken: resetToken || undefined,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setPasswordError(
          data.error || "Could not set password. Please check your link and try again."
        );
        return;
      }

      await refreshSession();
      const role = data.role || "candidate";
      const destination = resolvePostLoginDestination(role, data.redirectTo);
      setTargetHref(destination);
      setStatus("success");
      setMessage("Password set! Redirecting you to your workspace...");
      setTimeout(() => {
        router.push(destination);
      }, 1200);
    } catch {
      setPasswordError("Network error while setting password. Please try again.");
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus(null);
    setResendError(null);
    if (!resendEmail.trim()) {
      setResendError("Please enter your email address.");
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResendError(data.error || "Could not resend confirmation email.");
        return;
      }
      if (data.confirmationPath) {
        router.push(data.confirmationPath);
        return;
      }
      setResendStatus(
        data.message ||
          "A fresh confirmation link has been sent. Please check your inbox as well as your Spam, Junk, or Promotions folder."
      );
    } catch {
      setResendError("Network error while resending confirmation email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-4">
        {status === "verifying" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Sparkles className="h-6 w-6 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Completing Sign-In
            </h1>
            <p className="text-sm text-slate-600">{message}</p>
          </>
        )}

        {status === "set-password" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {linkType === "invite"
                ? "Set Your Password"
                : "Reset Your Password"}
            </h1>
            <p className="text-sm text-slate-600">{message}</p>

            <form
              onSubmit={handleSetPassword}
              className="mt-4 space-y-3 text-left"
            >
              <div>
                <label
                  htmlFor="setup-email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Account Email
                </label>
                <input
                  id="setup-email"
                  type="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  readOnly={Boolean(searchParams.get("email"))}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 chars (upper, lower, number)"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {passwordError && (
                <p className="text-xs text-red-700 font-medium">
                  {passwordError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSettingPassword}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 transition"
              >
                {isSettingPassword ? "Saving Password..." : "Set Password & Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Account Verified
            </h1>
            <p className="text-sm text-slate-600">{message}</p>
            <div className="pt-2">
              <Link
                href={targetHref}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition"
              >
                Continue Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Verification Failed
            </h1>
            <p className="text-sm text-slate-600">{message}</p>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Go to Sign In <ArrowRight className="h-4 w-4" />
              </Link>

              <form
                onSubmit={handleResend}
                className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2.5"
              >
                <label
                  htmlFor="resend-email-input"
                  className="block text-xs font-bold text-slate-700"
                >
                  Need a fresh confirmation link?
                </label>
                <p className="text-[0.78rem] text-slate-600">
                  Be sure to check your <strong>Spam, Junk, or Promotions</strong> folder for emails from <strong>UTARE ZEM AI</strong> (<code>utarezemai@gmail.com</code>).
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="resend-email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={isResending}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 transition whitespace-nowrap"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {isResending ? "Sending..." : "Resend Link"}
                  </button>
                </div>
                {resendError && (
                  <p className="text-[0.78rem] text-red-700 font-medium">
                    {resendError}
                  </p>
                )}
                {resendStatus && (
                  <p className="text-[0.78rem] text-emerald-700 font-medium">
                    {resendStatus}
                  </p>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Sparkles className="h-5 w-5 text-emerald-700 animate-spin" />
            Verifying account...
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
