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
  BookOpen,
  Globe,
  LogIn,
  LogOut,
  Info,
  HelpCircle,
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";

const PUBLIC_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/about", label: "About", icon: Info },
  { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/skills", label: "Skills", icon: BookOpen },
  { href: "/hubs", label: "Hubs", icon: Building2 },
  { href: "/employers", label: "For Employers", icon: Globe },
];

const CANDIDATE_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/assessment", label: "Diagnostic", icon: Cpu },
  { href: "/pathway", label: "Pathway", icon: Route },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/skills", label: "Skills", icon: BookOpen },
  { href: "/hubs", label: "Hubs", icon: Building2 },
  { href: "/account", label: "My Workspace", icon: User },
];

const ADMIN_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/admin", label: "Admin Console", icon: Shield },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/hubs", label: "Partner Hubs", icon: Building2 },
  { href: "/employers", label: "Employer Inquiries", icon: Globe },
  { href: "/assessment", label: "Intake Simulator", icon: Cpu },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, isCandidate, logout } = useViewMode();

  const navItems = isAdmin
    ? ADMIN_NAV_ITEMS
    : isAuthenticated
    ? CANDIDATE_NAV_ITEMS
    : PUBLIC_NAV_ITEMS;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
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

        {/* Navigation items */}
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

        {/* Right side authentication & account actions */}
        <div className="flex items-center gap-2.5">
          {isAdmin ? (
            /* Logged in as Admin */
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 shadow-sm">
                <Shield className="h-3.5 w-3.5 text-amber-700" />
                <span className="hidden sm:inline">Admin:</span>
                <span>{user?.name?.split(" ")[0] || "Facilitator"}</span>
              </span>
              <Link
                href="/admin"
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
              >
                Admin Console
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:bg-slate-100 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : isCandidate && user ? (
            /* Logged in as Candidate */
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition shadow-sm"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-bold">{user.name}</span>
              </Link>
              <Link
                href="/account"
                className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                My Workspace
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:bg-slate-100 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Public Visitor (Not logged in) */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5 text-slate-500" />
                Sign In
              </Link>
              <Link
                href="/login?tab=register"
                className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Get Started
              </Link>
            </div>
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
          🛠️ Facilitator &amp; Admin Console Active — Hub enlistment, job approvals &amp; candidate management enabled.
        </div>
      )}
    </header>
  );
}
