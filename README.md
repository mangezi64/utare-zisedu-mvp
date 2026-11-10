# UTARE ZIMEDU AI — Economic Mobility Bridge MVP

> **Converting dormant Zimbabwean tertiary talent into productive earners by bridging last-mile hardware, competency verification, AI upskilling paired with human coaching, and direct remote market access.**

---

## 1. Executive Summary & Problem Context

In Zimbabwe, high academic qualification no longer translates into economic mobility. According to the **UTARE User Journey & Economic Mobility Survey ($N = 23$)**:
- **82.6%** of respondents hold university degrees (**91.3%** hold tertiary qualifications).
- **43.5%** remain unemployed and **56.5%** earn $\le \$300$/month (with **30.4%** earning zero income).
- Among those working, **84.6%** are trapped in completely misaligned survival gigs (**38.5%**) or partially aligned roles (**46.2%**), leaving only **15.4%** working in their trained discipline.

### The Triple Bottleneck Solved by UTARE ZIMEDU AI
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

### Step 2: Create Your Local Environment File
```bash
cp .env.example .env.local
```
*(Note: The app includes a built-in **Zimbabwe Survey Seed & Deterministic Fallback Engine**, so it runs 100% out-of-the-box even before you paste live `GEMINI_API_KEY` or `SUPABASE` credentials into `.env.local`!)*

### Step 3: Start the Container
```bash
docker compose up --build
```
*(Or simply run `make up` on macOS/Linux).*

Open **[http://localhost:3000](http://localhost:3000)** in your browser. Any code changes you save in `src/` will hot-reload automatically inside the container.

---

## 3. Repository Architecture & File Documentation

```text
utare-zisedu-mvp/
├── .devcontainer/
│   └── devcontainer.json          # 1-click "Reopen in Container" config for VS Code / Cursor
├── Dockerfile.dev                 # Development container (Node 20 LTS Alpine + hot-reload polling)
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Orchestrates the web container & isolated node_modules volume
├── Makefile                       # Shortcuts: make up, make down, make logs, make shell
├── .env.example                   # Template for Gemini AI & Supabase environment variables
├── supabase/
│   └── schema.sql                 # Full PostgreSQL schema + Zimbabwe Hubs & Coaches seed data
├── docs/
│   ├── CONTAINER_AND_SETUP_GUIDE.md     # Detailed Docker & local setup guide for all OSes
│   ├── ARCHITECTURE_AND_TEAM_GUIDE.md   # Deep-dive into every module & team task boundaries
│   └── GITHUB_PERSONAL_ACCOUNT_GUIDE.md # Personal GitHub (mangezi64) vs Odyssey account isolation
└── src/
    ├── types/
    │   └── index.ts               # Core TypeScript interfaces for all 5 MVP modules
    ├── lib/
    │   ├── mock-data.ts           # Empirical survey benchmarks, Zimbabwe hubs, coaches & jobs
    │   ├── supabase/
    │   │   └── client.ts          # Supabase client with graceful offline/seed fallback
    │   └── gemini/
    │       └── pathway-engine.ts  # Task #3: Gemini AI Career Pathway + Coach & Hub Matching Engine
    ├── components/
    │   └── Navbar.tsx             # Responsive top navigation bar
    └── app/
        ├── page.tsx               # Executive Overview & Empirical Survey Dashboard
        ├── assessment/
        │   └── page.tsx           # Tasks #1, #2 & #3: Smart Intake, Diagnostic & AI Coach Pairing
        ├── hubs/
        │   └── page.tsx           # Task #4: Partner Innovation Hub Directory & Enlistment Form
        ├── jobs/
        │   └── page.tsx           # Task #5: Verified Remote Jobs & AI Resume Tailoring Studio
        └── api/
            ├── pathway/route.ts   # POST endpoint for diagnostic scoring & Gemini AI pathway generation
            └── hubs/route.ts      # GET/POST endpoint for listing & enlisting Partner Hubs
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
