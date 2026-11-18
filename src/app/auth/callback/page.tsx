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
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useViewMode();

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("Verifying your email address...");
  const [targetHref, setTargetHref] = useState("/account");

  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;

    const token = searchParams.get("token") || "";
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
    }

    const authError = hashError || queryError;
    if (authError && !token && !code && !tokenHash && !accessToken) {
      hasStartedRef.current = true;
      setStatus("error");
      setMessage(
        authError.replace(/\+/g, " ") ||
          "This verification link is invalid or has expired."
      );
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
        const role = data.role || "candidate";
        const destination =
          role === "employer"
            ? "/employer"
            : role === "admin" || role === "superuser"
            ? "/admin"
            : "/assessment";
        setTargetHref(destination);
        setStatus("success");
        setMessage("Email verified! Redirecting you to your workspace...");
        setTimeout(() => {
          router.push(destination);
        }, 1200);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Failed to reach verification server. Please try again.");
      });
  }, [searchParams, router, refreshSession]);

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
          "A fresh confirmation link has been sent to your email address."
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
              Confirming Your Email
            </h1>
            <p className="text-sm text-slate-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Email Confirmed
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
                  <p className="text-[11px] text-red-700 font-medium">
                    {resendError}
                  </p>
                )}
                {resendStatus && (
                  <p className="text-[11px] text-emerald-700 font-medium">
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
