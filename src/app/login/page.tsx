"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  User,
  ArrowRight,
  CheckCircle2,
  Mail,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Building2,
  Globe,
  BookOpen,
  Users,
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";
import ZimbabweCitySelect from "@/components/ZimbabweCitySelect";
import PasswordInput from "@/components/PasswordInput";
import { validateEmail, validatePassword } from "@/lib/validation";
import { resolvePostLoginDestination } from "@/lib/bootstrap-roles";

const STRENGTH_STYLES: Record<string, { bar: string; text: string }> = {
  "Too Weak": { bar: "bg-slate-200", text: "text-slate-500" },
  Weak: { bar: "bg-red-500", text: "text-red-600" },
  Fair: { bar: "bg-amber-500", text: "text-amber-600" },
  Good: { bar: "bg-lime-500", text: "text-lime-700" },
  Strong: { bar: "bg-emerald-600", text: "text-emerald-700" },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "register" ? "register" : "login";
  const initialRole =
    searchParams.get("role") === "employer" ? "employer" : "candidate";
  const redirectUrl = searchParams.get("redirect");

  const { setSessionUser } = useViewMode();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [accountType, setAccountType] = useState<"candidate" | "employer">(
    initialRole
  );

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register State
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regEmailTouched, setRegEmailTouched] = useState(false);

  // Candidate-specific fields
  const [city, setCity] = useState("Harare");
  const [qualification, setQualification] = useState("Bachelors Degree");
  const [fieldOfStudy, setFieldOfStudy] = useState("Computer Science & IT");

  // Employer-specific fields
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("Technology & SaaS");
  const [hiringModel, setHiringModel] = useState("100% Remote Contract");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [confirmationPath, setConfirmationPath] = useState<string | null>(null);

  // Forgot / Reset Password state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetFullName, setResetFullName] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setResetSuccessMsg("");
    if (!loginEmail.trim() || !resetFullName.trim() || !resetNewPassword) {
      setLoginError(
        "Please enter your registered email, full name, and new password."
      );
      return;
    }
    const pwCheck = validatePassword(resetNewPassword);
    if (!pwCheck.isValid) {
      setLoginError(pwCheck.error || "Please choose a stronger password.");
      return;
    }
    setResettingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reset",
          email: loginEmail.trim().toLowerCase(),
          fullName: resetFullName.trim(),
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.error || "Password reset failed.");
        return;
      }
      setResetSuccessMsg(
        data.message || "Password updated! You can now sign in below."
      );
      setLoginPassword(resetNewPassword);
      setShowResetPassword(false);
      setResetNewPassword("");
    } catch {
      setLoginError("Could not reach the server. Please try again.");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setConfirmationPath(null);

    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    const normalizedEmail = loginEmail.trim().toLowerCase();
    const emailCheck = validateEmail(normalizedEmail);
    if (!emailCheck.isValid) {
      setLoginError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.confirmationPath) {
          setConfirmationPath(data.confirmationPath);
        }
        setLoginError(data.error || "Invalid email or password.");
        return;
      }

      if (data.user) {
        setSessionUser(data.user);
        router.push(resolvePostLoginDestination(data.user.role, redirectUrl));
      }
    } catch {
      setLoginError(
        "Unable to reach authentication server. Please check your connection."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setRegisterSuccess("");
    setConfirmationPath(null);

    if (!fullName.trim() || !regEmail || !regPassword) {
      setLoginError("Please complete all required fields.");
      return;
    }

    if (accountType === "employer" && !companyName.trim()) {
      setLoginError("Company name is required for employer registration.");
      return;
    }

    const emailCheck = validateEmail(regEmail);
    if (!emailCheck.isValid) {
      setRegEmailTouched(true);
      setLoginError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    const pwCheck = validatePassword(regPassword);
    if (!pwCheck.isValid) {
      setLoginError(pwCheck.error || "Please choose a stronger password.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setLoginError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          fullName: fullName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          ...(accountType === "employer"
            ? {
                companyName: companyName.trim(),
                website: website.trim(),
                industry,
                hiringModel,
              }
            : {
                city,
                qualification,
                fieldOfStudy,
              }),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.error || "Registration failed. Please try again.");
        return;
      }

      setRegisterSuccess(
        data.message ||
          "Account created! Please confirm your email address to sign in."
      );
      if (data.confirmationPath) {
        setConfirmationPath(data.confirmationPath);
      }
    } catch {
      setLoginError(
        "We couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const regEmailCheck = validateEmail(regEmail);
  const showRegEmailError =
    regEmailTouched && regEmail.length > 0 && !regEmailCheck.isValid;
  const pwStrength = validatePassword(regPassword);
  const confirmMismatch =
    regConfirmPassword.length > 0 && regConfirmPassword !== regPassword;

  return (
    <div className="login-page">
      {/* Faith & Amanda's Left Split-Screen Visual with Animated Orbital Nodes */}
      <section className="login-visual">
        <div className="login-visual-inner">
          <Link
            href="/"
            className="brand brand-light"
            aria-label="UTARE ZEM AI overview"
          >
            <span className="brand-mark">U</span>
            <span>
              <b>UTARE</b> ZEM AI
              <small>Zimbabwe Economic Mobility &amp; Remote Bridge</small>
            </span>
          </Link>

          <div className="login-copy">
            <span className="eyebrow eyebrow-light">
              ECONOMIC MOBILITY, WITH POSSIBILITY
            </span>
            <h1>
              Bridging Zimbabwe&apos;s Credentials to{" "}
              <em>Economic Opportunity.</em>
            </h1>
            <p>
              Helping Zimbabwean talent access AI career pathways, develop
              practical skills, connect with solar-backed innovation hubs, and
              reach opportunities beyond geographical boundaries.
            </p>

            {/* Orbital Node Visual Graphic */}
            <div className="visual-graphic" aria-hidden="true">
              <div className="graphic-orbit orbit-a" />
              <div className="graphic-orbit orbit-b" />
              <div className="graphic-core">
                <Building2 className="h-8 w-8" />
              </div>
              <span className="graphic-node node-a">
                <BookOpen className="h-4 w-4" />
              </span>
              <span className="graphic-node node-b">
                <Briefcase className="h-4 w-4" />
              </span>
              <span className="graphic-node node-c">
                <Users className="h-4 w-4" />
              </span>
              <div className="graphic-caption">
                <span className="pulse" /> Talent, skills &amp; opportunity in
                motion
              </div>
            </div>
          </div>

          <div className="login-footnote">
            Connected to PostgreSQL persistence &amp; PBKDF2-SHA256 verified
            session authentication.
          </div>
        </div>
      </section>

      {/* Right Side: Live Sign In & Account Creation Form */}
      <section className="login-form-side">
        <div className="login-form-wrap">
          <div className="mobile-brand">
            <Link href="/" className="brand">
              <span className="brand-mark">U</span>
              <span>
                <b>UTARE</b> ZEM AI
                <small>Zimbabwe Economic Mobility &amp; Remote Bridge</small>
              </span>
            </Link>
          </div>

          {/* Tab Switcher */}
          <div
            className="flex gap-2 mb-5 p-1 rounded-xl"
            style={{ background: "#eaf0ed" }}
          >
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setLoginError("");
                setRegisterSuccess("");
              }}
              className={`button ${tab === "login" ? "button-green" : ""}`}
              style={{
                flex: 1,
                minHeight: "38px",
                padding: "0 12px",
                fontSize: "12px",
                ...(tab !== "login"
                  ? { background: "white", color: "#334155" }
                  : {}),
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setLoginError("");
                setRegisterSuccess("");
              }}
              className={`button ${tab === "register" ? "button-green" : ""}`}
              style={{
                flex: 1,
                minHeight: "38px",
                padding: "0 12px",
                fontSize: "12px",
                ...(tab !== "register"
                  ? { background: "white", color: "#334155" }
                  : {}),
              }}
            >
              Create Account
            </button>
          </div>

          <span className="eyebrow">
            {tab === "login"
              ? "WELCOME TO YOUR NEXT STEP"
              : accountType === "employer"
              ? "START YOUR EMPLOYER PARTNERSHIP"
              : "START YOUR CANDIDATE BRIDGE"}
          </span>
          <h2>
            {tab === "login"
              ? "Sign in to continue"
              : accountType === "employer"
              ? "Create employer account"
              : "Create your account"}
          </h2>
          <p className="login-intro">
            {tab === "login"
              ? "Access your candidate diagnostic, AI career roadmap, employer portal, or facilitator console."
              : accountType === "employer"
              ? "Register your organisation to post remote roles and review verified applicants."
              : "Register to save your profile, take the readiness diagnostic, and apply for remote work."}
          </p>

          {loginError && (
            <div className="mb-5 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
              {confirmationPath && (
                <div className="pt-1">
                  <Link
                    href={confirmationPath}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800 transition"
                  >
                    Confirm Email Address Now{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {registerSuccess && (
            <div className="mb-5 rounded-lg bg-[#eaf5f0] p-4 text-xs text-[#101a33] border border-[#c2e2d4] space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#08785f] mt-0.5" />
                <div>
                  <p className="font-bold">{registerSuccess}</p>
                  <p className="mt-1 text-[#2e4a3d]">
                    Once your email is confirmed, you will be signed in to your
                    workspace automatically.
                  </p>
                </div>
              </div>
              {confirmationPath && (
                <div>
                  <Link
                    href={confirmationPath}
                    className="button button-green"
                    style={{
                      minHeight: "36px",
                      padding: "0 14px",
                      fontSize: "11.5px",
                    }}
                  >
                    Verify Email &amp; Continue{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Unified Sign In */}
          {tab === "login" && (
            <div className="form-stack">
              {resetSuccessMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
                  ✓ {resetSuccessMsg}
                </div>
              )}

              {!showResetPassword ? (
                <form onSubmit={handleSignIn} className="form-stack">
                  <label className="field">
                    <span>Email address</span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>

                  <div className="field">
                    <div className="flex items-center justify-between">
                      <span>Password</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetPassword(true);
                          setLoginError("");
                          setResetSuccessMsg("");
                        }}
                        className="text-xs font-semibold text-[#08785f] hover:underline"
                      >
                        Forgot password? Reset here
                      </button>
                    </div>
                    <PasswordInput
                      value={loginPassword}
                      onChange={setLoginPassword}
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="button button-wide button-green disabled:opacity-50"
                  >
                    {isLoggingIn ? "Signing In..." : "Sign In"}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className="text-center text-xs text-[#667085] pt-2">
                    Don&apos;t have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setTab("register");
                        setLoginError("");
                      }}
                      className="text-button"
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              ) : (
                <form
                  onSubmit={handleResetPassword}
                  className="form-stack rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Reset Your Account Password
                    </h3>
                    <p className="text-xs text-slate-600">
                      Verify your registered email and full name to set a new password immediately.
                    </p>
                  </div>

                  <label className="field">
                    <span>Registered Email *</span>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="field">
                    <span>Registered Full Name *</span>
                    <input
                      type="text"
                      required
                      value={resetFullName}
                      onChange={(e) => setResetFullName(e.target.value)}
                      placeholder="e.g. Rutendo Mangezi"
                    />
                  </label>

                  <div className="field">
                    <span>New Password *</span>
                    <PasswordInput
                      value={resetNewPassword}
                      onChange={setResetNewPassword}
                      placeholder="Min 8 chars, upper, lower & number"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={resettingPassword}
                      className="button button-green flex-1 disabled:opacity-50"
                    >
                      {resettingPassword ? "Updating..." : "Update Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setLoginError("");
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Create Account (Candidate or Employer) */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="form-stack">
              {/* Role selector: Candidate vs Employer */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAccountType("candidate")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                    accountType === "candidate"
                      ? "bg-white text-[#08785f] shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  I am a Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("employer")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                    accountType === "employer"
                      ? "bg-white text-[#101a33] shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  I am an Employer
                </button>
              </div>

              {accountType === "employer" && (
                <label className="field">
                  <span>Company / Organization name *</span>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Savannah Tech Labs UK"
                  />
                </label>
              )}

              <label className="field">
                <span>
                  {accountType === "employer"
                    ? "Contact person full name *"
                    : "Full name *"}
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    accountType === "employer"
                      ? "e.g. Sarah Jenkins"
                      : "e.g. Farai Nyoni"
                  }
                />
              </label>

              <div className="field">
                <span>
                  {accountType === "employer"
                    ? "Work email address *"
                    : "Email address *"}
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  onBlur={() => setRegEmailTouched(true)}
                  placeholder={
                    accountType === "employer"
                      ? "sarah@company.com"
                      : "farai.nyoni@gmail.com"
                  }
                  aria-invalid={showRegEmailError || undefined}
                />
                {showRegEmailError && (
                  <p className="text-[11px] text-red-600 m-0">
                    {regEmailCheck.error}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <span>Password *</span>
                  <PasswordInput
                    required
                    value={regPassword}
                    onChange={setRegPassword}
                    placeholder="Create password"
                    autoComplete="new-password"
                  />
                </div>

                <div className="field">
                  <span>Confirm password *</span>
                  <PasswordInput
                    required
                    value={regConfirmPassword}
                    onChange={setRegConfirmPassword}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    invalid={confirmMismatch}
                  />
                  {confirmMismatch && (
                    <p className="text-[11px] text-red-600 m-0">
                      Passwords do not match.
                    </p>
                  )}
                </div>
              </div>

              {regPassword.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-600">Password strength</span>
                    <span className={STRENGTH_STYLES[pwStrength.label].text}>
                      {pwStrength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full ${
                          pwStrength.score >= i
                            ? STRENGTH_STYLES[pwStrength.label].bar
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {pwStrength.requirements.map((r) => (
                      <li
                        key={r.id}
                        className={`flex items-center gap-1.5 text-[11px] ${
                          r.met ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${
                            r.met ? "text-emerald-600" : "text-slate-300"
                          }`}
                        />
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {accountType === "candidate" ? (
                <>
                  <ZimbabweCitySelect
                    value={city}
                    onChange={setCity}
                    label="City / Town in Zimbabwe *"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="field">
                      <span>Highest qualification *</span>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                      >
                        <option value="Bachelors Degree">
                          Bachelors Degree
                        </option>
                        <option value="HND / Higher National Diploma">
                          Higher National Diploma
                        </option>
                        <option value="Masters Degree">Masters Degree</option>
                        <option value="National Diploma (ND) / TVET / Polytech">
                          National Diploma
                        </option>
                        <option value="A-Level / High School Leaver">
                          A-Level Certificate
                        </option>
                      </select>
                    </label>

                    <label className="field">
                      <span>Field of study</span>
                      <input
                        type="text"
                        value={fieldOfStudy}
                        onChange={(e) => setFieldOfStudy(e.target.value)}
                        placeholder="e.g. Computer Science"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="field">
                    <span>Company website</span>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://company.com"
                    />
                  </label>

                  <label className="field">
                    <span>Industry</span>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Technology & SaaS"
                    />
                  </label>

                  <label className="field sm:col-span-2">
                    <span>Preferred hiring model</span>
                    <select
                      value={hiringModel}
                      onChange={(e) => setHiringModel(e.target.value)}
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
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !pwStrength.isValid ||
                  confirmMismatch ||
                  !regConfirmPassword
                }
                className="button button-wide button-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Verifying email & creating account..."
                  : accountType === "employer"
                  ? "Create Employer Account & Start Partnership"
                  : "Create Account & Start Bridge"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-[#667085] pt-2">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-button"
                >
                  Sign in to your account
                </button>
              </p>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-[#667085]">
            Want to browse without logging in?{" "}
            <Link href="/" className="text-link">
              Explore public website &amp; overview
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f8f8] flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-[#202b3c] font-semibold text-sm">
            <Sparkles className="h-5 w-5 text-[#08785f] animate-spin" />
            Loading sign in portal...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
