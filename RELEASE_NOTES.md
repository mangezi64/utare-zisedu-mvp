# UTARE ZEM AI — Release Notes

**Latest Release (`v2.5.0`):** November 20, 2026 (Role-Curated Portals, Organization RBAC for Employers & Hubs, One-Time Invite & Reset Links)  
**Target Environments:** Vercel Production (`utare-zisedu-mvp.vercel.app`), Supabase Cloud PostgreSQL (`stzsuwwmeiqdhsoghmrj`), and Containerized Local PostgreSQL (`utare-zisedu-db`)

---

## 11. Release v2.5.0 — Role-Curated Portals, Organization RBAC & One-Time Invite / Reset Links (November 20, 2026)
* **Role-Curated Experience Across All Pages (`src/app/employers/page.tsx`, `src/components/Navbar.tsx`, `src/components/RoleOverviewBanner.tsx`, `/opportunities`, `/hubs`, `/account`, `/pathway`, `/jobs`, `/assessment`):**
  - `/employers` now adapts to the signed-in role: **Employers** redirect directly to `/employer` (never seeing competitor employers or public sales pitches); **Candidates** browse a **Verified Employers Directory** (`GET /api/employers?directory=1`) with an interactive slide-over drawer showing each verified company's active roles; **Admins** see **Employer Operations & Directory** with status filters, **+ Invite Employer**, **Send / Copy Reset Link**, and verify/reject controls; **Public visitors** retain the partner pitch and self-serve registration form.
  - Added `<RoleOverviewBanner />` on `/` and role-curated banners/actions on `/opportunities` and `/hubs` (restricting *"Enlist New Partner Hub"* to `admin` / `superuser` only), and redirected `employer` / `hub` accounts away from candidate-only workspaces (`/account`, `/pathway`, `/jobs`, `/assessment`).
* **Organization-Scoped RBAC (`org_admin` vs. `org_member`) for Employers & Hub Owners (`/employer`, `/hub-portal`, `/api/employer/team`, `/api/hub/portal`, `/api/hub/team`):**
  - Propagated `orgRole`, `employerId`, and `hubId` through `SessionPayload` (`src/lib/auth-session.ts`), `getSessionFromRequest` (`src/lib/auth-guard.ts`), `/api/auth/session`, `useViewMode()`, `resolvePostLoginDestination()`, and `src/middleware.ts` (protecting `/hub-portal`).
  - **Employer Teams (`/employer` & `/api/employer/team`):** `org_admin` users manage company profile settings, make final `hired`/`rejected` decisions, and self-serve add (invite) or remove their own employees (`org_member` / `org_admin`) with last-admin and self-removal protection. `org_member` users can post jobs, mark listings closed/filled, and shortlist applicants.
  - **Hub Owner Portals (`/hub-portal` & `/api/hub/portal`, `/api/hub/team`):** Added `"hub"` platform role (`HUB_NAV_ITEMS`). `org_member` staff can update daily `availableWorkstations` and `laptopLoanAvailable`; `org_admin` owners can also edit hub specs/pricing/hours and manage hub staff.
* **Admin One-Time Invite & Password Reset Links + Supabase `app_metadata` Sync (`/api/admin/employers/invite`, `/api/admin/employers/reset-link`, `/api/admin/users`, `/auth/callback`, `/api/auth/password`):**
  - Added additive `auth_users` columns (`reset_token`, `reset_token_expires_at`, `invited_by`, `invited_at`, `hub_id`) and `innovation_hubs` columns (`owner_email`, `org_name`, `updated_at`) across `supabase/schema.sql`, `supabase/additive-schema.sql`, and `src/lib/db-schema.ts`.
  - Admins can issue single-use, time-limited invite (24h) and password reset (1h) links (via Supabase when configured + copyable fallback URL) consumed via `POST /api/auth/password` (`mode: "set-password"`) on `/auth/callback`.
  - Updated `PATCH /api/admin/users` to sync `{ role, org_role, employer_id, hub_id }` into Supabase `app_metadata` (resolving non-UUID local IDs by email).
  - Added [`src/__tests__/org-rbac-and-invites.test.ts`](src/__tests__/org-rbac-and-invites.test.ts) covering one-time invite/reset tokens, employer & hub `org_admin`/`org_member` boundaries, and verified directory scoping.

---

