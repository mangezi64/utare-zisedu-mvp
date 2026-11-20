# Kutunga Safety by Design — Complete Filled Booklet Draft (UTARE ZEM AI)

Use this ready-to-paste draft to fill in the interactive **Safety by Design** PDF booklet. Every claim below is verified directly against our **UTARE User Journey & Economic Mobility Survey** (`N=23` + `Pulse Check Munashe`), our live platform store (`111` user accounts / `125` candidate profiles / `83` employer records / `195` applications), live accessibility testing (`Nyasha Gande`, Android TalkBack), and our verified codebase (`13` test suites, `71/71` passing tests).

---

## Cover Page (Page 1)
- **Team Name:** `UTARE (Munashe Mugonda, Stewart Mangezi, Future, Amanda Mukute, Kudakwashe Maganzu, Bheki Ndlovu)`
- **Solution We Are Building:** `UTARE ZEM AI — Economic Mobility & Remote Work Bridge Platform for Zimbabwean Youth`
- **Our Pitch Date:** `Saturday, 5 December 2026`

---

## Stage 1 · Our Journal: What We Heard (Page 7)

### What young people told us
- **Survey (`N=23`):** `82.6%` hold university degrees, yet `39.1%` are fully unemployed and `84.6%` of working respondents are in misaligned survival gigs (`38.5%` completely misaligned). `66.7%` of unemployed seekers cited *zero responses* and rigid 1–3 year experience walls; `72.7%` lack access to hubs or mentorship networks; `47.8%` rely solely on mobile data bundles; and only `13.6%` (`3/22`) have international payment rails.
- **In their words:**
  - *"I haven't received any response to my applications."* / *"I went for an interview and never called back."*
  - *"Remote work needed strong Internet and I did not have access to that. Internet is ridiculously expensive in Zimbabwe."*
  - *"People with disabilities face additional barriers due to limited workplace accessibility and inclusive hiring practices."* (Mutare respondent)
  - *"The few remote jobs I had from global firms... the employers were just scams. I didn't see an option for it on the questionnaire but it is a great subject to be addressed."* (`Pulse Check` respondent)
  - *"Thank u neprog its friendly pakucreater pakunyora n exploring i m a talkback user totaly blind... Paarea yekusearcher paexplore opportunities ndopanodakuzivikanwa what u have coz what i searched was not there pazobuda technology research professional pandaclicker what i wanted it failed to respond"* (`Nyasha Gande`, totally blind Android TalkBack user, 19 Nov 2026)

### Who we reached, and who we missed
- **Who took part:** Survey respondents across Harare, Mutare, Marondera, Buhera/Murambinda, Bocha, Turf Ngezi, and Cape Town (diaspora), including `3` respondents with disabilities/chronic health conditions, `1` vocational/mechanical engineering apprentice, `1` secondary-level entrepreneur, a totally blind Android TalkBack tester (`Nyasha Gande`), and `111` test accounts / `125` candidate profiles on the live platform across Harare, Bulawayo, Mutare, Chinhoyi, and UK diaspora.
- **Who we missed:** Youth without internet access or smartphones who do not speak/read English comfortably (some survey respondents mixed Shona and English in open answers). We plan to reach them through physical Partner Innovation Hub outreach and future local-language onboarding.

### What already works here
- Local co-working and innovation hubs (e.g., Harare, Bulawayo, Mutare, Gweru nodes with solar backup and Starlink/fiber), existing local USD Nostro bank accounts paired with Deel/Payoneer rails, informal ventures/apprenticeships, and alumni/peer mentorship networks.

### What changed in our thinking
- **Added Scam Reporting & Superuser Quarantine (`Ma'at`):** We initially assumed curating jobs upfront was enough; a `Pulse Check` tester explicitly flagged remote job scams not covered in our survey, so we built a **Report** button that immediately pulls flagged jobs off-platform for Superuser evaluation.
- **Dropped Unnecessary Survey Fields (`Ubuntu`):** We realized asking monthly income brackets and work alignment inside the live product intake wasn't needed after the survey — only whether a user can work remotely on their own or needs a Partner Hub.
- **Accessibility & TalkBack Screen-Reader Fixes (`Isithunzi`):** Disability feedback from Mutare/Murambinda drove our WCAG AAA / colorblind / audio tools, and live testing by totally blind user **Nyasha Gande** revealed silent search/filter dropdowns and unfocused modals on `/opportunities` — leading us to ship `aria-live` result announcements, upfront industry counts, and modal focus management.

### Evidence
- Google Sheet (`UTARE - User Journey & Economic Mobility Survey`: `N=23` + `Pulse Check Munashe`)
- Live platform test database (`111` users, `125` candidate profiles, `83` employer records, `195` applications)
- Live TalkBack usability test (`Nyasha Gande`, 19 Nov 2026)
- Live web app routes: `/assessment`, `/opportunities`, `/hubs`, `/jobs`, `/account`, `/data-policy`

