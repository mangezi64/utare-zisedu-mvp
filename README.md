# UTARE ZISEDU AI — Economic Mobility Bridge MVP

> **Converting dormant Zimbabwean tertiary talent into productive earners by bridging last-mile hardware, competency verification, AI upskilling paired with human coaching, and direct remote market access.**

---

## 1. Executive Summary & Problem Context

In Zimbabwe, high academic qualification no longer translates into economic mobility. According to the **UTARE User Journey & Economic Mobility Survey ($N = 23$)**:
- **82.6%** of respondents hold university degrees (**91.3%** hold tertiary qualifications).
- **43.5%** remain unemployed and **56.5%** earn $\le \$300$/month (with **30.4%** earning zero income).
- Among those working, **84.6%** are trapped in completely misaligned survival gigs (**38.5%**) or partially aligned roles (**46.2%**), leaving only **15.4%** working in their trained discipline.

### The Triple Bottleneck Solved by UTARE ZISEDU AI
1. **Opaque Local Hiring:** **47.8%** cite non-responsive employers, nepotism, and rigid 1–3 year experience requirements.
2. **Infrastructure Deficits:** **73.9%** lack reliable broadband and **100%** of surveyed self-employed small business owners operate without a dedicated laptop/PC.
3. **Global Payment & Ecosystem Isolation:** **86.4%** of remote job seekers are locked out of international payment rails, and **72.7%** are cut off from incubators, mentorship networks, or workspace hubs.

---

## 2. Containerized Quick Start (Runs Identically on Mac, Windows & Linux)

We use **Docker Compose** and **VS Code Dev Containers** so no team member needs to manually match Node.js or npm versions on their host computer.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- Git installed.

### Step 1: Clone the Repository
```bash
git clone https://github.com/mangezi64/utare-zisedu-mvp.git
cd utare-zisedu-mvp
```

### Step 2: Create Your Local Environment File & Background Gemini Key
```bash
cp .env.example .env.local
```
To enable live **Google Gemini 2.5** models in the background (keeping API keys hidden from end-user candidates), edit `.env.local`:
```bash
GEMINI_API_KEY="AIzaSyYourKeyHere"
GEMINI_MODEL="gemini-2.5-flash"
```
*(Note: The app includes a built-in **Zimbabwe Survey Seed & Deterministic Fallback Engine**, so it runs 100% out-of-the-box even before you paste live `GEMINI_API_KEY` or `SUPABASE` credentials into `.env.local`!)*