## 10. Release v2.4.0 — Google Sign-In (Supabase OAuth) & Shared Zimbabwe Radar Visual (November 20, 2026)
* **Sign in with Google (`src/app/login/page.tsx`, `src/app/api/auth/oauth/google/route.ts`, `src/app/api/auth/verify-email/route.ts`, `src/app/auth/callback/page.tsx`, `src/lib/auth-session.ts`):**
  - Added server-side Google OAuth initiation (`GET /api/auth/oauth/google`) paired with a short-lived HMAC-signed HTTP-only `utare_oauth_intent` cookie to preserve signup role (`candidate` / `employer`), optional profile/company fields, Zimbabwe Data Policy consent acceptance, and safe post-login redirect paths without altering the Supabase `/auth/callback` redirect allowlist.
  - Updated `POST /api/auth/verify-email` to provision missing `auth_users` (`passwordHash: "supabase_managed"`, `emailConfirmed: true`) and `candidate_profiles` or `employer_registrations` records in local store and Supabase PostgreSQL on first-time Google Sign-In while preserving existing users' password hashes, roles, and bootstrap superuser elevations (`resolveBootstrapRole`).
  - Added **Continue with Google** buttons across both the Sign In and Create Account tabs on `/login` (with Data Policy consent and employer company name gates), improved `/auth/callback` redirect handling and provider setup error messages, and added clear password-login hints in `/api/auth/login` for Google-only accounts.
  - Added 9 integration tests in [`src/__tests__/google-oauth.test.ts`](src/__tests__/google-oauth.test.ts) covering OAuth initiation, consent/employer gates, candidate & employer provisioning, existing account protection, superuser preservation, tampered cookie rejection, and login UI wiring.
* **Unified Zimbabwe Radar Visual (`src/components/ZimbabweRadarVisual.tsx`, `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/globals.css`):**
  - Extracted the Zimbabwe ("ZW") radial global reach illustration into a shared `<ZimbabweRadarVisual />` component rendered consistently across both the landing hero and the `/login` split-screen visual.
* **Documentation & Login FAQ Alignment (`README.md`, `docs/*`, `.env.example`, `src/lib/faq-data.ts`):**
  - Synchronized `README.md`, `docs/ARCHITECTURE_AND_TEAM_GUIDE.md` (updated to 25 REST API endpoints & 15 Vitest suites / 85 tests), `docs/CI_TESTING_AND_BRANCH_PROTECTION.md`, `docs/TEAM_REVIEW_GUIDE.md`, `docs/SAFETY_BY_DESIGN_BOOKLET_DRAFT.md`, `docs/PITCH_DAY_READINESS_AND_DEFENSE_BRIEF.md`, `docs/TEST_ACCOUNTS.md`, `.env.example`, and the in-app `/faq` + `/login` quick-answers strip with the `v2.4.0` Google OAuth & shared radar visual changes.

---

## 9. Release v2.3.0 — Email Verification Guidance, Employer Auth Parity & Automated Release Schema Sync (November 20, 2026)
* **Dedicated Post-Signup Email Validation Screen & Spam Folder Guidance (`/login`, `/employers`, `/auth/callback`, `/api/auth/*`):**
  - After registering on `/login?tab=register`, unconfirmed users now transition to a focused **Check your email to validate your account** view displaying their registered email address, a one-click **Resend Verification Email** action, and a prominent amber reminder to check **Spam, Junk, or Promotions** folders for messages from **UTARE ZEM AI** (`utarezemai@gmail.com`) and mark them as *"Not spam"*.
  - Added matching Spam/Junk/Promotions folder guidance across the Sign-In `EMAIL_NOT_CONFIRMED` notice banner, `/auth/callback` resend helper, `/employers` registration confirmation card, and backend auth responses (`/api/auth/login`, `/api/auth/signup`, `/api/auth/resend-confirmation`).
* **Employer Self-Registration Confirmation Parity (`POST /api/employers` & `/employers`):**
  - Employer registrations with a password from `/employers` now register through `supabase.auth.signUp()` with dynamic `/auth/callback` redirect URLs, Admin API rate-limit fallback (`email_confirm: true`), `confirmation_token` persistence, and an inline resend/spam-folder UI matching `/login`.
