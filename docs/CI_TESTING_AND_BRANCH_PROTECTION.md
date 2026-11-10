# CI/CD, Testing, Linting & Branch Protection Guide

This document explains how automated quality checks (ESLint, TypeScript, Vitest) and GitHub Pull Request rules work in `utare-zisedu-mvp`.

---

## 1. Automated Quality Checks (Lint, Typecheck, Tests & Build)

Every Pull Request targeting `main` (or `master`) automatically triggers the GitHub Actions workflow in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), which runs four gates inside a Node 20 LTS environment:

1. **ESLint (`npm run lint` / `make lint`)**:
   - Configured in [`.eslintrc.json`](../.eslintrc.json) using `next/core-web-vitals` and `next/typescript`.
2. **TypeScript Strict Check (`npm run typecheck` / `make typecheck`)**:
   - Runs `tsc --noEmit` to catch type mismatches across candidate profiles, Supabase schemas, and Gemini AI payloads.
3. **Vitest Unit & Integration Suite (`npm run test:ci` / `make test`)**:
   - Configured in [`vitest.config.ts`](../vitest.config.ts).
   - [`src/__tests__/pathway-engine.test.ts`](../src/__tests__/pathway-engine.test.ts): Tests `computeAssessmentScores`, `matchNearestHub`, `matchBestCoach`, and `generateAICareerPathway`.
   - [`src/__tests__/mock-data.test.ts`](../src/__tests__/mock-data.test.ts): Verifies empirical UTARE survey benchmarks, Innovation Hubs, Coaches, and Remote Job payment rail schemas.
4. **Next.js Production Build (`npm run build`)**:
   - Verifies that all pages and API routes compile cleanly for production.

### Running Checks Locally in Docker
Before opening a Pull Request, any team member can run the entire CI suite inside the Docker container with a single command:
```bash
make ci
```
Or run individual checks:
```bash
make lint
make typecheck
make test
```

---

## 2. Branch Protection & Superuser Governance (`main`)

Our repository enforces the following governance model on `main` (configured via [`scripts/push-and-protect-main.sh`](../scripts/push-and-protect-main.sh)):

| Rule | Team Collaborators (Munashe, Amanda, Kudakwashe, etc.) | Superuser / Repo Owner (`@mangezi64`) |
| :--- | :--- | :--- |
| **Direct Push to `main`** | Blocked (Must open a Pull Request) | **Allowed** (`enforce_admins: false`) |
| **Required CI Checks** | Must pass `Quality Checks (Lint, Typecheck, Tests & Build)` | Can merge immediately or wait for CI |
| **Pull Request Review** | Requires 1 approval from `@mangezi64` (`CODEOWNERS`) | Can self-merge any PR at any time |
| **Force Push / Delete `main`** | Blocked | Blocked for safety |
