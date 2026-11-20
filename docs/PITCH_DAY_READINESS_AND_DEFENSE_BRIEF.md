# UTARE ZEM AI — Internal Pitch Day Readiness & Judge Defense Brief

**Purpose:** Internal team alignment document addressing every question raised in the Pitch Day preparation meeting—grounded strictly in what is currently built in the codebase, what is verified by evidence, and where our honest limitations and pre-pitch action items lie.

**Pitch Date:** Saturday, 5 December 2026  
**Cross-References:**
- [SAFETY_BY_DESIGN_BOOKLET_DRAFT.md](SAFETY_BY_DESIGN_BOOKLET_DRAFT.md)
- [TEAM_FAQ_UNIFORM.md](TEAM_FAQ_UNIFORM.md)
- [PITCH_DECK_WEEK6.md](PITCH_DECK_WEEK6.md)
- [Data Policy Page](../src/app/data-policy/page.tsx)

---

## 1. Practicality, Reliability & Sustainability

### Practicality (Designed for Zimbabwean Realities)
- **Built around real constraints, not ideal conditions:** Our survey (`N=23`) showed `47.8%` of youth rely solely on mobile data bundles and only `13.6%` (`3/22`) have international payment rails. Instead of assuming everyone has a laptop, fiber, and a Payoneer account, UTARE routes device/power-constrained candidates to local solar-powered **Partner Innovation Hubs** (e.g., Harare, Bulawayo, Mutare, Gweru) and pairs USD Nostro / Deel / Payoneer readiness guidance into the pathway.
- **No "AI slop" CV rejection:** The CV & Cover Letter Studio (`/jobs`) anchors every document in user-verified education, work, and project facts and scans drafts against `45+` banned AI clichés (`0–100` Human Tone Score).

### Reliability
- **AI + Deterministic Fallback:** Pathway synthesis uses **Google Gemini 2.5 Flash** with strict JSON schema output. If mobile 3G/4G drops mid-request or the AI endpoint times out, the built-in deterministic fallback engine (`src/lib/gemini/pathway-engine.ts`) immediately generates the 90-day 3-phase roadmap, matched Zimbabwean coach, and nearest Partner Hub so the user never hits a dead end.
- **Persistence & Test Coverage:** Production state persists in PostgreSQL / Supabase (with local JSON fallback in development) and is covered by `15` automated test suites (`85/85` passing tests).
- **Current Email Reliability Gap (Honest Limitation):** Email verification currently uses `utarezemai@gmail.com` via Gmail SMTP, which can land in Spam/Junk. We added prominent Spam/Junk guidance in the UI, launched **Continue with Google (Supabase OAuth)** on `/login` so Gmail users can sign in or register without waiting on SMTP delivery, and plan to migrate SMTP to a dedicated transactional relay (Resend or Brevo with SPF/DKIM/DMARC).

### Sustainability
- **Cost to Youth:** `$0` for platform access, diagnostics, CV generation, and subsidized Partner Hub passes for eligible candidates.
- **Revenue / Sustainment Model:** B2B employer talent-placement fees, verified employer job-listing tiers, and institutional/hub partnerships—never charging unemployed youth.

---

## 2. Validation & Evidence of Testing with Young People

Everything we present in the pitch and booklet must cite **observed evidence**, not assumptions:

1. **UTARE User Journey & Economic Mobility Survey (`N=23` + `Pulse Check Munashe`):**
   - `82.6%` hold university degrees, yet `39.1%` are fully unemployed and `84.6%` of working respondents are in misaligned survival gigs (`38.5%` completely misaligned).
   - `66.7%` of unemployed seekers cited *zero responses* and rigid 1–3 year experience walls; `72.7%` lack access to hubs or mentorship networks; `47.8%` rely solely on mobile data bundles; only `13.6%` (`3/22`) have international payment rails.
   - Geographic spread: Harare, Mutare, Marondera, Buhera/Murambinda, Bocha, Turf Ngezi, and Cape Town (diaspora), including `3` respondents with disabilities/chronic health conditions, `1` vocational/mechanical engineering apprentice, and `1` secondary-level entrepreneur.
2. **Live Accessibility Testing with Blind Youth (`Nyasha Gande`, 19 Nov 2026):**
   - Nyasha Gande, a totally blind Android **TalkBack** screen-reader user, tested account creation, typing, and exploring opportunities on mobile.
   - **What worked:** Account creation and typing (*"Thank u neprog its friendly pakucreater pakunyora n exploring i m a talkback user totaly blind"*).
   - **What failed & what we fixed:** Search/filter dropdowns and modal interactions on `/opportunities` failed to announce or focus properly. We shipped `aria-live="polite"` result announcements, upfront `"Currently Available on UTARE"` industry counts, expanded search matching, and modal focus management/restoration.
3. **Platform Cohort & Test Database:**
   - `111` user accounts, `125` candidate profiles, `83` employer records, and `195` applications across Harare, Bulawayo, Mutare, Chinhoyi, and UK diaspora. *(Note for honesty: be clear with judges which records are structured pilot/test cohort records vs. organic external youth signups.)*