* **Automatic Release-Time & Runtime Database Schema Migrations (`scripts/migrate-db.mjs`, `supabase/additive-schema.sql`, `src/lib/db.ts`):**
  - Added a single DDL-only non-destructive schema source of truth ([`supabase/additive-schema.sql`](supabase/additive-schema.sql) and [`src/lib/db-schema.ts`](src/lib/db-schema.ts)) covering all **14 tables**, additive columns, safe unique index checks on `employer_registrations(email)`, and `NOTIFY pgrst, 'reload schema';`.
  - Wired `node scripts/migrate-db.mjs` directly into `npm run build` (and exposed `npm run db:migrate`, `npm run db:migrate:strict`, and `make db-migrate`) so every release automatically syncs schema changes before building when `SUPABASE_DB_URL` / `POSTGRES_URL` (or `SUPABASE_ACCESS_TOKEN`) is configured.
  - Upgraded `src/lib/db.ts` with cloud-first Postgres URL resolution, automatic remote SSL (`{ rejectUnauthorized: false }`), and a 60-second retry cooldown if startup DB connection is transiently unavailable.
* **Schema-Drift-Resilient Supabase Persistence (`src/lib/supabase/safe-write.ts`):**
  - Added `safeSupabaseUpsert` and `safeSupabaseUpdate` across `src/lib/store.ts`, `/api/auth/signup`, `/api/auth/password`, `/api/pathway`, and `/api/employers` so live writes automatically strip pending migration columns (`PGRST204` / `42703`) or fall back cleanly on `42P10` constraint mismatches instead of failing silently, and wired `job_applications` + `employer_registrations` two-way sync to Supabase.
* **Platform Safety, Privacy, FAQ & TalkBack Milestones (Nov 18–20, 2026):**
  - **Kutunga Safety by Design & Zimbabwe Data Policy (`/data-policy`, `/api/jobs/report`, `/api/auth/account`):** Unticked signup & employer-sharing consent gates, immediate job scam reporting & Superuser moderation, 1-year inactivity + 3-notice retention enforcement, and typed-`delete` account erasure.
  - **Searchable FAQ Help Center (`/faq`) & Journey Quick-Answers (`src/lib/faq-data.ts`):** 7-category searchable knowledge base plus contextual FAQ strips at the bottom of core pages.
  - **Android TalkBack Accessibility (`/opportunities`):** Upfront *"Currently Available on UTARE"* industry counts, `aria-live="polite"` result announcements, and accessible modal focus management validated with totally blind tester **Nyasha Gande**.

---

## 8. Zimbabwe Map Radar, Interactive Flow Video Walkthrough & Polished Page Packaging (November 16, 2026)
* **Authentic Zimbabwe Map Vector Graphic (`<ZimbabweMapGraphic />`):**
  - Designed an SVG map of Zimbabwe's 10 provinces (Mashonaland, Matabeleland, Midlands, Masvingo, Manicaland, Bulawayo, and Harare) with emerald gradient styling and glow filters.
  - Replaced the generic green rotated square inside the two concentric radar circles with the actual Zimbabwe map, centered with pulsing radar beacons for Harare, Bulawayo, and Mutare innovation hubs and a frosted "ZW ZIMBABWE" indicator badge.
* **Interactive Flow & Video Walkthrough (`<FlowVideoWalkthrough />` & `<WatchDemoButton />`):**
  - Integrated an interactive 5-step visual platform walkthrough demonstrating the end-to-end journey: Diagnostic Intake -> AI Pathway -> Tailored CV Studio -> Partner Innovation Hubs -> Remote Job Matching.
  - Includes auto-advancing slide timer, play/pause, scrubbing, playback speed (1x, 1.25x, 1.5x), Closed Captions (CC) for deaf/hard-of-hearing users, and external video embed fallback for live pitch recordings.
  - Accessible from hero primary actions ("Watch 2-Min Flow Demo"), top navigation drawer, and floating Accessibility suite.
* **Humanized Natural AI Voice & Friendly Narration (`<AudioExplainer />`):**
  - Completely rewrote all 4 explainer chapters in an empathetic, warm, conversational Zimbabwean tone.
  - Calibrated speech synthesis parameters (`rate: 0.94`, `pitch: 1.02`) and neural voice detection priority (South African / British / Commonwealth natural voices) to eliminate robotic timbre.
  - Removed Coach Catherine's name from candidate-facing copy, appropriately reserving her advisory role for founding team coaching.