---

## Stage 2 · Our Journal: What We Decided (Page 9)

### What we decided, and why
- **Website-only PII collection (`Ubuntu` / Security):** Kept personal data intake on the authenticated website (rather than a WhatsApp bot) to protect sensitive candidate records under Zimbabwe's Cyber and Data Protection Act [Chapter 12:07].
- **Explicit Consent at Signup & Application (`Bwami`):** Unticked Data Policy acceptance on `/login` (`dataPolicyAcceptedAt` logged) and mandatory unticked **"Share my information with [Employer]"** toggle on `/jobs` (`POST /api/jobs` rejects unconsented submissions; candidates can pause/resume sharing in `/account`).
- **Clear AI Qualification + Employer Discretion (`Baraza`):** AI diagnostics show a `qualificationBreakdown` explaining *why* a candidate qualifies or doesn't yet qualify (exact score/laptop/power thresholds) and how to qualify, with **Bheki Ndlovu** named for human review/appeals, while employers reserve the right to share or withhold specific rejection feedback.

### Harms we named, and how we design against them
- **Fake / scam job listings:** Verified employer onboarding + **Report** button on every job card that immediately takes the listing off the platform and escalates to **Stewart Mangezi** (Superuser) to restore or permanently delete.
- **Over-sharing PII with strangers:** Employers only receive scoped applicant data (`EmployerApplicantView`) after the candidate toggles sharing ON; phone numbers, device/internet/power constraints, and diagnostic sub-scores are stripped server-side.
- **Silent/unexplained AI exclusion:** AI readiness scores are advisory only, never block applying, and show exact reasons + steps to qualify.
- **Weak passwords & unauthorized access:** PBKDF2/scrypt password hashing, signed HTTP-only cookies, server-side role guards (`candidate`, `employer`, `admin`, `superuser`), and red visual highlighting of missing password rules (`PasswordStrengthBox.tsx`).

### Data we will collect, and data we won't
- **Collect:** Name, email, city/town, qualification/skills, optional CV facts/documents, and remote-work/hub readiness (device, internet type, reliable power hours, payment rail status) to match hubs, coaches, and roles.
- **Won't collect:** Income brackets, unrelated household survey questions, or background location tracking.
- **Who sees it & retention:** Candidates control employer sharing per application; admins/superusers moderate safety. **Retention Policy:** After **1 full year (365 days)** of inactivity, users are prompted to log in and confirm remaining on the platform, with **at least 3 email notices** sent before deplatforming/deletion. Users can self-delete anytime by typing `delete` (or via Superuser **Stewart Mangezi** on request, e.g., if a user has passed on).

### What it costs a young person to take part
- **Money:** Platform access and Partner Hub passes for eligible candidates are `$0` (subsidized).
- **Data & Transport:** Users spend small mobile data to load the web app or transport to a local Partner Hub when using free Starlink/solar workstations.
- **How they can leave:** Withdraw consent anytime (pause employer sharing on applications or permanently delete account and all database records by typing `delete` in `/account` or `/employer`).

### Evidence
- `src/app/data-policy/page.tsx` (`/data-policy`, linked in global footer & signup)
- `src/components/DeleteAccountPanel.tsx` & `DELETE /api/auth/account`
- `src/app/api/jobs/report/route.ts` & `src/lib/store.ts` (`1-year` + `3-email` retention enforcement)
- `src/__tests__/area-security.test.ts`, `area-flows.test.ts`, `area-compliance.test.ts` (`71/71` tests passing across 13 suites)

---

## Stage 3 · Prototype & Test (Pages 10–11)

> Tick the 6 **Test With Care** boxes on Page 10 (Voluntary, Informed consent + under-18 guardian consent if applicable, Safeguarding, Only what we need, Kept safe, Closed the loop) as you complete additional live sessions.

### What we tested (Page 11)
- **Who tested it, and how:**
  - **Live Accessibility Test (19 Nov 2026):** **Nyasha Gande**, a totally blind Android **TalkBack** screen-reader user, tested account creation, typing, and exploring opportunities on a mobile browser (including unauthenticated browsing of `/opportunities`).
  - **Platform & Survey Cohort:** Platform cohort testing (`111` accounts / `125` candidate profiles across Harare, Mutare, Bulawayo, Chinhoyi, UK Diaspora) + `N=23` survey / `Pulse Check` feedback + `[ADD any additional youth mobile-data sessions before Dec 4 under Test With Care consent]`.
- **What worked:**
  - **Nyasha Gande (TalkBack user):** *"Thank u neprog its friendly pakucreater pakunyora n exploring i m a talkback user totaly blind"* — confirmed account creation, typing, and general page exploration worked smoothly with Android TalkBack.
  - Automated CV tailoring, clear hub matching, scoped employer privacy, and assistive controls.
