"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Globe,
  Sun,
  ShieldCheck,
  ArrowRight,
  Send,
  Users,
} from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { validatePassword } from "@/lib/validation";
import { useViewMode } from "@/lib/view-mode-context";

export default function EmployersPage() {
  const { isEmployer, isAdmin } = useViewMode();

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    password: "",
    website: "",
    industry: "Technology & SaaS",
    rolesInterested:
      "Digital Operations, Data Analysis, Software Engineering",
    hiringModel: "100% Remote Contract",
    estimatedHires: 2,
    timezoneOverlapNeeded: "CAT (GMT+2) / UK-EU overlap",
    additionalNotes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmationPath, setConfirmationPath] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pwStrength = validatePassword(formData.password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setConfirmationPath(null);
    setErrorMessage(null);

    if (formData.password && !pwStrength.isValid) {
      setErrorMessage(
        pwStrength.error || "Please choose a stronger password."
      );
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/employers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit registration");
      }

      setSuccessMessage(
        data.message || "Employer enrolment registered successfully."
      );
      if (data.confirmationPath) {
        setConfirmationPath(data.confirmationPath);
      }
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        password: "",
        website: "",
        industry: "Technology & SaaS",
        rolesInterested:
          "Digital Operations, Data Analysis, Software Engineering",
        hiringModel: "100% Remote Contract",
        estimatedHires: 2,
        timezoneOverlapNeeded: "CAT (GMT+2) / UK-EU overlap",
        additionalNotes: "",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Hero */}
      <section className="rounded-3xl bg-slate-900 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1 text-xs font-semibold text-emerald-300">
            <Building2 className="h-3.5 w-3.5" />
            For Global &amp; Local Employers
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Hire Verified, Remote-Ready{" "}
            <span className="text-emerald-400">Zimbabwean Talent.</span>
          </h1>
          <p className="text-base text-slate-300 sm:text-lg leading-relaxed">
            Overcome recruitment friction and access an untapped pool of
            tertiary-educated, fluent English-speaking professionals. Every
            Utare candidate is verified for competency, paired with a
            solar-backed Starlink workstation, and compliant with international
            payment rails.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {isEmployer || isAdmin ? (
              <Link
                href="/employer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                Open Employer Portal &amp; Applicants
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login?tab=register&role=employer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  Create Employer Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login?redirect=/employer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition"
                >
                  Employer Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4 Value Pillars */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
            <Globe className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            CAT (GMT+2) Timezone
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full 6–8 hour direct working overlap with UK, European, and South
            African business hours.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-bold">
            <Sun className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            Infrastructure Guaranteed
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Zero dropouts. Candidates operate from verified local hubs with 100%
            solar microgrids &amp; Starlink.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            Verified Competency
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pre-assessed across English fluency, digital literacy, and practical
            domain problem solving.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 font-bold">
            <Users className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            Compliant EOR &amp; Rails
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seamless contractor hiring via Deel, Payoneer, Wise, or direct USD
            Nostro wire transfers.
          </p>
        </div>
      </section>

      {/* Enrolment & Account Creation Form */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Enrol Your Organization &amp; Post Remote Roles
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Register your company below. Include a password to create your
            Employer Portal account so you can post available roles and review
            applications directly.
          </p>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <span>{successMessage}</span>
            </div>
            {confirmationPath && (
              <div>
                <Link
                  href={confirmationPath}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
                >
                  Confirm Email &amp; Open Employer Portal{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900 shadow-sm">
            ✕ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Savannah Tech Labs UK"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins (Head of Operations)"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work Email *
              </label>
              <input
                type="email"
                required
                placeholder="sarah@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Create Portal Password (Optional — enables Employer Portal)
              </label>
              <PasswordInput
                value={formData.password}
                onChange={(password) => setFormData({ ...formData, password })}
                placeholder="Strong password (8+ chars, upper/lower/num/symbol)"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Company Website
              </label>
              <input
                type="url"
                placeholder="https://company.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Roles of Interest (e.g. Data Annotation, Virtual Assistance,
                Python)
              </label>
              <input
                type="text"
                value={formData.rolesInterested}
                onChange={(e) =>
                  setFormData({ ...formData, rolesInterested: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Preferred Hiring Model
              </label>
              <select
                value={formData.hiringModel}
                onChange={(e) =>
                  setFormData({ ...formData, hiringModel: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
              >
                <option value="100% Remote Contract">
                  100% Remote Contract
                </option>
                <option value="Full-Time EOR via Deel">
                  Full-Time EOR via Deel
                </option>
                <option value="Freelance / Task-based">
                  Freelance / Task-based
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Specific Requirements or Notes
            </label>
            <textarea
              rows={3}
              placeholder="Tell us about your team size, required tool proficiencies, or target onboarding dates..."
              value={formData.additionalNotes}
              onChange={(e) =>
                setFormData({ ...formData, additionalNotes: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800 transition shadow-sm disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Registering..." : "Enrol Organization"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
