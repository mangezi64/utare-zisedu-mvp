"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldAlert, Trash2 } from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";

export default function DeleteAccountPanel() {
  const router = useRouter();
  const { user, logout } = useViewMode();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText.trim().toLowerCase() === "delete";

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfirmed) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmationText: confirmText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to delete your account right now.");
        setDeleting(false);
        return;
      }

      await logout();
      router.push("/?account_deleted=1");
    } catch {
      setError("Network error while deleting your account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-rose-600" />
          Data Policy &amp; Account Deletion
        </h3>
        <span className="text-[0.78rem] font-semibold text-rose-700">
          Your Data Control
        </span>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-[0.78rem] text-slate-600 space-y-1.5 leading-relaxed">
        <p>
          <strong>1-Year Inactivity Retention Policy:</strong> If your account
          has no activity for <strong>1 full year</strong>, we will prompt you to
          log in and confirm whether you want to remain on UTARE. We send{" "}
          <strong>at least 3 email notices</strong> before any deplatforming and
          permanent data deletion.
        </p>
        <p>
          <strong>On-Request Erasure:</strong> You may permanently delete your
          account and all data below while signed in as yourself. For special
          circumstances (e.g., if a user has passed on), family or authorized
          contacts may request full erasure via a Superuser on{" "}
          <span className="font-semibold">utarezemai@gmail.com</span>.
        </p>
      </div>

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => {
            setShowConfirm(true);
            setConfirmText("");
            setError(null);
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete My Account &amp; All Data
        </button>
      ) : (
        <form
          onSubmit={handleDeleteAccount}
          className="rounded-xl border-2 border-rose-300 bg-rose-50/70 p-4 space-y-3"
        >
          <div className="flex items-start gap-2 text-xs text-rose-950">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                Are you sure you want to delete your account ({user?.email})?
              </p>
              <p className="text-[0.78rem] text-rose-900 leading-relaxed">
                Deleting your account permanently takes it off the platform and{" "}
                <strong>erases all your data from the database</strong>{" "}
                (profile, diagnostic scores, career pathway, uploaded documents,
                tailored CVs, cover letters, and job applications).{" "}
                <strong>This action cannot be undone.</strong>
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-white border border-rose-300 px-3 py-2 text-[0.78rem] font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="delete-confirm-input"
              className="block text-[0.78rem] font-bold text-rose-950 mb-1"
            >
              Type <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200">delete</span> to confirm permanent erasure:
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "delete"'
              autoComplete="off"
              className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-rose-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
                setError(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || deleting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting All Data..." : "Permanently Delete"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
