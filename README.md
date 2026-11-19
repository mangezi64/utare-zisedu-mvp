# UTARE ZEM AI — Economic Mobility & Remote Bridge Platform

> **Converting dormant Zimbabwean tertiary & vocational talent into productive earners by bridging last-mile hardware, competency verification, AI upskilling paired with human coaching, and direct remote market access.**

---

## 1. Executive Summary & Problem Context

In Zimbabwe, high academic qualification no longer translates automatically into economic mobility. Grounded in the **UTARE User Journey & Economic Mobility Survey**:
- **82.6%** of respondents hold university degrees (**91.3%** hold tertiary qualifications).
- **43.5%** remain unemployed and **56.5%** earn $\le \$300$/month (with **30.4%** earning zero income).
- Among those working, **84.6%** are trapped in completely misaligned survival gigs (**38.5%**) or partially aligned roles (**46.2%**), leaving only **15.4%** working in their trained discipline.

### The Triple Bottleneck Solved by UTARE ZEM AI
1. **Opaque Local Hiring:** **47.8%** cite non-responsive employers, nepotism, and rigid 1–3 year experience requirements.
2. **Infrastructure Deficits:** **73.9%** lack reliable broadband and **100%** of surveyed self-employed small business owners operate without a dedicated laptop/PC.
3. **Global Payment & Ecosystem Isolation:** **86.4%** of remote job seekers are locked out of international payment rails, and **72.7%** are cut off from incubators, mentorship networks, or workspace hubs.

---

## 2. Two Seamless Ways to Run & Demo the Platform

### Option A: Full Next.js Platform with Containerized PostgreSQL Database (Recommended)

Runs identically across macOS, Windows (WSL2), and Linux using Docker Compose with zero host environment pollution:
- **`web`**: Next.js 14 frontend featuring **Faith Wenzira & Amanda's unified design system** (`Manrope` & `Inter` typography, deep navy `#101a33` & emerald `#0faf83` palette, animated `ZW` global-reach radar map, and orbital login graphic), dynamic routes, and REST API server (Port `3000`).
- **`db`**: Containerized PostgreSQL 16 Alpine database with pre-seeded Zimbabwe hubs, coaches, courses, and empirical cohort data (Port `5432`).

#### Step 1: Clone the Repository
```bash
git clone https://github.com/mangezi64/utare-zisedu-mvp.git
cd utare-zisedu-mvp
```

#### Step 2: Configure Your Local Environment
```bash
cp .env.example .env.local
```
To enable live **Google Gemini 2.5** in the background and configure session signing or bootstrap admin accounts, edit `.env.local`:
```bash
GEMINI_API_KEY="AIzaSyYourActualKeyHere"
GEMINI_MODEL="gemini-2.5-flash"
DATABASE_URL="postgresql://utare_user:utare_password@db:5432/utare_db"
AUTH_SESSION_SECRET="replace-with-a-random-32-byte-secret"
SUPERUSER_EMAILS="your-email@domain.com"
ADMIN_EMAILS="facilitator@domain.com"
```
*(Note: The platform includes a built-in **Zimbabwe Survey Seed & Deterministic Fallback Engine**, so it runs 100% out-of-the-box even before you paste live `GEMINI_API_KEY` or `SUPABASE` credentials!)*