4. **Product Changes Directly Driven by User Feedback:**
   - Added **Scam Reporting + immediate off-platform quarantine** after `Pulse Check` flagged global remote job scams.
   - Removed unnecessary **income bracket & household survey fields** from live intake (`Ubuntu` data minimization).
   - Added **red missing-rule password feedback** (`PasswordStrengthBox.tsx`) after testers couldn't tell why a disabled signup button wouldn't submit.

**Pre-Pitch Evidence Gap to Close:**
- Complete and document 2–3 additional live youth mobile-data usability sessions under the 6 **Test With Care** boxes (Booklet Page 10), and close the loop with **Nyasha Gande** on the updated `/opportunities` TalkBack flow before **5 December 2026**.

---

## 3. Access: Limited/No Internet, Offline Mode, Load Speed & Shared Devices

| Judge Question | Honest Current Reality | How We Handle It Today | Roadmap / Pre-Pitch Action |
| :--- | :--- | :--- | :--- |
| **Limited or no internet access** | Users need an internet connection to load the web app initially. | Mobile-responsive web UI; deterministic pathway fallback if 3G/4G drops during AI synthesis; physical **Partner Innovation Hubs** (solar + Starlink/fiber) for youth without home connectivity or laptops. | Add lightweight offline caching (PWA Service Worker) and SMS/WhatsApp status alerts post-MVP. |
| **Does it work offline?** | **No — not fully offline yet.** (Be transparent: do not claim the whole app works offline.) | Once a page is loaded in-browser, form state isn't lost on a brief AI timeout, and CV/cover letters can be downloaded as `.docx` / PDF / plain text for offline use. | Build PWA offline caching for diagnostics, saved CVs, and skills modules post-MVP. *(Note: audit copy on `/skills` that mentions "offline-first" so pitch claims match exact reality.)* |
| **How quickly does the website load?** | Built on Next.js with server-rendered routes, lightweight CSS/Tailwind, and fast Gemini 2.5 Flash JSON responses. | Core flows avoid heavy auto-playing media; the 2-minute walkthrough demo is optional. | **Action Item:** Run a Chrome DevTools / Lighthouse check on **Slow 3G** before Pitch Day so we can cite exact KB payload and First Contentful Paint seconds. |
| **Can it function on shared devices (cyber cafés, hub PCs, family phones)?** | **Yes, with a caveat.** Works in any standard browser with no app install required. | Uses HTTP-only signed cookies (`utare_session`) and provides an explicit **Sign Out** button in the navbar. | **Honest Gap:** Sessions currently default to a **7-day TTL** (`60 * 60 * 24 * 7` in `src/lib/auth-session.ts`) with no "This is a shared device" short-session toggle or idle auto-logout yet. Add a **"Shared / public computer? Sign out when done"** reminder (and optionally a short-TTL option) before/after Pitch Day. |
| **Disability & Assistive Access** | **Built-in & tested.** | WCAG/high-contrast, colorblind, dyslexic-font, and audio explainer controls + verified Android TalkBack fixes. | Continue screen-reader verification with Nyasha Gande. |

---

## 4. Safety, Privacy, Security & Accountability

- **Legal & Policy Alignment:** Designed around **Zimbabwe's Cyber and Data Protection Act [Chapter 12:07]** and documented publicly at `/data-policy` (linked in the global footer and at signup).
- **Website-Only PII Collection:** We intentionally avoided collecting candidate PII via a WhatsApp bot so sensitive records stay inside authenticated, encrypted web sessions.
- **Data Minimization:** We collect only what is needed to match hubs, coaches, and roles (name, email, city/town, qualifications/skills, optional CV facts, remote-work/hub readiness). We **do not** collect household income brackets or background GPS location.
- **Consent-Gated Sharing:**
  - Data Policy checkbox at signup (`/login`) is **unticked by default** (`dataPolicyAcceptedAt` logged).
  - **"Share my information with [Employer]"** toggle on `/jobs` is **unticked by default** (`POST /api/jobs` rejects unconsented submissions; candidates can pause/resume sharing anytime in `/account`).
  - Employers only receive `EmployerApplicantView`—phone numbers, device/internet/power constraints, and diagnostic sub-scores are **stripped server-side**.
- **Security Controls:** PBKDF2/scrypt salted password hashing, HMAC-SHA256 signed HTTP-only session cookies, and server-side role guards (`candidate`, `employer`, `admin`, `superuser`).
- **Retention & Right to Erasure:**
  - **1-year (365-day) inactivity policy** with **at least 3 email notices** before deplatforming/deletion.
  - Users can self-delete their account and all records immediately by typing `delete` in `/account` or `/employer`, or request deletion via Superuser **Stewart Mangezi**.
- **Named Accountability:**
  - **Stewart Mangezi** — Superuser / Safeguarding & Scam Quarantine Lead.
  - **Bheki Ndlovu** — Human Review & Appeals Lead for AI Readiness Tier decisions (`qualificationBreakdown` is advisory only and never blocks applying).

