"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useViewMode();

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email address...");
  const [targetHref, setTargetHref] = useState("/account");

  useEffect(() => {
    const token = searchParams.get("token") || "";
    const code = searchParams.get("code") || "";
    const email = searchParams.get("email") || "";

    if (!token && !code) {
      setStatus("error");
      setMessage("Missing email verification token or code.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, code, email }),
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
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Go to Sign In <ArrowRight className="h-4 w-4" />
              </Link>
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
