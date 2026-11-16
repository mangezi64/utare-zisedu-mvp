# UTARE ZEM AI — Release Notes (Live Database Sync, Versioned Credentials Vault, CV Photos & Employer AI Ranking)

**Release Date:** November 16, 2026  
**Target Environments:** Vercel Production (`utare-zisedu-mvp.vercel.app`), Supabase Cloud PostgreSQL, and Containerized Local PostgreSQL (`utare-zisedu-db`)

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
