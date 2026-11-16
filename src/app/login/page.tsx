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
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";
import ZimbabweCitySelect from "@/components/ZimbabweCitySelect";
import PasswordInput from "@/components/PasswordInput";
import { validateEmail, validatePassword } from "@/lib/validation";

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
        const role = data.user.role;
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (role === "admin" || role === "superuser") {
          router.push("/admin");
        } else if (role === "employer") {
          router.push("/employer");
        } else {
          router.push("/account");
        }
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                UTARE <span className="text-emerald-700">ZEM AI</span>
              </span>
              <p className="text-xs text-slate-500">
                Zimbabwe Economic Mobility & Remote Bridge
              </p>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            {tab === "login"
              ? "Sign In to Your Account"
              : accountType === "employer"
              ? "Create Employer Account"
              : "Create Candidate Account"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {tab === "login"
              ? "Sign in with your verified credentials to access your workspace or console."
              : accountType === "employer"
              ? "Enrol your organization to post remote roles and review applicants."
              : "Create your account to bridge credentials into verified remote work."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 mb-6 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setLoginError("");
              setRegisterSuccess("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
              tab === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="h-4 w-4 text-emerald-700" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setLoginError("");
              setRegisterSuccess("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
              tab === "register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="h-4 w-4 text-emerald-700" />
            Create Account
          </button>
        </div>

        {/* Card Body */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {loginError && (
            <div className="mb-6 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 space-y-2">
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
                    Confirm Email Address Now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {registerSuccess && (
            <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-xs text-emerald-900 border border-emerald-200 space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-700 mt-0.5" />
                <div>
                  <p className="font-bold">{registerSuccess}</p>
                  <p className="mt-1 text-emerald-800">
                    Once your email is confirmed, you will be signed in to your
                    workspace automatically.
                  </p>
                </div>
              </div>
              {confirmationPath && (
                <div>
                  <Link
                    href={confirmationPath}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                  >
                    Verify Email &amp; Continue <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Unified Sign In (Candidates, Employers, Admins) */}
          {tab === "login" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <PasswordInput
                  value={loginPassword}
                  onChange={setLoginPassword}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoggingIn ? "Signing In..." : "Sign In"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-slate-500 pt-2">
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("register");
                    setLoginError("");
                  }}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* TAB 2: Create Account (Candidate or Employer) */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role selector: Candidate vs Employer */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAccountType("candidate")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                    accountType === "candidate"
                      ? "bg-white text-emerald-800 shadow-xs"
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
                      ? "bg-white text-blue-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  I am an Employer
                </button>
              </div>

              {accountType === "employer" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Organization Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Savannah Tech Labs UK"
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {accountType === "employer"
                    ? "Contact Person Full Name *"
                    : "Full Name *"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {accountType === "employer"
                    ? "Work Email Address *"
                    : "Email Address *"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
                    className={`w-full rounded-lg border pl-10 pr-4 py-2 text-sm focus:outline-none ${
                      showRegEmailError
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-300 focus:border-emerald-600"
                    }`}
                  />
                </div>
                {showRegEmailError && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {regEmailCheck.error}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <PasswordInput
                    required
                    value={regPassword}
                    onChange={setRegPassword}
                    placeholder="Create password"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <PasswordInput
                    required
                    value={regConfirmPassword}
                    onChange={setRegConfirmPassword}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    invalid={confirmMismatch}
                  />
                  {confirmMismatch && (
                    <p className="mt-1 text-[11px] text-red-600">
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
                  <div className="space-y-4">
                    <ZimbabweCitySelect
                      value={city}
                      onChange={setCity}
                      label="City / Town in Zimbabwe *"
                      required
                    />

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Highest Qualification *
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <select
                          value={qualification}
                          onChange={(e) => setQualification(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none bg-white"
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
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Field of Study / Discipline
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={fieldOfStudy}
                        onChange={(e) => setFieldOfStudy(e.target.value)}
                        placeholder="e.g. Accounting, Computer Science, Marketing"
                        className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Technology & SaaS"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Hiring Model
                    </label>
                    <select
                      value={hiringModel}
                      onChange={(e) => setHiringModel(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
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
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !pwStrength.isValid ||
                    confirmMismatch ||
                    !regConfirmPassword
                  }
                  className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Verifying email & creating account..."
                    : accountType === "employer"
                    ? "Create Employer Account"
                    : "Create Candidate Account"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <p className="text-center text-xs text-slate-500 pt-2">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Sign in to your account
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Public Website Navigation Notice */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Want to browse without logging in?{" "}
          <Link
            href="/"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Explore public website &amp; overview
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
            <Sparkles className="h-5 w-5 text-emerald-700 animate-spin" />
            Loading sign in portal...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