- **What didn't, and what we changed:**
  1. **TalkBack Explore Opportunities & Filter Focus (`Isithunzi` / `Palaver`):** Nyasha reported: *"Paarea yekusearcher paexplore opportunities ndopanodakuzivikanwa what u have coz what i searched was not there pazobuda technology research professional pandaclicker what i wanted it failed to respond"*. **Fix shipped:** Added a `"Currently Available on UTARE"` industry summary with counts (`aria-pressed`), expanded search matching across categories/industries/payment rails, added `aria-live="polite"` result count announcements, fixed missing `industry` filter mismatches, and added dialog focus management (`tabIndex={-1}` heading focus + `Escape`/close focus restoration) plus direct `/jobs?jobId=` pre-selection.
  2. **Weak Password Missing-Rule Feedback (`Ma'at`):** Testers creating accounts with 3/4 password rules satisfied couldn't tell why the disabled button wouldn't submit → removed premature disable lock and added **red box + red missing-rule highlight** (`PasswordStrengthBox.tsx`).
  3. **Remote Job Scam Reporting (`Ma'at`):** Survey/pulse tester flagged global remote scams → built immediate off-platform **Report** flow for Superusers.
- **Beyond compliance:** Respects dignity (self-taught & vocational trades included alongside degrees; blind screen-reader users able to explore & apply independently), prevents employer over-reach, and protects inactive users with 3 warnings before deletion. Unintended consequence watched: English-only UI can exclude non-English-fluent rural youth (logged honestly on Page 13).

---

## Stage 4 · Ten-Standard Snapshot (Page 12)

1. **MA'AT:** `BUILT IN` — Evidence: **Page 9** (Report button removes job off-platform; **Stewart Mangezi** is named Superuser/Safeguarding responder).
2. **PALAVER:** `BUILT IN` — Evidence: **Page 7 & 11** (`N=23` survey + Pulse Check scam/disability inputs + **Nyasha Gande** TalkBack test directly changed product features).
3. **BWAMI:** `BUILT IN` — Evidence: **Page 9** (Unticked Data Policy at signup, unticked employer-sharing toggle at application, typed `delete` self-erasure).
4. **JELIYA:** `BUILT IN` *(with Open Risk on p.13)* — Evidence: **Page 7 & 9** (Plain English + audio explainer/transcripts + non-formal experience respected; English-only scoped for international remote work).
5. **UBUNTU:** `BUILT IN` — Evidence: **Page 9** (Zimbabwe Cyber & Data Protection Act `/data-policy`, data minimization, employer PII stripping, 1-year + 3-email retention, self/superuser erasure).
6. **BARAZA:** `BUILT IN` — Evidence: **Page 9** (`qualificationBreakdown` explains AI qualification/non-qualification; **Bheki Ndlovu** named for human appeal review; employer feedback discretion stated).
7. **UKAMA:** `BUILT IN` — Evidence: **Page 9** (Independent signup without guardian/employer gatekeeping; candidates toggle employer visibility).
8. **ISITHUNZI:** `BUILT IN` — Evidence: **Page 7 & 11** (Inclusive qualification levels + WCAG/colorblind/dyslexic/audio accessibility tools + TalkBack screen-reader fixes validated with **Nyasha Gande**).
9. **SANKOFA:** `BUILT IN` — Evidence: **Page 7** (Built on local Zimbabwean innovation hubs, USD Nostro + mobile/Deel rails, and survey/hub participants — involved contributors acknowledged collectively without a published named list).
10. **HARAMBEE:** `BUILT IN` *(with Open Risk on p.13)* — Evidence: **Page 9 & 11** (Runs as a responsive web app on any internet-connected phone, café PC, or Partner Hub; offline/native apps and WhatsApp bots planned post-MVP).

---

## Stage 4 · Risks Still Open (Page 13)

1. **Language Access (`Jeliya`):** The MVP is currently English-only because target international remote employers require English. *Plan to close:* Add optional Shona and Ndebele audio onboarding guides post-MVP.
2. **Connectivity & Device Access (`Harambee`):** As a web app, UTARE runs on any internet-connected browser (including shared café PCs and low-cost phones) and routes device-constrained youth to Partner Hubs, but does not yet work offline or via SMS/WhatsApp bot. *Plan to close:* Build lightweight PWA offline caching and secure WhatsApp/USSD status notifications in a post-MVP phase, plus add a shared-computer sign-out reminder.
3. **Automated Inactivity & Breach Email Transport (`Ubuntu`):** The 1-year + 3-email retention logic and audit logs are enforced in the database/backend, and production SMTP email dispatch (e.g., Resend/Custom SMTP) must be verified active in live hosting so all 3 automated warning emails deliver reliably.
4. **Ongoing Youth Usability Verification (`Palaver`):** Continue documenting live smartphone/mobile-data tests with young testers (and close the loop with **Nyasha Gande** on the updated `/opportunities` TalkBack flow) before Pitch Day (5 Dec).