* **Zero Horizontal Scroll & Cohesive Viewport Packaging:**
  - Completely eliminated the horizontal slide/scrollbar ("slite at bottom left to right") by enforcing `overflow-x: hidden; max-width: 100%;` and `box-sizing: border-box;` on `html`, `body`, and `main`.
  - Introduced responsive navbar adaptation: hides icons and compacts link padding on intermediate screens (1041px - 1220px) and seamlessly transitions to the mobile hamburger drawer at ≤1040px, ensuring the "Create Account" button is never pushed off-screen.
  - Streamlined hero card and top evidence section paddings so the landing page fits harmoniously above the fold across all standard laptop displays (1280x800, 1366x768, 1440x900) without awkward text truncation or overlapping floating widgets.

---

## 7. Smart Two-Way Navigation, Admin Quick-Info Feature & Assistive AI Inclusivity (Challenge Release)
* **Smart Two-Way Breadcrumb Navigation (`<PageBreadcrumb />`):**
  - Integrated persistent, frosted-glass sub-navigation headers across all views (`/jobs`, `/assessment`, `/pathway`, `/opportunities`, `/hubs`, `/skills`, `/account`, `/employer`).
  - Implemented smart `← Back` navigation with automatic `router.back()` and robust contextual fallbacks (`/account` for Candidates, `/admin` for Facilitators, `/employer` for Employers) so users never get stuck even when landing via direct links.
  - Added directional journey shortcuts (`Next: View Career Pathway →`, `Next: Tailor CV & Job Match →`, `Next: Explore Opportunities →`, `Next: Find Nearest Partner Hub →`).
  - Added mobile-optimized sticky touch target for small screens (<640px).
* **Instant Session Hydration & Mobile Drawer Polish (`src/lib/view-mode-context.tsx` & `src/components/Navbar.tsx`):**
  - Cached session summaries locally to eradicate navbar unauthenticated flicker on page reloads and route changes.
  - Revamped mobile menu drawer with user avatar badge, role label, 1-click workspace jump button, and dedicated `Sign Out` button.
* **Admin Candidate Quick-Info Modal (`<CandidateQuickInfoModal />`):**
  - Facilitators can click candidate cards or the `👁️ View Info` button in `/admin` to inspect candidate profiles, education, hardware readiness (power reliability, device, connectivity, estimated weekly capacity), and verified credentials without launching the full career pathway drawer.
  - Provides 1-click preview and download for all attached degrees, certificates, and generated CVs.
* **Inclusivity & Assistive Tech (Cross Sector Innovation Challenge Differentiator):**
  - **`src/components/AudioExplainer.tsx`:** Zero-bandwidth Web Speech API voice walkthrough introducing Utare ZEM AI, the diagnostic, tailored CV studio, and solar partner hubs across 4 chapters with speed controls, voice selection, oscillating audio waves, and synchronized transcript.
  - **`src/components/AccessibilityControls.tsx`:** Floating accessibility suite providing WCAG AAA High Contrast mode, calibrated Colorblind filters (Deuteranopia, Protanopia, Tritanopia), font scaling, dyslexia-friendly spacing, and screen-reader page outline announcer.
* **Aesthetic Brand Differentiation:**
  - Shifted brand palette away from ALX Africa's dark forest green/cyan toward a proud Zimbabwean Sunrise Gold (`#d97706` / `#b45309`) and Deep Granite Slate (`#0f172a`), accented with emerald and terracotta.
* **Week 6 Pitch Package & Aligned Team Defense:**
  - Authored `docs/PITCH_DECK_WEEK6.md` (10-slide, 4-minute master presentation deck and timed speaker script).
  - Authored `docs/TEAM_FAQ_UNIFORM.md` (Standardized Q&A defense cheat sheet for judges).
  - Authored `docs/COACH_CATHERINE_ACTION_ITEMS.md` (Review countdown & team matrix).

---

## 1. Live Database Synchronization & Automatic Schema Auto-Migration
- **Service-Role Server Hydration (`getSupabaseServer()`):**
  - All backend API routes (`/api/admin/candidates`, `/api/admin/users`, `/api/employers`, `/api/pathway`, `/api/auth/profile`, `/api/auth/session`, `/api/auth/login`, `/api/auth/signup`, `/api/jobs`, `/api/hubs`) now connect through the server-side Supabase Service-Role client so Row Level Security (RLS) never hides live candidate, employer, or application records on serverless cold starts.
  - Added a 1-click **"Refresh Live Data"** button in the Admin Console (`/admin`) header.
