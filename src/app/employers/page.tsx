"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Globe,
  Sun,
  ShieldCheck,
  ArrowRight,
  Users,
} from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { validatePassword } from "@/lib/validation";
import { useViewMode } from "@/lib/view-mode-context";

const STEPS = [
  {
    num: "01",
    title: "Share your needs",
    text: "Describe roles, required skills, working arrangements, and timezone overlap clearly.",
  },
  {
    num: "02",
    title: "Support readiness",
    text: "Candidates are pre-assessed on English fluency, digital literacy, and paired with solar-backed Starlink hubs.",
  },
  {
    num: "03",
    title: "Explore a fit",
    text: "Post verified opportunities and review tailored applications through a transparent, scoped Employer Portal.",
  },
];

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
    <div>
      {/* Faith & Amanda's Page Hero */}
      <section className="page-hero">
        <span className="eyebrow">FOR EMPLOYERS &amp; PARTNERS</span>
        <h1>Connect with talent ready to grow.</h1>
        <p>
          UTARE bridges organisations and verified Zimbabwean talent—combining
          tertiary academic credentials, practical competency diagnostics,
          solar-backed Starlink workstations, and international payment rail
          compatibility.
        </p>

        <div className="hero-actions">
          {isEmployer || isAdmin ? (
            <Link href="/employer" className="button button-green">
              Open Employer Portal &amp; Applicants
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login?tab=register&role=employer"
                className="button button-green"
              >
                Create Employer Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login?redirect=/employer" className="button">
                Employer Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Two-Column Intro */}
      <section className="content-section two-col employer-intro">
        <div>
          <div className="section-heading">
            <span className="eyebrow">WHY CONSIDER ZIMBABWEAN TALENT?</span>
            <h2>Skills, perspective and potential</h2>
            <p>
              Zimbabwean candidates bring strong educational backgrounds,
              fluent English communication, and practical motivation to
              contribute. UTARE makes those capabilities easier to verify,
              equip, and connect.
            </p>
          </div>
        </div>

        <div className="prose">
          <p>
            Employers can collaborate by sharing clear role requirements,
            posting remote or hybrid opportunities, and reviewing pre-assessed
            candidates through transparent processes.
          </p>
          <p>
            Every candidate on the platform is evaluated across a 6-factor
            readiness diagnostic and supported with local partner hub
            infrastructure to eliminate power or connectivity disruptions.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <a href="#employer-enquiry-form" className="button button-green">
              Register employer interest <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/contact" className="button">
              Start a conversation
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Step Employer Process */}
      <section className="partner-options employer-steps">
        {STEPS.map((s) => (
          <article key={s.num}>
            <span className="eyebrow">COLLABORATION PROCESS · {s.num}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </section>

      {/* 4 Operational Guarantees */}
      <section className="content-section" style={{ paddingTop: "20px", paddingBottom: "20px" }}>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="icon-tile">
              <Globe className="h-5 w-5" />
            </span>
            <h3>CAT (GMT+2) Timezone</h3>
            <p>
              Full 6–8 hour direct working overlap with UK, European, and South
              African business hours.
            </p>
          </article>

          <article className="feature-card">
            <span className="icon-tile">
              <Sun className="h-5 w-5" />
            </span>
            <h3>Infrastructure Guaranteed</h3>
            <p>
              Candidates operate from verified local hubs with 100% solar
              microgrids, Starlink broadband, and PC loans.
            </p>
          </article>

          <article className="feature-card">
            <span className="icon-tile">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h3>Verified Competency</h3>
            <p>
              Pre-assessed across English fluency, digital literacy, async
              workflows, and domain problem solving.
            </p>
          </article>

          <article className="feature-card">
            <span className="icon-tile">
              <Users className="h-5 w-5" />
            </span>
            <h3>Compliant EOR &amp; Rails</h3>
            <p>
              Seamless contractor onboarding via Deel, Payoneer, Wise, or
              direct USD Nostro wire transfers.
            </p>
          </article>
        </div>
      </section>

      {/* Employer Enquiry & Portal Enrolment Form */}
      <section
        id="employer-enquiry-form"
        className="content-section employer-form-section"
      >
        <div>
          <div className="section-heading">
            <span className="eyebrow">EMPLOYER ENQUIRY &amp; PORTAL</span>
            <h2>Tell us how you&apos;d like to collaborate</h2>
            <p>
              Register your organisation below to save your hiring inquiry to
              our PostgreSQL database. Include a password to activate your
              Employer Portal account so you can post jobs and review
              applicants directly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-card form-stack">
          {successMessage && (
            <div className="rounded-xl border border-[#c2e2d4] bg-[#eaf5f0] p-4 text-xs font-semibold text-[#101a33] space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#08785f]" />
                <span>{successMessage}</span>
              </div>
              {confirmationPath && (
                <div>
                  <Link
                    href={confirmationPath}
                    className="button button-green"
                    style={{ minHeight: "36px", padding: "0 14px", fontSize: "11.5px" }}
                  >
                    Confirm Email &amp; Open Employer Portal{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900">
              ✕ {errorMessage}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Organisation name *</span>
              <input
                type="text"
                required
                placeholder="e.g. Savannah Tech Labs UK"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Contact person *</span>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins (Head of Ops)"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Contact email *</span>
              <input
                type="email"
                required
                placeholder="you@organisation.org"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Company website</span>
              <input
                type="url"
                placeholder="https://organisation.org"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
              />
            </label>
          </div>

          <div className="field">
            <span>
              Create Portal Password (Optional — enables Employer Portal sign-in)
            </span>
            <PasswordInput
              value={formData.password}
              onChange={(password) => setFormData({ ...formData, password })}
              placeholder="Strong password (8+ chars, upper/lower/num/symbol)"
              autoComplete="new-password"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Industry</span>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Partnership &amp; hiring model</span>
              <select
                value={formData.hiringModel}
                onChange={(e) =>
                  setFormData({ ...formData, hiringModel: e.target.value })
                }
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
                <option value="Skills & Hub Partnership">
                  Skills &amp; Hub Partnership
                </option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Roles of interest</span>
            <input
              type="text"
              placeholder="e.g. Digital Operations, Data Analysis, Software Engineering"
              value={formData.rolesInterested}
              onChange={(e) =>
                setFormData({ ...formData, rolesInterested: e.target.value })
              }
            />
          </label>

          <label className="field">
            <span>How might you work with UTARE?</span>
            <textarea
              rows={4}
              placeholder="Share details about your hiring needs, required skills, or partnership interest..."
              value={formData.additionalNotes}
              onChange={(e) =>
                setFormData({ ...formData, additionalNotes: e.target.value })
              }
            />
          </label>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="button button-green"
            >
              {submitting ? "Registering..." : "Register interest"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
