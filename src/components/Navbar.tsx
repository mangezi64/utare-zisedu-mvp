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
    <header className="site-header no-print" suppressHydrationWarning>
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

        {/* Main Navigation Drawer */}
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

          {/* Mobile Navigation Drawer Auth Section (< 768px) */}
          <div className="md:hidden border-t border-slate-200/90 pt-3 mt-2 flex flex-col gap-2.5 w-full">
            {isAdmin ? (
              <>
                <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm">
                  <Shield className="h-4 w-4 text-amber-700 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-amber-950">
                      {user?.name || "Admin Facilitator"}
                    </span>
                    <span className="text-[10px] text-amber-700">
                      {isSuperuser ? "Superuser Active" : "Facilitator & Admin Active"}
                    </span>
                  </div>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 active:scale-98"
                >
                  <Shield className="h-4 w-4" />
                  <span>Return to Admin Console</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : isEmployer && user ? (
              <>
                <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900 shadow-sm">
                  <Building2 className="h-4 w-4 text-blue-700 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-blue-950">
                      {user.companyName || user.name}
                    </span>
                    <span className="text-[10px] text-blue-700">
                      Employer Partner Account
                    </span>
                  </div>
                </div>
                <Link
                  href="/employer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-98"
                >
                  <Globe className="h-4 w-4" />
                  <span>Return to Employer Portal</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : isCandidate && user ? (
              <>
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm">
                  <span className="avatar shrink-0" aria-hidden="true">
                    {user.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-emerald-950">{user.name}</span>
                    <span className="text-[10px] text-emerald-700">
                      {user.city ? `${user.city} • ` : ""}Candidate Workspace
                    </span>
                  </div>
                </div>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-98"
                >
                  <User className="h-4 w-4" />
                  <span>Return to My Workspace</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/login?tab=register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side Desktop Auth & Role Controls */}
        <div className="header-end">
          {isAdmin ? (
            <>
              {/* Desktop Controls */}
              <div className="hidden md:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 shadow-sm">
                  <Shield className="h-3.5 w-3.5 text-amber-700" />
                  <span>
                    {isSuperuser ? "Superuser:" : "Admin:"}{" "}
                    {user?.name?.split(" ")[0] || "Facilitator"}
                  </span>
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

              {/* Mobile Quick Icon (< 768px) */}
              <Link
                href="/admin"
                className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 shadow-sm"
                title="Admin Console"
                aria-label="Admin Console"
              >
                <Shield className="h-4 w-4" />
              </Link>
            </>
          ) : isEmployer && user ? (
            <>
              {/* Desktop Controls */}
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/employer"
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition shadow-sm"
                >
                  <Building2 className="h-3.5 w-3.5 text-blue-700" />
                  <span className="font-bold">
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

              {/* Mobile Quick Icon (< 768px) */}
              <Link
                href="/employer"
                className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 border border-blue-300 text-blue-900 shadow-sm"
                title="Employer Portal"
                aria-label="Employer Portal"
              >
                <Building2 className="h-4 w-4" />
              </Link>
            </>
          ) : isCandidate && user ? (
            <>
              {/* Desktop Controls */}
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition shadow-sm"
                >
                  <span className="avatar" aria-hidden="true">
                    {user.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="font-bold">{user.name}</span>
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

              {/* Mobile Quick Avatar (< 768px) */}
              <Link
                href="/account"
                className="md:hidden flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs shadow-sm"
                title="My Workspace"
                aria-label="My Workspace"
              >
                {user.name.slice(0, 2).toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              {/* Desktop Controls */}
              <div className="hidden md:flex items-center gap-2">
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

              {/* Mobile Quick Sign In (< 768px) */}
              <Link
                href="/login"
                className="md:hidden text-xs font-bold text-emerald-700 px-2 py-1 hover:underline"
              >
                Sign In
              </Link>
            </>
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
