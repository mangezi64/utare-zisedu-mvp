import Link from "next/link";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  ShieldCheck,
  Lock,
  Clock,
  UserCheck,
  Trash2,
  AlertTriangle,
  Scale,
  FileText,
} from "lucide-react";

export const metadata = {
  title: "Data Protection & Privacy Policy | UTARE ZEM AI",
  description:
    "How UTARE ZEM AI collects, protects, retains, and deletes personal data in alignment with Zimbabwe's Cyber and Data Protection Act [Chapter 12:07] and international standards.",
};

export default function DataPolicyPage() {
  return (
    <div className="w-full min-h-screen">
      <PageBreadcrumb current="Data Policy & Privacy" />

      <section className="page-hero">
        <span className="eyebrow">DATA PROTECTION &amp; CYBERSECURITY POLICY · VERSION 2026-11-v1</span>
        <h1>Your data stays yours. Protected by design.</h1>
        <p>
          Grounded in Zimbabwe&apos;s{" "}
          <strong>Cyber and Data Protection Act [Chapter 12:07]</strong>,{" "}
          <strong>SI 155 of 2024</strong> (POTRAZ regulatory standards), and
          international data-protection principles.
        </p>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* At-a-glance cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-2">
            <UserCheck className="h-5 w-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Consent Before Sharing
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              Employers only see your application and profile summary when you
              explicitly toggle sharing ON. Phone numbers and hardware/power
              constraints are never shared with employers.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-2">
            <Clock className="h-5 w-5 text-amber-700" />
            <h2 className="text-sm font-bold text-slate-900">
              1-Year Inactivity &amp; 3 Notices
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              After 1 full year of no platform use, we prompt you to log in and
              confirm you want to remain. At least 3 reminder emails are sent
              before any deplatforming or deletion.
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 space-y-2">
            <Trash2 className="h-5 w-5 text-rose-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Permanent Self-Deletion
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              Delete your account and all database records anytime while signed
              in as yourself, or request Superuser erasure for special
              circumstances (such as bereavement).
            </p>
          </div>
        </div>

        {/* Detailed Legal & Operational Policy */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-700" />
              1. Legal &amp; Regulatory Alignment
            </h2>
            <p>
              UTARE ZEM AI processes personal information in accordance with{" "}
              <strong>
                Zimbabwe&apos;s Cyber and Data Protection Act [Chapter 12:07]
              </strong>{" "}
              and{" "}
              <strong>
                Statutory Instrument 155 of 2024 (Cyber and Data Protection
                Regulations)
              </strong>{" "}
              overseen by the{" "}
              <strong>
                Postal and Telecommunications Regulatory Authority of Zimbabwe
                (POTRAZ)
              </strong>
              , alongside internationally recognized GDPR-aligned principles of
              lawfulness, fairness, transparency, purpose limitation, data
              minimization, and security.
            </p>
            <p>
              <strong>Lawful Basis for Processing:</strong> Under Sections 10
              and 11 of the Cyber and Data Protection Act [Chapter 12:07],
              UTARE ZEM AI processes personal data strictly on the lawful bases
              of your <strong>explicit informed consent</strong> (at account
              registration and per-application employer sharing),{" "}
              <strong>performance of the career diagnostic, hub matching, and
              application services you request</strong>, and{" "}
              <strong>platform safety and legal compliance obligations</strong>{" "}
              (such as scam moderation and breach reporting).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-700" />
              2. Data Minimization: What We Collect &amp; Why
            </h2>
            <p>
              We collect only information strictly necessary to deliver career
              diagnostics, Partner Innovation Hub matching, tailored CVs, and
              verified remote-work applications:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>Account &amp; Contact Details:</strong> Name, email
                address, city/town, and optional phone number for coaching or
                hub coordination.
              </li>
              <li>
                <strong>Education, Practical Skills &amp; CVs:</strong>{" "}
                Qualification level (including self-taught and vocational
                trades), skills, uploaded credential files, and user-verified CV
                facts.
              </li>
              <li>
                <strong>Remote Readiness &amp; Hub Independence:</strong>{" "}
                Whether you can work remotely independently or need full/backup
                access to a solar-powered Partner Hub (device type, internet
                access, power hours, and payment rail readiness). We do{" "}
                <strong>not</strong> require income brackets or unrelated
                household survey fields to use the platform.
              </li>
              <li>
                <strong>Website-Only Security:</strong> Personal data is
                collected only through this authenticated web platform — never
                via unencrypted third-party messaging bots.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              3. Consent, Employer Access &amp; Automated AI Decisions
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>Explicit Account Consent:</strong> Creating an account
                requires reading and accepting this Data Policy via an unticked
                consent checkbox. Consent is never pre-ticked.
              </li>
              <li>
                <strong>Application Sharing Toggle:</strong> When submitting a
                job application, you must explicitly toggle ON consent to share
                your profile summary, CV, cover letter, and attached credentials
                with that employer. You can pause or resume employer access
                anytime from{" "}
                <Link href="/account" className="text-emerald-700 font-semibold underline">
                  My Workspace
                </Link>
                .
              </li>
              <li>
                <strong>Strictly Scoped Employer View:</strong> Employers never
                see your phone number, power/internet constraints, diagnostic
                sub-scores, or hub bookings.
              </li>
              <li>
                <strong>AI Decision Transparency (Right Against Unexplained Profiling):</strong>{" "}
                Every AI readiness classification clearly explains why you
                qualify or do not yet qualify for higher tiers and what steps
                unlock qualification. AI scores are advisory and never
                permanently bar you from applying. Employers make independent
                hiring decisions and reserve the right to share or withhold
                specific application feedback.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-700" />
              4. Data Retention &amp; 1-Year Inactivity Policy
            </h2>
            <p>
              In line with statutory storage limitation rules, UTARE does not
              keep personal data indefinitely:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>
                If your account records{" "}
                <strong>1 full year (365 days) of inactivity</strong>, you will
                be prompted to sign back in and confirm whether you want to
                remain on the platform.
              </li>
              <li>
                We send <strong>at least 3 email notices</strong> to your
                registered email address before any deplatforming or full
                deletion occurs.
              </li>
              <li>
                Logging in at any point resets the inactivity window and keeps
                your account active.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              5. Your Data Subject Rights (Access, Correction &amp; Erasure)
            </h2>
            <p>
              Under Part VI of the Cyber and Data Protection Act [Chapter
              12:07], you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>Access &amp; Rectification:</strong> View and update
                your profile, skills, documents, and CV artifacts anytime in{" "}
                <Link href="/account" className="text-emerald-700 font-semibold underline">
                  My Workspace
                </Link>
                .
              </li>
              <li>
                <strong>Withdraw Consent &amp; Self-Delete:</strong> While
                signed in as yourself, open{" "}
                <strong>Data Policy &amp; Account Deletion</strong> in your
                workspace, review the permanent erasure notice, and type{" "}
                <code>delete</code> to permanently erase your account and all
                associated database records.
              </li>
              <li>
                <strong>Special Circumstances / Deceased Account Erasure:</strong>{" "}
                Authorized family members or representatives may contact our
                team so a Superuser can permanently erase all data on request.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-700" />
              6. Platform Security, Scam Protection &amp; Breach Response
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>
                Passwords are salted and hashed (PBKDF2/scrypt); sessions use
                cryptographically signed HTTP-only cookies; administrative and
                employer routes enforce server-side role checks.
              </li>
              <li>
                <strong>Listing Safety Moderation:</strong> Reporting any job
                listing on{" "}
                <Link href="/jobs" className="text-emerald-700 font-semibold underline">
                  Remote Jobs
                </Link>{" "}
                immediately removes it from the public board and escalates it to
                Superusers for evaluation before restoration or permanent
                removal.
              </li>
              <li>
                <strong>Breach Notification Commitment:</strong> In alignment
                with Section 19 of the Cyber and Data Protection Act and Section
                17 of SI 155 of 2024, any high-risk security breach affecting
                personal data is logged, contained immediately, reported to
                POTRAZ within 24 hours, and communicated promptly to affected
                users.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              7. Named Contacts, Safety Escalation &amp; Decision Appeals
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
              <li>
                <strong>Safeguarding, Scam Moderation &amp; Data Protection Lead:</strong>{" "}
                <strong>Stewart Mangezi</strong> (Superuser / Platform Architecture Lead) — handles reported listings, safety concerns, data protection requests, and special-circumstance erasures.
              </li>
              <li>
                <strong>Human Decision Review &amp; Appeals Lead:</strong>{" "}
                <strong>Bheki Ndlovu</strong> (Partnerships &amp; Candidate Advocacy Lead) — reviews challenged AI readiness decisions and pathway appeals.
              </li>
            </ul>
            <p className="text-xs text-slate-600">
              For data access requests, special-circumstance erasure requests,
              safety reports, or appeals, contact{" "}
              <a
                href="mailto:utarezemai@gmail.com"
                className="font-semibold text-emerald-800 underline"
              >
                utarezemai@gmail.com
              </a>
              , call/WhatsApp{" "}
              <a
                href="tel:+263786113799"
                className="font-semibold text-emerald-800 underline"
              >
                +263 78 611 3799
              </a>
              , or visit our{" "}
              <Link href="/contact" className="font-semibold text-emerald-800 underline">
                Contact Page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
