# CI/CD, Testing, Linting & Branch Protection Guide

This document explains how automated quality checks (ESLint, TypeScript, Vitest, and Next.js build) and GitHub Pull Request rules work in `utare-zisedu-mvp`.

---

## 1. Automated Quality Checks (Lint, Typecheck, Tests & Build)

Every Pull Request targeting `main` (or `master`) automatically triggers the GitHub Actions workflow in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), which runs four gates inside a Node 20 LTS environment:

1. **ESLint (`npm run lint` / `make lint`)**:
   - Configured in [`.eslintrc.json`](../.eslintrc.json) using `next/core-web-vitals`.
2. **TypeScript Strict Check (`npm run typecheck` / `make typecheck`)**:
   - Runs `tsc --noEmit` to catch type mismatches across candidate profiles, role guards, Supabase schemas, and Gemini AI payloads.
3. **Vitest Unit & Integration Suite (`npm run test:ci` / `make test`) — 15 Suites / 85 Tests**:
   - Configured in [`vitest.config.ts`](../vitest.config.ts).
   - [`src/__tests__/pathway-engine.test.ts`](../src/__tests__/pathway-engine.test.ts): Tests `computeAssessmentScores`, `matchNearestHub`, `matchBestCoach`, and `generateAICareerPathway` across diverse Zimbabwean personas (university graduates, TVET artisans, school leavers, and creatives).
   - [`src/__tests__/mock-data.test.ts`](../src/__tests__/mock-data.test.ts): Verifies empirical UTARE survey benchmarks, Innovation Hubs, Coaches, and Remote Job payment rail schemas.
   - [`src/__tests__/documents-and-humanizer.test.ts`](../src/__tests__/documents-and-humanizer.test.ts): Tests grounded ATS CV & cover letter generation, anti-AI-slop humanization, and `.docx` binary export.
   - [`src/__tests__/end-to-end-flow.test.ts`](../src/__tests__/end-to-end-flow.test.ts): Tests full candidate lifecycle persistence, milestone toggling, coach confirmation, hub booking, and job application submission.
   - [`src/__tests__/admin-and-account.test.ts`](../src/__tests__/admin-and-account.test.ts): Tests PBKDF2 password hashing, HMAC session tokens, role promotion, employer verification auto-approval, versioned credentials/CV artifacts, and audit logs.
   - [`src/__tests__/auth-verification.test.ts`](../src/__tests__/auth-verification.test.ts): Tests Supabase implicit/OTP/PKCE and custom token email verification flows.
   - [`src/__tests__/google-oauth.test.ts`](../src/__tests__/google-oauth.test.ts): Tests Google OAuth initiation, consent/employer gates, candidate & employer provisioning, existing account protection, superuser preservation, tampered cookie rejection, and `/login` UI wiring.
   - [`src/__tests__/area-security.test.ts`](../src/__tests__/area-security.test.ts): Verifies RBAC enforcement, PII stripping in employer applicant views, and cross-tenant isolation across API routes.
   - [`src/__tests__/area-flows.test.ts`](../src/__tests__/area-flows.test.ts): End-to-end route tests across candidate onboarding/application/deletion, scam reporting/moderation, and employer portal flows.
   - [`src/__tests__/area-compliance.test.ts`](../src/__tests__/area-compliance.test.ts): Verifies Zimbabwe Cyber & Data Protection Act [Chapter 12:07], SI 155/2024, consent gates, 365-day + 3-email retention, and Kutunga Safety by Design controls.
   - [`src/__tests__/safety-by-design.test.ts`](../src/__tests__/safety-by-design.test.ts): Tests scam job reporting, Superuser moderation, inactivity warning notices, and full user erasure.
   - [`src/__tests__/db-migration-and-auth-fixes.test.ts`](../src/__tests__/db-migration-and-auth-fixes.test.ts): Verifies `safeSupabaseUpsert` schema-drift fallback (`PGRST204`/`42703`/`42P10`), 14-table non-destructive additive DDL checks, `/api/employers` Supabase confirmation + rate-limit fallback, and Spam folder guidance.
   - [`src/__tests__/faq.test.ts`](../src/__tests__/faq.test.ts): Verifies FAQ categories, keyword search filtering, and journey quick-answers mapping.
   - [`src/__tests__/candidate-quick-info.test.ts`](../src/__tests__/candidate-quick-info.test.ts): Verifies Admin Candidate Quick-Info helper summaries and formatting.
   - [`src/__tests__/navigation-and-session.test.ts`](../src/__tests__/navigation-and-session.test.ts): Verifies two-way breadcrumb back/next fallback navigation and session routing helpers.
4. **Next.js Production Build (`npm run build`)**:
   - Verifies that all pages, middleware, and API routes compile cleanly for production.

### Running Checks Locally
Before opening a Pull Request, any team member can run the entire CI suite locally:
```bash
npm run lint && npm run typecheck && npm run test:ci && npm run build
```
*(Or inside the Docker container with `make ci` / `make ci-local`.)*

---

## 2. Branch Protection & Superuser Governance (`main`)

Our repository enforces the following governance model on `main` (configured via [`scripts/push-and-protect-main.sh`](../scripts/push-and-protect-main.sh)):

| Rule | Team Collaborators (Faith, Amanda, Munashe, Kudakwashe, etc.) | Superuser / Repo Owner (`@mangezi64`) |
| :--- | :--- | :--- |
| **Direct Push to `main`** | Blocked (Must open a Pull Request) | **Allowed** (`enforce_admins: false`) |
| **Required CI Checks** | Must pass `Quality Checks (Lint, Typecheck, Tests & Build)` | Can merge immediately or wait for CI |
| **Pull Request Review** | Requires 1 approval from `@mangezi64` (`CODEOWNERS`) | Can self-merge any PR at any time |
| **Force Push / Delete `main`** | Blocked | Blocked for safety |