---

## 5. Fake Job Opportunities, Malicious Activity & Verification

### How We Prevent & Respond to Scams
1. **Employer Onboarding & Email Verification:** Employers register via `/employers` (wired to Supabase Auth email confirmation) with company details (name, website, industry, hiring model).
2. **Instant Community Quarantine (`Report` Button):** Every job card has a **Report** button (`POST /api/jobs/report`). When any user flags a suspicious or fake listing, it is **immediately pulled off-platform** (hidden from all candidates) and escalated to Superuser **Stewart Mangezi** to investigate, restore, or permanently delete.
3. **No Blind PII Exposure:** Even if a bad actor slips through, they cannot harvest candidate phone numbers or personal constraints unless a candidate explicitly toggles sharing ON, and sensitive diagnostic fields remain stripped server-side.

### Honest Gaps in Verification
- We do **not** yet have automated company-registry API checks (e.g., ZIMRA/Companies Registry lookup) or automated rate-limiting/CAPTCHA on public signup/report forms.
- Today, verification relies on **email confirmation + manual admin/superuser vetting + instant user-triggered quarantine**. Post-MVP, we plan to add domain/registry verification badges and automated rate-limiting.

---

## 6. Age Restrictions & Independent Access

- **Independent Access (`Ukama` Standard):** Young people can sign up, run diagnostics, and control employer visibility independently without needing an employer or third party to gatekeep their profile.
- **Age Restrictions (HONEST GAP — Must Address Clearly):**
  - **Current Codebase Reality:** There is currently **no enforced minimum-age gate, date-of-birth field, or 18+ self-attestation** in `/login` or `/data-policy`.
  - **Target Audience & Policy Position:** UTARE is built for **job-ready youth aged 18+** (tertiary students, graduates, and young adults). Under Zimbabwean labor law and the Cyber and Data Protection Act, any **under-18 user (e.g., 16–17 vocational apprentice)** should only participate with **verified parent/guardian consent**.
  - **Pre-Pitch Action Item:** Add an explicit **18+ eligibility & under-18 guardian-consent clause** to `/data-policy` and an **18+ confirmation checkbox** (or age-band check) on `/login` signup so our code matches our safeguarding policy.

---

## 7. Honest Limitations: What UTARE Can & Cannot Do

| What UTARE **CAN** Do Today | What UTARE **CANNOT** Do Today | How We Address It |
| :--- | :--- | :--- |
| Diagnose remote-work readiness and generate a 90-day 3-phase pathway with deterministic fallback if AI/3G drops. | Guarantee a job offer or replace employer hiring decisions. | Advisory `qualificationBreakdown` + human appeal (**Bheki Ndlovu**) + CV/cover letter tailoring. |
| Strip sensitive PII from employers and quarantine reported scam jobs immediately off-platform. | Automatically verify foreign companies against government registries in real time. | Email confirmation + manual Superuser vetting (**Stewart Mangezi**) + instant Report quarantine. |
| Run on any mobile/desktop browser with TalkBack/accessibility support and route youth to solar/Starlink Partner Hubs. | Work fully **offline** (no Service Worker/PWA cache or SMS/USSD/WhatsApp bot yet). | Post-MVP PWA offline caching + WhatsApp/USSD status notifications. |
| Support shared café/hub browsers with explicit Sign Out and HTTP-only cookies. | Auto-expire shared-device sessions in minutes (currently 7-day cookie TTL). | Add a shared-device sign-out reminder / short-TTL session option. |
| Serve English-fluent youth targeting international remote roles. | Serve non-English-fluent rural youth in Shona or Ndebele. | Post-MVP Shona & Ndebele audio onboarding guides + Partner Hub outreach. |

---

## 8. Booklet Completeness & Pre-Pitch Checklist (Before 5 Dec 2026)

1. **Booklet Pages 1–13:** Transfer all verified content from [SAFETY_BY_DESIGN_BOOKLET_DRAFT.md](SAFETY_BY_DESIGN_BOOKLET_DRAFT.md) into the official **UTARE Safety by Design Booklet** PDF and tick the 6 **Test With Care** boxes on Page 10 only as sessions are completed.
2. **Close the Loop with Nyasha Gande:** Have Nyasha re-test the updated `/opportunities` TalkBack flow and log the confirmation in the booklet.
3. **Run Additional Youth Mobile-Data Tests:** Conduct 2–3 documented usability sessions with young people on real mobile data bundles (with informed consent) and record exact load times on Slow 3G.
4. **Add 18+ Age Policy / Attestation & Shared-Device Warning:** Update `/login` and `/data-policy` so age eligibility and shared-computer sign-out reminders are live before judges test the app.
5. **Transactional Email Relay:** Migrate Supabase SMTP from `utarezemai@gmail.com` to Resend or Brevo with verified SPF/DKIM/DMARC so verification links don't hit Spam.
