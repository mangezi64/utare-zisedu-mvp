# UTARE ZEM AI — Release Notes

**Release Date:** November 16, 2026 (Night Release — Zimbabwe Map Radar, Video Walkthrough, Voice Humanization & Zero-Overflow Packaging)  
**Target Environments:** Vercel Production (`utare-zisedu-mvp.vercel.app`), Supabase Cloud PostgreSQL, and Containerized Local PostgreSQL (`utare-zisedu-db`)

---

## 8. Zimbabwe Map Radar, Interactive Flow Video Walkthrough & Polished Page Packaging
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
