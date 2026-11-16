"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Cpu,
  Building2,
  Briefcase,
  Route,
  User,
  Shield,
  BookOpen,
  Globe,
  LogIn,
  LogOut,
  Info,
  HelpCircle,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";

const PUBLIC_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/about", label: "About Us", icon: Info },
  { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/skills", label: "Skills Development", icon: BookOpen },
  { href: "/hubs", label: "Hubs", icon: Building2 },
  { href: "/employers", label: "For Employers", icon: Globe },
  { href: "/contact", label: "Contact", icon: Mail },
];

const CANDIDATE_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/account", label: "My Workspace", icon: User },
  { href: "/jobs", label: "CV Studio", icon: Briefcase },
  { href: "/assessment", label: "Diagnostic", icon: Cpu },
  { href: "/pathway", label: "Pathway", icon: Route },
  { href: "/opportunities", label: "Opportunities", icon: Globe },
  { href: "/hubs", label: "Hubs", icon: Building2 },
];

const EMPLOYER_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/employer", label: "Employer Portal", icon: Globe },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/hubs", label: "Partner Hubs", icon: Building2 },
  { href: "/contact", label: "Contact", icon: Mail },
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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    user,
    isAuthenticated,
    isAdmin,
    isSuperuser,
    isEmployer,
    isCandidate,
    logout,
  } = useViewMode();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    router.push("/");
  };

  const navItems = isAdmin
    ? ADMIN_NAV_ITEMS
    : isEmployer
    ? EMPLOYER_NAV_ITEMS
    : isAuthenticated
    ? CANDIDATE_NAV_ITEMS
    : PUBLIC_NAV_ITEMS;

  return (
    <header className="site-header no-print">
      <div className="header-inner">
        {/* Faith & Amanda's Brand Mark ("U" with emerald indicator dot) */}
        <Link
          href="/"
          className="brand"
          aria-label="UTARE ZEM AI overview"
          onClick={() => setMobileOpen(false)}
        >
          <span className="brand-mark">U</span>
          <span>
            <b>UTARE</b> ZEM AI
            <small>Zimbabwe Economic Mobility &amp; Remote Bridge</small>
          </span>
        </Link>

        {/* Main Navigation */}
        <nav
          className={`main-nav ${mobileOpen ? "open" : ""}`}
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 ${
                  active ? "active" : ""
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side Auth & Role Controls */}
        <div className="header-end">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 shadow-sm">
                <Shield className="h-3.5 w-3.5 text-amber-700" />
                <span className="hidden sm:inline">
                  {isSuperuser ? "Superuser:" : "Admin:"}
                </span>
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
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign out"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : isEmployer && user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/employer"
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition shadow-sm"
              >
                <Building2 className="h-3.5 w-3.5 text-blue-700" />
                <span className="hidden sm:inline font-bold">
                  {user.companyName || user.name}
                </span>
              </Link>
              <Link
                href="/employer"
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Employer Portal
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign out"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : isCandidate && user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition shadow-sm"
              >
                <span className="avatar" aria-hidden="true">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden sm:inline font-bold">{user.name}</span>
              </Link>
              <Link
                href="/account"
                className="button button-green"
                style={{ minHeight: "36px", padding: "0 14px", fontSize: "11.5px" }}
              >
                My Workspace
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign out"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="signin-link">
                Sign In
              </Link>
              <Link
                href="/login?tab=register"
                className="button button-green"
                style={{ minHeight: "38px", padding: "0 15px", fontSize: "12px" }}
              >
                Create Account
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="border-t border-amber-200 bg-amber-50/95 px-4 py-1 text-center text-[11px] font-semibold text-amber-900">
          🛠️ {isSuperuser ? "Superuser" : "Facilitator & Admin"} Console Active
          — Employer verification, hub enlistment, job moderation &amp; cohort
          oversight enabled.
        </div>
      )}
    </header>
  );
}