- **Automatic Additive Schema Migration on Release (`ensureDatabaseSchema()`):**
  - [`src/lib/db.ts`](src/lib/db.ts) now automatically executes non-destructive, idempotent `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations (`candidate_documents`, `candidate_cv_artifacts`, `audit_logs`, profile photo columns, employer link/document columns, and status history columns) whenever a release boots up.
  - All writes in [`src/lib/store.ts`](src/lib/store.ts) synchronize two-way with both PostgreSQL and Supabase Cloud.

---

## 2. Password Management & Account Recovery (`POST /api/auth/password`)
- **Self-Service Password Update (`/account`):**
  - Candidates and users can update their password directly from the **Security & Password Update** card in their workspace. Changes sync across Supabase Auth, `public.auth_users`, and the local store.
- **Self-Service Forgot / Reset Password (`/login`):**
  - Users who forgot their password can click **"Forgot password? Reset here"** on the Sign In screen, verify their registered email and full name, and set a new password immediately.
- **1-Click Admin Password Override (`/admin`):**
  - Facilitators and Superusers can reset and verify any user's password directly from the **Team & User Roles** tab in the Admin Console.
- **Signup Rate-Limit Resilience (`/api/auth/signup`):**
  - If Supabase's built-in mailer hits its free-tier email rate limit, the server automatically falls back to provisioning and confirming the account via the Supabase Admin API so candidate signups are never blocked.

---

## 3. Profile Pictures & Optional CV Portrait Integration
- **Profile Picture Upload (`/account`):**
  - Candidates can click the camera badge on their workspace avatar to upload a profile photo (automatically resized and compressed client-side for low-bandwidth mobile data bundles).
- **Optional Photo on Tailored CVs (`includePhotoOnCv`):**
  - Candidates can toggle **"Include my profile photo on generated CVs (.docx & PDF)"**.
  - When enabled, the portrait renders in the **CV Studio live preview**, prints cleanly in **Save-as-PDF**, and embeds directly into the Word **`.docx`** header via `ImageRun`.

---

## 4. Versioned Degrees, Certificates & Supporting Documents Vault (`/api/auth/attachments`)
- **Candidate Credential Vault (`/account`):**
  - Candidates can upload academic degrees, professional certificates, transcripts, existing CVs, and portfolios (`PDF`, `PNG`, `JPG`, `DOC`, `DOCX`).
  - **Automatic Versioning:** Re-uploading a credential with the same category and title automatically increments its version (`v1` → `v2` → `v3`), marks the newest upload as `Latest`, and preserves historical versions.
- **Versioned Tailored CV & Application Letter History:**
  - Every tailored CV and Cover Letter generated in the studio is saved in `public.candidate_cv_artifacts` with automatic version numbering (`v1`, `v2`, ...) and 1-click **Download CV (.docx)** and **Download Letter (.docx)** buttons on `/account` and `/jobs`.

---

## 5. Employer Company Links, Shared Role Documents & AI Candidate Fit Ranking
- **Company Website & Role Reference Links (`/employer` & `/jobs`):**
  - Employers can attach their **Company Website URL**, **External Role / Careers Page Reference URL**, and **Shared Role Documents** when posting a role so candidates can research the company while still applying through the UTARE platform (preserving platform tracking and monetization).
- **AI Candidate Fit & Ranking Engine (`/employer`):**
  - Applicants in the Employer Portal are automatically scored (`0–100% AI Fit`), tiered (`Top Match (Recommended)`, `Strong Contender`, `Developing Fit`), and ranked highest-first.
  - Each applicant dossier includes an **AI Hiring Recommendation Summary**, **Matched Skills**, **Verified Credentials Summary** (with 1-click download links for attached degrees and certificates), **Tailored CV & Cover Letter tabs**, and **Suggested Interview Questions**.

---

## 6. Platform Audit & Activity Trail (`public.audit_logs`)
- **Full Traceability (Who Changed What & When):**
  - Status changes on applications (`submitted` → `under_review` → `shortlisted` → `hired`), role promotions, password resets, job postings, CV generations, and credential uploads record `updated_at`, `updated_by`, `status_history`, and an immutable entry in `public.audit_logs`.
  - Facilitators can inspect the live **Platform Audit & Activity Log** in `/admin` under **Team & User Roles** to resolve any candidate or employer support query.
