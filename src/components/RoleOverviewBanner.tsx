"use client";

import Link from "next/link";
import { useViewMode } from "@/lib/view-mode-context";
import {
  ArrowRight,
  Building2,
  Briefcase,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  User,
  Wifi,
} from "lucide-react";

interface QuickLink {
  href: string;
  label: string;
  primary?: boolean;
}

export default function RoleOverviewBanner() {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isEmployer,
    isHub,
    isCandidate,
    isOrgAdmin,
  } = useViewMode();

  if (!isAuthenticated || !user) {
    return null;
  }

  let roleLabel = "Candidate";
  let roleBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  let summary = "Access your workspace, skills diagnostic, AI career pathway, and verified remote opportunities.";
  let links: QuickLink[] = [];
  let RoleIcon = User;

  if (isAdmin) {
    roleLabel = user.role === "superuser" ? "Superuser Admin" : "Platform Admin";
    roleBadgeClass = "bg-amber-100 text-amber-900 border-amber-200";
    summary = "Manage platform verification, employer onboarding, partner hubs, and facilitator diagnostics.";
    RoleIcon = ShieldCheck;
    links = [
      { href: "/admin", label: "Admin Console", primary: true },
      { href: "/employers", label: "Employers" },
      { href: "/assessment", label: "Intake Simulator" },
    ];
  } else if (isEmployer) {
    roleLabel = isOrgAdmin ? "Employer · Org Admin" : "Employer · Team Member";
    roleBadgeClass = "bg-blue-100 text-blue-900 border-blue-200";
    summary = user.companyName
      ? `Managing talent & listings for ${user.companyName}.`
      : "Manage your company profile, open roles, and verified candidate applications.";
    RoleIcon = Briefcase;
    links = [
      { href: "/employer", label: "Employer Portal", primary: true },
      { href: "/opportunities", label: "Opportunities" },
      { href: "/hubs", label: "Partner Hubs" },
    ];
  } else if (isHub) {
    roleLabel = isOrgAdmin ? "Partner Hub · Org Admin" : "Partner Hub · Staff";
    roleBadgeClass = "bg-teal-100 text-teal-900 border-teal-200";
    summary = "Update workstation availability, laptop loan status, and hub team access.";
    RoleIcon = Wifi;
    links = [
      { href: "/hub-portal", label: "Hub Portal", primary: true },
      { href: "/hubs", label: "Partner Hubs" },
    ];
  } else if (isCandidate) {
    roleLabel = "Candidate";
    roleBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
    summary = "Continue your readiness diagnostic, AI career roadmap, and tailored applications.";
    RoleIcon = Sparkles;
    links = [
      { href: "/account", label: "My Workspace", primary: true },
      { href: "/assessment", label: "Diagnostic" },
      { href: "/pathway", label: "Pathway" },
      { href: "/opportunities", label: "Opportunities" },
      { href: "/employers", label: "Employers" },
    ];
  }

  return (
    <section
      aria-label="Signed-in role quick navigation"
      className="border-b border-slate-200 bg-slate-50/90"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#08785f] border border-emerald-100">
              <RoleIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-900 truncate">
                  Welcome back, {user.name}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${roleBadgeClass}`}
                >
                  <LayoutDashboard className="h-3 w-3" aria-hidden="true" />
                  {roleLabel}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">{summary}</p>
            </div>
          </div>

          <nav
            aria-label="Role quick links"
            className="flex flex-wrap items-center gap-2"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.primary
                    ? "inline-flex items-center gap-1.5 rounded-xl bg-[#08785f] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#06634e] transition"
                    : "inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                }
              >
                {link.label}
                {link.primary && (
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