#### Step 3: Start the Containers & Enable Pre-Push CI Hooks
```bash
docker compose up -d --build
make install-hooks
```
- Open **[http://localhost:3000](http://localhost:3000)** in your browser for the full Next.js platform.
- Open **[http://localhost:3000/demo/index.html](http://localhost:3000/demo/index.html)** for the preserved standalone hash-routed walkthrough.

---

### Option B: Standalone Frontend Walkthrough Demonstration

Open `index.html` in any modern browser without needing a build step or package installation. The walkthrough uses responsive client-side hash routing:

- `#/` — Login & Registration demonstration
- `#/overview` — Homepage & Problem Context
- `#/dashboard` — Candidate main dashboard
- `#/about` — About Us, Our Story & 6-Person Team
- `#/how-it-works` — 4-Stage Candidate Journey
- `#/opportunities` — 4-Way filterable remote opportunities
- `#/skills` — Modular skills development pathways
- `#/employers` — For Employers (submits to live `/api/employers` & PostgreSQL when server is active)
- `#/contact` — Contact & Hub Inquiries (submits to live `/api/contact` & PostgreSQL when server is active)

---

## 3. Core Platform Capabilities & Role-Based Portals

### A. Public & Candidate Experience (`candidate` role)
- **Executive Overview (`/`):** Unified hero banner with the animated Zimbabwe (`ZW`) global-reach radar graphic, empirical survey benchmarks, 4-stage `"01–04"` mobility cards, and challenge checklist.
- **About Us (`/about`):** *"Six young people, one shared challenge"* story (Mastercard Foundation Scholars & USAP alumnus context), Mission/Vision/Proposal band, `01–04` challenge cards, and the 6-person team showcase.
- **How It Works (`/how-it-works`):** 4-stage mobility walkthrough linking directly into each live platform module.
- **Frequently Asked Questions (`/faq`):** Searchable, category-filtered help center covering login, email verification, password rules, AI readiness tiers & appeals, grounded CV Studio, solar hubs, anti-scam reporting, employer portals, accessibility tools, and Zimbabwe Data Policy compliance.
- **Smart Intake & 6-Factor Diagnostic (`/assessment`):** Evaluates English proficiency, digital literacy, internet access, device ownership, electricity availability, and work experience. Classifies into 3 readiness tiers (`Market-Ready`, `Bridge-Ready`, `Foundation Track`).
- **Interactive 90-Day AI Career Pathway (`/pathway`):** Powered by Google Gemini 2.5 with 1-on-1 Zimbabwean mentor booking and milestone completion tracking.
- **Opportunities Explorer (`/opportunities`):** Pre-screened remote, hybrid, and local roles with 4-way filtering (`Category`, `Industry`, `Experience level`, `Work arrangement`), role detail modals, and 1-click links to the CV Studio.
- **Skills Development (`/skills`):** Subsidized modular courses across Digital Literacy, Remote Work Readiness, Communication, Productivity, Technical Skills, and Entrepreneurship with interactive lesson progress modals.
- **Partner Innovation Hubs (`/hubs`):** Directory of solar-powered, Starlink-connected hubs across Harare, Bulawayo, Mutare, Gweru, and Masvingo with workstation reservation.
- **Candidate Workspace (`/account`):** Personal dashboard, hardware/credential profile editor, matched hub pass, 90-day milestones, and job application status tracker.
- **Grounded ATS CV & Application Letter Studio (`/jobs`):**
  - Generates structured, ATS-friendly CVs and formal Zimbabwean business application letters grounded strictly in candidate facts (zero fabricated employers or dates).
  - **Anti-AI-Slop Humanizer (`src/lib/documents/humanizer.ts`):** Strips 45+ AI clichés and scores every document from `0–100` for natural human tone.
  - **One-Click Downloads:** Export ready-to-send **Word (`.docx`)** files, **A4 Print/PDF**, or plain text.

### B. Scoped Employer Portal (`/employer` — `employer` role)
- **Self-Registration & One-Time Admin Verification (`/login?tab=register&role=employer` & `/employers`):** Employers register with email confirmation. Once an admin verifies the company once, all current and future job postings from that employer auto-publish.
- **Job Pipeline Management (`/employer`):** Post new remote/hybrid roles, archive filled roles, or delete listings.
- **Scoped Applicant Review:** View applicants strictly for the employer's own jobs, inspect tailored resume pitches, and update applicant status (`under_review`, `shortlisted`, `rejected`, `hired`). Strict server-side scoping strips all private candidate fields (phone, income bracket, hardware deficits, and internal diagnostic scores).

### C. Facilitator & Admin Operations Console (`/admin` — `admin` & `superuser` roles)
- **Employer Verification:** Review and verify or reject registered employer accounts.
- **Remote Jobs & AI Discovery (`/api/admin/jobs`):** Run AI remote job discovery or add jobs manually; review `Pending Review` roles and click **Approve & Publish**.
- **Partner Hub Enlistment (`/api/admin/hubs`):** Enlist and manage co-working hubs across Zimbabwe.
- **Registered Candidates Cohort (`/api/admin/candidates`):** Inspect candidate intakes, readiness tiers, hardware deficits, and applications.
- **Team & User Roles (`/api/admin/users`):** Upgrade any registered teammate or user account to `admin` directly from the UI (or via `scripts/manage-user.mjs`).
- **Live Gemini AI Diagnostics (`/api/ai/status`):** Test live model latency and switch between `gemini-2.5-flash` and `gemini-2.5-pro`.

---

## 4. Repository Architecture & File Documentation

```text
utare-zisedu-mvp/
├── .devcontainer/
│   └── devcontainer.json          # 1-click "Reopen in Container" config for VS Code / Cursor
├── .githooks/
│   └── pre-push                   # Automatic local 5-gate CI check before every git push
├── scripts/
│   ├── manage-user.mjs            # Backend CLI to create/promote/demote admin, superuser & employer accounts
│   ├── pre-push-ci-check.sh       # Runs ESLint, Typecheck, Vitest (22 tests) & Next.js build in Docker
│   └── safe-pr-merge.sh           # Runs local CI + remote GitHub Actions check before merging a PR
├── Dockerfile.dev                 # Development container (Node 20 LTS Alpine + hot-reload polling)
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Orchestrates web container and postgres:16-alpine db container
├── Makefile                       # Shortcuts: make up, make ci-local, make safe-merge, make install-hooks
├── .env.example                   # Template for Gemini AI, PostgreSQL & Auth environment variables
├── supabase/
│   └── schema.sql                 # Full PostgreSQL schema with 9 tables + Zimbabwe Hubs & Coaches seed data
├── index.html                     # Standalone frontend walkthrough entry point
├── app.js                         # Walkthrough client logic connected to Next.js REST API
├── styles.css                     # Faith & Amanda's core CSS design system
├── design/
│   └── demo-app/                  # Preserved contributor static walkthrough files
├── public/
│   └── demo/                      # Static walkthrough hosted at /demo/index.html
└── src/
    ├── __tests__/                 # 5 Vitest suites (22 automated unit & integration tests)
    ├── middleware.ts              # Server-side route protection for /admin, /employer, /account, /pathway
    ├── types/
    │   └── index.ts               # Core TypeScript interfaces for all platform modules & roles
    ├── lib/
    │   ├── auth-session.ts        # Web Crypto HMAC-SHA256 signed HttpOnly session token utilities
    │   ├── auth-guard.ts          # Server-side role & admin/employer authorization guards
    │   ├── password-hash.ts       # PBKDF2-SHA256 password hashing and constant-time verification
    │   ├── validation.ts          # Email format/disposable/MX checks & password strength validator
    │   ├── db.ts                  # PostgreSQL connection pool with graceful offline fallback
    │   ├── store.ts               # Two-way sync: PostgreSQL DB + serverless-safe file/memory store
    │   ├── view-mode-context.tsx  # Global authenticated session & role state provider
    │   ├── mock-data.ts           # Empirical survey benchmarks, 6 archetypes, hubs, coaches & jobs
    │   ├── gemini/
    │   │   ├── client.ts          # Shared live Gemini 2.5 JSON schema client with timeout & fallback
    │   │   └── pathway-engine.ts  # AI Career Pathway + Coach & Hub Matching Engine
    │   └── documents/
    │       ├── humanizer.ts       # Anti-AI-Slop humanizer & 0-100 style audit scorer
    │       ├── cv-writer.ts       # Grounded ATS CV generator
    │       ├── cover-letter-writer.ts # Grounded Zimbabwean business application letter writer
    │       └── docx-export.ts     # Word (.docx) binary exporter
    ├── components/
    │   ├── Navbar.tsx             # Unified header with "U" brand mark & role-aware navigation
    │   ├── PasswordInput.tsx      # Accessible password input with show/hide toggle
    │   └── ZimbabweCitySelect.tsx # Searchable Zimbabwean towns, growth points & diaspora combobox
    └── app/
        ├── globals.css            # Faith & Amanda's design system integrated with Tailwind CSS
        ├── layout.tsx             # Root layout with Manrope/Inter fonts & dark navy footer
        ├── page.tsx               # Executive Overview with ZW radar map & empirical survey data
        ├── about/page.tsx         # About Us, "Six young people" story, values band & 6-person team
        ├── how-it-works/page.tsx  # 4-Stage Mobility Journey Walkthrough
        ├── opportunities/page.tsx # 4-Way Filterable Opportunities with detail modal & CV Studio links
        ├── skills/page.tsx        # Skills Development Directory with interactive lesson progress modal
        ├── employers/page.tsx     # For Employers & Partners + PostgreSQL / Portal enrolment form
        ├── employer/page.tsx      # Scoped Employer Portal: post roles & manage applicants
        ├── contact/page.tsx       # Partner & General Inquiries (PostgreSQL backed)
        ├── login/page.tsx         # Split-screen orbital visual Sign In & Candidate/Employer Registration
        ├── auth/callback/page.tsx # Email verification callback handler
        ├── account/page.tsx       # Candidate Main Dashboard & Workspace
        ├── admin/page.tsx         # Facilitator & Admin Console (Employers, Jobs, Hubs, Cohort, User Roles)
        ├── assessment/page.tsx    # Smart Intake, 6-Factor Diagnostic & AI Coach Pairing
        ├── pathway/page.tsx       # Interactive 90-Day AI Career Roadmap & Mentor Booking
        ├── hubs/page.tsx          # Partner Innovation Hub Directory & Workstation Booking
        ├── jobs/page.tsx          # Verified Remote Jobs + ATS CV & Application Letter Studio
        └── api/                   # REST API routes (/api/auth/*, /api/employer/*, /api/admin/*, etc.)
```

---

## 5. Local CI & Safe PR Merge Workflow for Contributors

To guarantee `main` never breaks on merge:
- **Run full CI locally:**
  ```bash
  npm run lint && npm run typecheck && npm run test:ci && npm run build
  ```
  *(Or inside Docker: `make ci-local`)*
- **Verify local CI + GitHub Actions and merge your PR safely:**
  ```bash
  make safe-merge
  ```

---

## 6. Team Task Assignments & Module Ownership

| Team Member | Assigned Tasks & Contributions | Primary Files / Directories |
| :--- | :--- | :--- |
| **Stewart Mangezi** | **Task #3 & Platform Architecture** (Candidate accounts, 6-factor readiness diagnostic, Gemini AI pathway engine, human coach pairing, auth/security & Docker setup) | `src/lib/gemini/pathway-engine.ts`, `src/app/assessment/page.tsx`, `src/lib/auth-session.ts`, `src/app/admin/page.tsx` |
| **Faith Wenzira** | **Frontend Experience & UI Design** (Visual identity, `Manrope`/`Inter` design system, `ZW` hero & orbital graphics, interactive candidate walkthrough, Opportunities & Skills UI) | `styles.css`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/about/page.tsx`, `src/app/opportunities/page.tsx`, `src/app/skills/page.tsx` |
| **Amanda** | **Frontend Architecture & Database Setup** (UI/UX co-design, responsive page layouts, Partner Hub interface polish & PostgreSQL / Supabase schema deployment) | `supabase/schema.sql`, `src/lib/supabase/client.ts`, `src/components/Navbar.tsx`, `src/app/globals.css` |
| **Munashe** | **Tasks #3 & #4** (Co-managing candidate diagnostic intake & Partner Innovation Hub mapping/enlistment across Zimbabwe) | `src/app/hubs/page.tsx`, `src/app/api/hubs/route.ts`, `src/lib/mock-data.ts` |
| **Kudakwashe** | **Task #5: Competitor Analysis & Market Validation** (Evaluating local/global platforms & curating verified remote job criteria and payment rails) | `src/app/jobs/page.tsx`, `src/app/opportunities/page.tsx`, `docs/` |

---

## 7. Detailed Documentation Links

- **[Team Presentation & Architecture Review Hub](docs/TEAM_REVIEW_GUIDE.md)** — Central index for the team to review all presentation slides, Q&A scripts, and architecture docs.
- **[Full Application Architecture & Vercel Deployment Guide](docs/ARCHITECTURE_AND_TEAM_GUIDE.md)** — End-to-end system diagrams, Vercel serverless lifecycle, Supabase/Postgres persistence, Gemini AI, RBAC security, and full route/API map.
- **[Week 6 Pitch Deck & 4-Minute Speaker Script](docs/PITCH_DECK_WEEK6.md)** — Complete 10-slide presentation deck, stopwatch timing cues, and word-for-word storyteller script.
- **[Uniform Team FAQ & Judge Defense Guide](docs/TEAM_FAQ_UNIFORM.md)** — Standardized 30s/60s answers, judge trap rebuttals, and rapid Q&A cheat sheet.
- **[Coach Catherine Action Items & Sprint Matrix](docs/COACH_CATHERINE_ACTION_ITEMS.md)** — Week 6 to Week 7 deliverables matrix, 7-day countdown, and risk register.
- **[Release Notes (`v2.2.0`)](RELEASE_NOTES.md)** — Latest platform features, Zimbabwe map radar, Flow Video Walkthrough, and live DB synchronization details.
- **[Container & Setup Guide](docs/CONTAINER_AND_SETUP_GUIDE.md)** — How to run, debug, and manage the Docker environment on macOS, Windows (WSL2), and Linux.
- **[Internal Role Provisioning & Test Accounts](docs/TEST_ACCOUNTS.md)** — How to provision `superuser`, `admin`, and `employer` roles via the UI or `scripts/manage-user.mjs`.
- **[CI/CD & Branch Protection Guide](docs/CI_TESTING_AND_BRANCH_PROTECTION.md)** — Automated lint, typecheck, Vitest suites, and PR governance.
- **[Personal GitHub Setup (`mangezi64`)](docs/GITHUB_PERSONAL_ACCOUNT_GUIDE.md)** — Repository-local Git configuration for `https://github.com/mangezi64/utare-zisedu-mvp`.
