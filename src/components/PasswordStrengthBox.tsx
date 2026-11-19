"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { validatePassword } from "@/lib/validation";

const STRENGTH_STYLES: Record<string, { bar: string; text: string }> = {
  "Too Weak": { bar: "bg-slate-200", text: "text-slate-500" },
  Weak: { bar: "bg-red-500", text: "text-red-600" },
  Fair: { bar: "bg-amber-500", text: "text-amber-600" },
  Good: { bar: "bg-lime-500", text: "text-lime-700" },
  Strong: { bar: "bg-emerald-600", text: "text-emerald-700" },
};

interface PasswordStrengthBoxProps {
  password: string;
  showIssues?: boolean;
  id?: string;
}

/**
 * Displays password strength bars and requirement checklist.
 * Highlights missing requirements and container in red when `showIssues` is true.
 */
export default function PasswordStrengthBox({
  password,
  showIssues = false,
  id,
}: PasswordStrengthBoxProps) {
  const pwStrength = validatePassword(password);
  const hasIssues = showIssues && !pwStrength.isValid;

  if (password.length === 0 && !showIssues) {
    return null;
  }

  return (
    <div
      id={id}
      role={hasIssues ? "alert" : undefined}
      className={`rounded-lg p-3 space-y-2 transition-colors ${
        hasIssues
          ? "border-2 border-red-400 bg-red-50/90"
          : "border border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className={hasIssues ? "text-red-800 font-bold" : "text-slate-700"}>
          {hasIssues
            ? "Password missing required rules:"
            : "Password strength"}
        </span>
        <span
          className={
            hasIssues
              ? "text-red-700 font-bold"
              : STRENGTH_STYLES[pwStrength.label].text
          }
        >
          {pwStrength.label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full ${
              pwStrength.score >= i
                ? hasIssues
                  ? "bg-red-500"
                  : STRENGTH_STYLES[pwStrength.label].bar
                : hasIssues
                ? "bg-red-200"
                : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {pwStrength.requirements.map((r) => {
          const highlightRed = !r.met && hasIssues;
          return (
            <li
              key={r.id}
              className={`flex items-center gap-1.5 text-[11px] rounded-md px-1.5 py-0.5 transition-colors ${
                r.met
                  ? "text-emerald-700 font-medium"
                  : highlightRed
                  ? "bg-red-100 border border-red-300 text-red-800 font-bold"
                  : "text-slate-600"
              }`}
            >
              {r.met ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : highlightRed ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              )}
              <span>{r.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
