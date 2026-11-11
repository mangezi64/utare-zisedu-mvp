"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Cpu,
  Building2,
  Briefcase,
  Sparkles,
  Route,
  User,
  Shield,
  SlidersHorizontal,
  BookOpen,
  Globe,
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";

const CANDIDATE_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/assessment", label: "Diagnostic", icon: Cpu },
  { href: "/pathway", label: "Pathway", icon: Route },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/skills", label: "Skills", icon: BookOpen },
  { href: "/hubs", label: "Hubs", icon: Building2 },
  { href: "/employers", label: "Employers", icon: Globe },
  { href: "/account", label: "My Workspace", icon: User },
];

const ADMIN_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/admin", label: "Admin Console", icon: Shield },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/hubs", label: "Partner Hubs", icon: Building2 },
  { href: "/employers", label: "Employers", icon: Globe },
  { href: "/assessment", label: "Intake Simulator", icon: Cpu },
];

export default function Navbar() {
  const pathname = usePathname();
  const { mode, isAdmin, toggleMode } = useViewMode();
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : CANDIDATE_NAV_ITEMS;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              UTARE <span className="text-emerald-700">ZISEDU AI</span>
            </span>
            <p className="text-xs text-slate-500">
              Zimbabwe Economic Mobility & Remote Bridge
            </p>
          </div>
        </Link>

        <nav className="hidden lg:flex lg:items-center lg:gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          {/* Mode Switcher: Candidate User vs Admin / Evaluator Console */}
          <button
            type="button"
            onClick={toggleMode}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              isAdmin
                ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
            title="Toggle between Candidate View (single user) and Admin/Facilitator Console"
          >
            {isAdmin ? (
              <>
                <Shield className="h-3.5 w-3.5 text-amber-700" />
                <span className="font-bold">Admin Console</span>
                <span className="rounded bg-amber-200/80 px-1 py-0.2 text-[10px] font-extrabold text-amber-900">
                  Exit
                </span>
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5 text-emerald-700" />
                <span>Candidate View</span>
                <span className="text-[10px] font-normal text-slate-400">
                  / Admin
                </span>
              </>
            )}
          </button>

          {isAdmin ? (
            <Link
              href="/admin"
              className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 sm:text-sm"
            >
              Admin Operations
            </Link>
          ) : (
            <Link
              href="/account"
              className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:text-sm"
            >
              My Workspace
            </Link>
          )}
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="flex overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mr-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
                active
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {isAdmin && (
        <div className="border-t border-amber-200 bg-amber-50/95 px-4 py-1 text-center text-[11px] font-semibold text-amber-900">
          🛠️ Facilitator & Admin Console Active — Multi-persona demo loaders and AI diagnostics are enabled for evaluation.
        </div>
      )}
    </header>
  );
}