### Step 3: Start the Container & Enable Pre-Push CI Hooks
```bash
docker compose up -d --build
make install-hooks
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. Any code changes you save in `src/` will hot-reload automatically inside the container.

---

## 3. Core Platform Capabilities (Candidate View vs. Admin Console)

### A. Candidate Experience (`Candidate View`)
- **My Workspace & Account (`/account`):** Candidates create and save their personal profile, view their readiness score, track their 90-day AI upskilling milestones, view their subsidized **Partner Innovation Hub** pass (100% solar backup, Starlink, PC loans), and monitor their submitted job applications.
- **Smart Intake & Diagnostic (`/assessment`):** Evaluates academic credentials alongside last-mile infrastructure constraints across 6 Zimbabwean demographic archetypes.
- **Grounded ATS CV & Application Letter Studio (`/jobs`):**
  - Generates structured, ATS-friendly CVs and formal Zimbabwean business application letters grounded strictly in candidate facts (zero fabricated employers or dates).
  - **Anti-AI-Slop Humanizer (`src/lib/documents/humanizer.ts`):** Strips 45+ AI clichés and scores every document from `0–100` for natural human tone.
  - **One-Click Downloads:** Export ready-to-send **Word (`.docx`)** files, **A4 Print/PDF**, or plain text.
  - **Clean End-User UI:** API keys, model pickers, and multi-user demo switchers are hidden in Candidate View.

### B. Facilitator & Admin Operations Console (`/admin`)
Switch to **`Admin Console`** in the top navigation bar to access:
- **Partner Hub Enlistment (`/api/admin/hubs`):** Enlist and manage co-working hubs across Harare, Bulawayo, Mutare, Gweru, Masvingo, and Chinhoyi.
- **AI Job Discovery & Approval Pipeline (`/api/admin/jobs`):** Run AI remote job discovery or add jobs manually/via link; review `Pending Review` roles and click **Approve & Publish** to make them visible to candidates.
- **Registered Candidates Cohort (`/api/admin/candidates`):** Inspect all candidate intakes, readiness tiers, hardware deficits, and applications.
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
│   ├── pre-push-ci-check.sh       # Runs ESLint, Typecheck, Vitest (20 tests) & Next.js build in Docker
│   └── safe-pr-merge.sh           # Runs local CI + remote GitHub Actions check before merging a PR
├── Dockerfile.dev                 # Development container (Node 20 LTS Alpine + hot-reload polling)
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Orchestrates the web container & isolated node_modules volume
├── Makefile                       # Shortcuts: make up, make ci-local, make safe-merge, make install-hooks
├── .env.example                   # Template for Gemini AI & Supabase environment variables
├── supabase/
│   └── schema.sql                 # Full PostgreSQL schema + Zimbabwe Hubs & Coaches seed data
└── src/
    ├── __tests__/                 # 5 Vitest suites (20 automated unit & integration tests)
    ├── types/
    │   └── index.ts               # Core TypeScript interfaces for all platform modules
    ├── lib/
    │   ├── store.ts               # Persistent JSON + Supabase data store for candidates, hubs & jobs
    │   ├── view-mode-context.tsx  # Global Candidate View vs. Admin Console state provider
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
    │   └── Navbar.tsx             # Responsive navbar with Candidate View / Admin Console switcher
    └── app/
        ├── page.tsx               # Executive Overview & Empirical Survey Dashboard
        ├── account/page.tsx       # Candidate Workspace: Profile, Hub Pass, Milestones & Applications
        ├── admin/page.tsx         # Admin Console: Hub Enlistment, AI Job Approval & Cohort Directory
        ├── assessment/page.tsx    # Smart Intake, Diagnostic & AI Coach Pairing
        ├── pathway/page.tsx       # Interactive 90-Day AI Career Roadmap & Mentor Booking
        ├── hubs/page.tsx          # Partner Innovation Hub Directory
        ├── jobs/page.tsx          # Verified Remote Jobs + ATS CV & Application Letter Studio
        └── api/                   # REST API routes (/api/auth/profile, /api/admin/*, /api/documents, etc.)
```

---

## 5. Local CI & Safe PR Merge Workflow for Contributors

To guarantee `main` never breaks on merge:
- **Run full CI locally inside Docker:**
  ```bash
  make ci-local
  ```
- **Verify local CI + GitHub Actions and merge your PR safely:**
  ```bash
  make safe-merge
  ```

---

## 4. Team Task Assignments & Module Ownership

| Team Member | Assigned Tasks | Primary Files / Directories |
| :--- | :--- | :--- |
| **Stewart Mangezi** | **Task #3** (Candidate accounts, profile management, skills assessment flow, AI path suggestion paired with human coaching) & Repository Architecture | `src/lib/gemini/pathway-engine.ts`, `src/app/assessment/page.tsx`, `src/app/api/pathway/route.ts`, Docker setup |
| **Munashe** | **Tasks #3 & #4** (Co-managing candidate intake & Partner Innovation Hub mapping/enlistment) | `src/app/hubs/page.tsx`, `src/app/api/hubs/route.ts`, `src/lib/mock-data.ts` |
| **Amanda & Dev Team** | **Frontend Architecture & Database Setup** (Next.js / Tailwind UI polish & Supabase schema deployment) | `supabase/schema.sql`, `src/lib/supabase/client.ts`, `src/components/` |
| **Kudakwashe & Team** | **Competitor Analysis & Market Validation** (Evaluating local/global platforms & curating remote job criteria) | `src/app/jobs/page.tsx`, `docs/` |

---

## 5. Detailed Documentation Links

- **[Container & Setup Guide](docs/CONTAINER_AND_SETUP_GUIDE.md)** — How to run, debug, and manage the Docker environment on macOS, Windows (WSL2), and Linux.
- **[Architecture & Team Development Guide](docs/ARCHITECTURE_AND_TEAM_GUIDE.md)** — How each file works, how Supabase & Gemini AI connect, and our Git branching workflow.
- **[Personal GitHub Setup (`mangezi64`)](docs/GITHUB_PERSONAL_ACCOUNT_GUIDE.md)** — How this repo is isolated from the Odyssey work account (`smangezi`) and how to push to `https://github.com/mangezi64/utare-zisedu-mvp`.
