# UTARE ZEM AI — Team Presentation & Architecture Review Hub

Share this guide with the team (**Munashe Mugonda, Stewart Mangezi, Future, Amanda Mukute, Kudakwashe Maganzu, and Bheki Ndlovu**) as the central index for reviewing all presentation materials, Q&A readiness scripts, and the full application & Vercel deployment architecture.

---

## 1. Document Pack Ready for Team Review

| Document | Purpose | Recommended Reviewers |
| :--- | :--- | :--- |
| **[Kutunga Safety by Design Booklet Draft](SAFETY_BY_DESIGN_BOOKLET_DRAFT.md)** | Complete filled answers for Stages 1–4, Page 12 Ten-Standard Snapshot, Page 13 Open Risks, and Nyasha Gande's TalkBack testing evidence | **All Team** + **Coach Catherine** (priority for Dec 4 submission) |
| **[Pitch Deck & 4-Minute Speaker Script](PITCH_DECK_WEEK6.md)** | Complete 10-slide Week 6 deck, visual layouts, stopwatch cues (`0:00 – 4:00`), and word-for-word storyteller script | **All Team** (especially **Bheki Ndlovu**, **Amanda Mukute**, **Future**) |
| **[Uniform Team FAQ & Judge Defense Guide](TEAM_FAQ_UNIFORM.md)** | Standardized 30s & 60s answers, judge trap rebuttals, handoff rules, and rapid Q&A cheat sheet | **All Team** (mandatory alignment before Q&A) |
| **[Coach Catherine Action Items & Sprint Matrix](COACH_CATHERINE_ACTION_ITEMS.md)** | Advisory directives, per-member deliverables, 7-day countdown, and risk register | **Munashe Mugonda** (Team Lead) + **All Domain Leads** |
| **[Full Application Architecture & Vercel Deployment Guide](ARCHITECTURE_AND_TEAM_GUIDE.md)** | End-to-end system diagrams, Vercel serverless lifecycle & cold-start hydration, Supabase/Postgres schema, RBAC security, Gemini AI, and full page/API map | **Stewart Mangezi**, **Amanda Mukute**, **All Team** (so everyone understands how the live app works) |
| **[Release Notes (`v2.2.0`)](../RELEASE_NOTES.md)** | Latest UI/UX, Zimbabwe map radar, Flow Video Walkthrough, humanized audio, Credential Vault, AI applicant ranking, and audit log release details | **All Team** (for live demo walkthrough alignment) |
| **[Role Provisioning & Test Accounts Guide](TEST_ACCOUNTS.md)** | How to sign up, assign `admin` / `superuser` / `employer` roles on Vercel or via CLI | **Stewart Mangezi**, **Munashe Mugonda**, **Kudakwashe Maganzu** |
| **[Container & Setup Guide](CONTAINER_AND_SETUP_GUIDE.md)** | Local Docker Compose (`web` + `db`) setup for macOS, Windows (WSL2), and Linux | **Technical & Frontend Contributors** |
| **[CI/CD & Branch Protection Guide](CI_TESTING_AND_BRANCH_PROTECTION.md)** | ESLint, TypeScript, Vitest suites, and PR merge rules for `main` | **All Code Contributors** |

---

## 2. Quick Review Checklist for the Team

1. **Story & Timing Alignment (`PITCH_DECK_WEEK6.md`):**
   - Confirm the presenter & backup storyteller selection and verify the `3:50` spoken timing target (`0:00–4:00`).
   - Verify all survey numbers ($N=23$: `82.6%` university degrees, `43.5%` unemployed, `84.6%` misaligned survival gigs, `73.9%` lack reliable broadband, `86.4%` global payment rail lockout) match what each speaker quotes.
2. **Q&A Defense Alignment (`TEAM_FAQ_UNIFORM.md`):**
   - Practice the 3-step Uniform Response Formula (*Direct Anchor → Mechanism & Data → Impact Punchline*) and clean handoffs between domains.
3. **Architecture & Live Vercel App Understanding (`ARCHITECTURE_AND_TEAM_GUIDE.md`):**
   - Review Section 1 & Section 2 so every teammate can explain *how* the live site on **Vercel (`utare-zisedu-mvp.vercel.app`)** connects Next.js Edge Middleware, Node.js Serverless APIs, **Supabase PostgreSQL (EU Frankfurt)** via Service-Role hydration, and **Google Gemini 2.5 Flash** (plus deterministic fallback on weak 3G connections).
   - Walk through the live demo surfaces (`/`, `/login`, `/assessment`, `/pathway`, `/hubs`, `/jobs`, `/account`, `/employer`, `/admin`) alongside the latest `RELEASE_NOTES.md`.
4. **Action Items & Readiness (`COACH_CATHERINE_ACTION_ITEMS.md`):**
   - Check off individual sprint deliverables (hub MOUs, 25 verified remote jobs, 10-user Android field testing, dry-run recording, and Vercel staging health check).
