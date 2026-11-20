export type FaqCategoryId =
  | "login-accounts"
  | "diagnostic-pathway"
  | "cv-applications"
  | "hubs-payments"
  | "safety-privacy"
  | "employers"
  | "accessibility-navigation";

export interface FaqCategory {
  id: FaqCategoryId;
  label: string;
  description: string;
}

export interface FaqLink {
  label: string;
  href: string;
}

export interface FaqItem {
  id: string;
  category: FaqCategoryId;
  question: string;
  answer: string[];
  bullets?: string[];
  links?: FaqLink[];
  keywords: string[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "login-accounts",
    label: "Login, Passwords & Accounts",
    description:
      "Creating accounts, email verification links, password rules, resets, and role routing.",
  },
  {
    id: "diagnostic-pathway",
    label: "Diagnostic, AI Pathway & Coaching",
    description:
      "6-factor readiness intake, AI tier explanations, human appeals, and weak-network resilience.",
  },
  {
    id: "cv-applications",
    label: "CV Studio, Credentials & Applications",
    description:
      "Grounded ATS CVs, anti-AI-slop scoring, optional CV photos, versioned vault, and employer consent.",
  },
  {
    id: "hubs-payments",
    label: "Partner Hubs, Smartphones & Payments",
    description:
      "Solar-backed hubs, smartphone-first access, zero candidate fees, and USD payment rails.",
  },
  {
    id: "safety-privacy",
    label: "Safety, Anti-Scam & Data Privacy",
    description:
      "Listing takedown reporting, Zimbabwe Data Protection Act [Chapter 12:07], retention, and deletion.",
  },
  {
    id: "employers",
    label: "For Employers & Hiring Partners",
    description:
      "Company verification, posting roles, AI applicant fit ranking, and privacy boundaries.",
  },
  {
    id: "accessibility-navigation",
    label: "Accessibility, Audio & Navigation",
    description:
      "Audio walkthroughs, Flow Demo, high-contrast/colorblind modes, and two-way navigation.",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  // 1. Login, Passwords & Accounts
  {
    id: "create-account-email-confirmation",
    category: "login-accounts",
    question:
      "How do I create an account, and why do I need to confirm my email address?",
    answer: [
      "Visit the Sign In / Create Account page, switch to the Create Account tab, choose either 'I am a Candidate' or 'I am an Employer', fill in your details, read and tick the UTARE Data Policy consent checkbox, and submit the form.",
      "To prevent fake signups and keep candidate and employer accounts secure, UTARE validates email domains (rejecting temporary or disposable domains such as Mailinator, TempMail, or Yopmail, as well as undeliverable domains without valid mail servers) and requires email confirmation before your first sign-in.",
    ],
    bullets: [
      "The Data Policy consent checkbox is intentionally unticked by default—you must review and tick it before registering.",
      "After submitting, the signup page opens a dedicated email verification screen showing your registered address, Spam/Junk/Promotions folder tips (look for UTARE ZEM AI / utarezemai@gmail.com), and a Resend button.",
      "Open your inbox—or check Spam/Junk/Promotions and mark the message as 'Not spam'—then click 'Confirm email address' to activate your account.",
      "When confirmation finishes on the verification page, your session activates and routes you straight to your workspace.",
    ],
    links: [
      { label: "Create Account", href: "/login?tab=register" },
      { label: "Read Data Policy", href: "/data-policy" },
    ],
    keywords: [
      "signup",
      "register",
      "disposable email",
      "mx record",
      "consent checkbox",
      "confirm email",
      "verification",
    ],
  },
  {
    id: "missing-or-expired-verification",
    category: "login-accounts",
    question:
      "What should I do if my verification email did not arrive or the confirmation link expired?",
    answer: [
      "First check your Spam, Junk, or Promotions folders for a message from UTARE ZEM AI (utarezemai@gmail.com) and mark it as 'Not spam' so the verification link works cleanly. If you still cannot find it—or if your link says it is invalid or expired—you can request a fresh confirmation email directly inside the platform without creating a second account.",
      "If our cloud email service temporarily hits a sending rate limit during busy periods, UTARE automatically falls back to provisioning or guiding your confirmation safely so signups are not blocked.",
    ],
    bullets: [
      "Right after signup (/login or /employers): use the dedicated verification card with your confirmed address, Spam folder instructions, and one-click Resend Verification Email button.",
      "On Sign In (/login): if you try signing in before verifying, a Spam folder reminder and 'Resend Confirmation Email' button appear directly inside the notice banner.",
      "On the Verification Page (/auth/callback): if a token or link has expired, enter your email in the 'Need a fresh confirmation link?' box and click 'Resend Link'.",
      "If you are in local or demo mode, a direct one-click verification button is displayed on screen so you can verify immediately.",
    ],
    links: [
      { label: "Go to Sign In", href: "/login" },
      { label: "Contact Support", href: "/contact" },
    ],
    keywords: [
      "resend",
      "confirmation email",
      "expired link",
      "callback",
      "token",
      "spam",
      "rate limit",
      "verify",
    ],
  },
  {
    id: "google-sign-in-oauth",
    category: "login-accounts",
    question: "How does 'Continue with Google' work for signing in or registering?",
    answer: [
      "You can click 'Continue with Google' on either the Sign In tab or the Create Account tab at /login to authenticate directly with your Google account without waiting for an email confirmation link.",
      "When creating a new account with Google, you must still choose whether you are registering as a Candidate or an Employer, provide a Company Name if registering as an Employer, and read and tick the UTARE Data Policy consent checkbox before continuing.",
    ],
    bullets: [
      "First-time Google users are automatically verified and routed to their workspace (/assessment for candidates, /employer for employers, or /admin for authorized facilitators).",
      "If you later want to sign in with an email and password instead of Google, click 'Forgot password? Reset here' on /login to set a password for your account.",
      "Existing email-and-password accounts keep their password, role, and profile data intact when signing in with the same verified Google email.",
    ],
    links: [
      { label: "Sign In with Google", href: "/login" },
      { label: "Create Account", href: "/login?tab=register" },
      { label: "Read Data Policy", href: "/data-policy" },
    ],
    keywords: [
      "google",
      "google sign-in",
      "continue with google",
      "oauth",
      "gmail",
      "supabase oauth",
      "password",
    ],
  },
  {
    id: "password-requirements",
    category: "login-accounts",
    question:
      "Why was my password rejected during registration or password reset?",
    answer: [
      "Every UTARE account uses salted password hashing and enforces four security rules so weak passwords cannot put your personal documents or employer records at risk.",
      "Whenever you submit a form with an incomplete password, the password strength box highlights in red and explicitly marks any missing requirement so you can fix it immediately.",
    ],
    bullets: [
      "At least 8 characters long.",
      "Both uppercase (A–Z) and lowercase (a–z) letters.",
      "At least 1 number (0–9).",
      "At least 1 special symbol (such as !, @, #, $, %, ^, &, *).",
    ],
    links: [{ label: "Create Account", href: "/login?tab=register" }],
    keywords: [
      "password strength",
      "rejected",
      "red highlight",
      "uppercase",
      "symbol",
      "8 characters",
    ],
  },
  {
    id: "forgot-or-change-password",
    category: "login-accounts",
    question: "How do I reset a forgotten password or change my current one?",
    answer: [
      "If you forgot your password, click 'Forgot password? Reset here' right above the password field on the Sign In page. Enter your registered email address, your exact registered full name, and your new strong password to update it immediately.",
      "If you are already signed in and want to change your password, open My Workspace (/account) and scroll to the 'Security & Password Update' card, enter your current password, and set your new password.",
    ],
    bullets: [
      "For security protection, Admin and Superuser accounts cannot be reset through the self-service name form on /login—contact a platform Superuser if an admin password needs resetting.",
      "Password updates sync across both the primary database and authentication store so your next sign-in works immediately.",
    ],
    links: [
      { label: "Sign In / Reset Password", href: "/login" },
      { label: "My Workspace", href: "/account" },
    ],
    keywords: [
      "forgot password",
      "reset password",
      "change password",
      "security card",
      "account",
    ],
  },
  {
    id: "unified-login-and-roles",
    category: "login-accounts",
    question:
      "Where is the Employer or Admin login tab, and how do I know which account role I am using?",
    answer: [
      "UTARE uses a single unified Sign In screen at /login—there is intentionally no separate public Admin login tab. When you sign in, the server verifies your account role (Candidate, Employer, Admin, or Superuser) and routes you automatically to your rightful workspace (/account, /employer, or /admin).",
      "Once logged in, look at the circular user avatar badge on the top-right of the navigation bar. Clicking it opens a clean profile card showing your name, email, active role badge, a quick shortcut to your workspace, and Sign Out.",
    ],
    bullets: [
      "Green dot badge: Candidate Workspace (/account).",
      "Blue building badge: Employer Partner Portal (/employer).",
      "Amber shield badge: Facilitator / Admin or Superuser Console (/admin).",
      "On mobile screens, open the menu button (☰) to see your workspace jump button and Sign Out.",
    ],
    links: [
      { label: "Sign In", href: "/login" },
      { label: "For Employers", href: "/employers" },
    ],
    keywords: [
      "unified login",
      "admin tab",
      "employer login",
      "avatar badge",
      "role routing",
      "sign out",
    ],
  },
  {
    id: "browse-without-account",
    category: "login-accounts",
    question: "What can I explore on UTARE without creating an account?",
    answer: [
      "You can browse the public overview, learn how the 4-stage bridge works, inspect the empirical survey evidence, browse open opportunities, explore Partner Innovation Hubs, preview free modular skills courses, read our Data Protection Policy, and view this FAQ without signing in.",
      "Signing in is required whenever personal data or persistent workspace actions are involved—such as saving your 6-factor Diagnostic, viewing your personalized 90-day AI Pathway, booking a hub desk or human coach, storing credentials in your vault, submitting an application, or reporting a suspicious job listing.",
    ],
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "Browse Opportunities", href: "/opportunities" },
      { label: "Explore Partner Hubs", href: "/hubs" },
    ],
    keywords: [
      "public",
      "guest",
      "without logging in",
      "browse",
      "sign in required",
    ],
  },

  // 2. Diagnostic, AI Pathway & Coaching
  {
    id: "qualifications-required",
    category: "diagnostic-pathway",
    question:
      "Do I need a university degree or years of formal work experience to use UTARE?",
    answer: [
      "No. While many Zimbabwean university graduates use UTARE to escape underemployment, the platform explicitly welcomes National Diploma / HND / Polytech / TVET graduates, A-Level or high school leavers, vocational artisans, and self-taught professionals.",
      "Our diagnostic evaluates practical abilities—communication, digital tools, problem solving, asynchronous task organization, connectivity, and real-world hustles or projects—alongside formal education so practical talent is never filtered out by paper-only screening.",
    ],
    links: [
      { label: "Start Diagnostic", href: "/assessment" },
      { label: "Explore Skills Modules", href: "/skills" },
    ],
    keywords: [
      "degree",
      "tvet",
      "diploma",
      "self-taught",
      "a-level",
      "experience",
      "qualifications",
    ],
  },
  {
    id: "rate-all-six-sliders",
    category: "diagnostic-pathway",
    question:
      "Why do I have to actively move or rate all 6 sliders in the Career Diagnostic?",
    answer: [
      "In earlier versions, unmoved sliders defaulted silently to zero, making it hard to tell whether a candidate truly rated a skill at 0 or simply skipped the question. To keep your readiness score fair and accurate, the diagnostic tracks which sliders you have actively rated.",
      "You are free to set any slider to 0 if that honestly reflects your starting point—just click or adjust every slider across all 6 factors before generating your pathway.",
    ],
    links: [{ label: "Open Career Diagnostic", href: "/assessment" }],
    keywords: [
      "6-factor",
      "sliders",
      "remaining",
      "rate all",
      "diagnostic questions",
      "zero",
    ],
  },
  {
    id: "ai-readiness-tiers-and-appeals",
    category: "diagnostic-pathway",
    question:
      "How does the AI Readiness Tier work, why might I not qualify yet, and can I appeal?",
    answer: [
      "After your diagnostic, UTARE classifies your current readiness into one of three tracks: Market-Ready (Direct Placement), Bridge-Ready (Hub + Rapid Upskilling), or Foundation Track (Hardware Bridge + Intensive Coaching).",
      "For transparency under Kutunga Safety by Design, the 'AI Qualification Decision' card on both /assessment and /pathway explicitly lists what you currently qualify for, the exact reasons why you do not yet qualify for higher tiers (for example, missing laptop/solar backup or a sub-score below threshold), and concrete steps to unlock the next tier.",
    ],
    bullets: [
      "AI outputs are strictly advisory and never permanently bar you from applying to roles.",
      "You can retake the diagnostic anytime after upgrading your skills or securing Partner Hub access.",
      "If you believe an AI readiness classification is unfair or inaccurate, you can request a human review from Bheki Ndlovu (Human Decision Review & Appeals Lead) via our Contact page.",
    ],
    links: [
      { label: "View My AI Pathway", href: "/pathway" },
      { label: "Request Human Review / Appeal", href: "/contact" },
    ],
    keywords: [
      "readiness tier",
      "market-ready",
      "bridge-ready",
      "foundation track",
      "not qualify",
      "appeal",
      "Bheki Ndlovu",
      "ai decision",
    ],
  },
  {
    id: "weak-network-fallback",
    category: "diagnostic-pathway",
    question:
      "What happens if my mobile data drops or the Gemini AI service times out while generating my pathway?",
    answer: [
      "UTARE uses Google Gemini 2.5 Flash with strict JSON schema output for fast synthesis on mobile connections. However, if your 3G/4G signal fluctuates or the AI endpoint times out, our built-in deterministic fallback engine takes over automatically.",
      "Your 90-day 3-phase roadmap, matched Zimbabwean industry coach, and nearest Partner Innovation Hub still generate immediately—ensuring zero dead ends or lost form entries.",
    ],
    links: [{ label: "Open AI Pathway", href: "/pathway" }],
    keywords: [
      "gemini",
      "3g",
      "timeout",
      "fallback",
      "slow internet",
      "offline",
      "90-day",
    ],
  },
  {
    id: "no-income-survey-fields",
    category: "diagnostic-pathway",
    question:
      "Why doesn't UTARE ask for my current income bracket or personal household status during intake?",
    answer: [
      "Following data-minimization rules under Zimbabwe's Cyber and Data Protection Act [Chapter 12:07] and Kutunga Safety by Design, we removed unrelated income and employment-status survey fields from candidate onboarding.",
      "The intake focuses strictly on what helps you work remotely: your qualifications, skills, remote independence, and whether you need full or backup access to a solar-powered Partner Hub.",
    ],
    links: [
      { label: "Start Diagnostic", href: "/assessment" },
      { label: "Read Data Policy", href: "/data-policy" },
    ],
    keywords: [
      "income bracket",
      "data minimization",
      "survey fields",
      "kutunga",
      "remote readiness",
    ],
  },

  // 3. CV Studio, Credentials & Applications
  {
    id: "anti-ai-slop-cv-studio",
    category: "cv-applications",
    question:
      "How does the CV & Application Letter Studio avoid fake details and generic 'AI slop'?",
    answer: [
      "Recruiters reject resumes stuffed with robotic clichés like 'spearheaded dynamic synergies in today's fast-paced world' or AI-invented job histories. UTARE's CV Studio (/jobs) strictly grounds every CV and Zimbabwean formal business application letter in the education, work, and project facts you verify.",
      "Before you download or apply, our Anti-AI-Slop Humanizer scans your draft against 45+ banned AI clichés, rewrites weak phrasing into clear natural English, and displays a 0–100 Human Tone Score for both your CV and cover letter.",
    ],
    bullets: [
      "One-click downloads: Word (.docx), Print / Save PDF (A4), or Copy Plain Text.",
      "Switch to the '3. Edit Candidate Work & Education Facts' tab anytime to customize your exact roles, dates, and accomplishments.",
      "Every generated CV and cover letter is automatically saved with version history in My Workspace.",
    ],
    links: [{ label: "Open CV & Cover Letter Studio", href: "/jobs" }],
    keywords: [
      "cv studio",
      "anti-ai-slop",
      "humanizer",
      "human tone score",
      "docx",
      "pdf",
      "cover letter",
      "hallucinated",
    ],
  },
  {
    id: "profile-photo-and-credential-vault",
    category: "cv-applications",
    question:
      "Can I include my photo on my CV and upload my degrees or certificates safely?",
    answer: [
      "Yes. In My Workspace (/account), click the camera icon on your profile avatar to upload a portrait photo (compressed automatically in your browser so it uses minimal mobile data). You control a dedicated checkbox—'Include my profile photo on generated CVs (.docx & PDF)'—so you decide whether your photo appears in the CV Studio preview, PDF printouts, and Word .docx exports.",
      "You can also upload academic degrees, transcripts, professional certificates, existing CVs, and portfolios (PDF, PNG, JPG, DOC, or DOCX) into the Versioned Credential Vault. Re-uploading a document with the same category and title automatically creates v2, v3, and so on while keeping previous versions intact.",
    ],
    links: [
      { label: "Open My Workspace", href: "/account" },
      { label: "Open CV Studio", href: "/jobs" },
    ],
    keywords: [
      "profile photo",
      "cv photo",
      "includePhotoOnCv",
      "credential vault",
      "versioned",
      "certificates",
      "degrees",
      "upload",
    ],
  },
  {
    id: "employer-sharing-consent-toggle",
    category: "cv-applications",
    question:
      "What can an employer see when I apply, and can I withdraw or pause sharing later?",
    answer: [
      "Nothing is shared automatically. When submitting an application in the CV Studio (/jobs), you must explicitly toggle ON consent to share your profile summary, tailored CV, cover letter, and attached credentials with that employer.",
      "Even after you apply, you stay in control: open My Workspace (/account) at any time to pause sharing (which hides your application from that employer's portal) or resume sharing whenever you choose.",
    ],
    bullets: [
      "Never shared with employers: your private phone number, home power hours, internet constraints, internal diagnostic sub-scores, or Partner Hub bookings.",
      "Only employers who own the specific job listing can view consented applicants for that role.",
    ],
    links: [
      { label: "Manage Applications in Workspace", href: "/account" },
      { label: "Read Data Policy", href: "/data-policy" },
    ],
    keywords: [
      "consent toggle",
      "pause sharing",
      "employer visibility",
      "private phone",
      "application",
    ],
  },

  // 4. Partner Hubs, Smartphones & Payments
  {
    id: "smartphone-only-and-load-shedding",
    category: "hubs-payments",
    question:
      "I only have a smartphone and deal with load-shedding—how can I complete remote work?",
    answer: [
      "UTARE is built smartphone-first: every page uses lightweight layouts, zero horizontal scroll, and thumb-friendly touch targets so you can register, finish your diagnostic, generate Word (.docx) CVs, and reserve a workspace right from an Android or iOS phone.",
      "To bridge the hardware and electricity gap, our Partner Innovation Hubs across Harare, Bulawayo, Mutare, Gweru, Masvingo, and Chinhoyi provide 8–10kVA solar-inverter power backups, dual-redundant Starlink + terrestrial fiber connectivity, quiet workstations, and loaner laptops.",
    ],
    bullets: [
      "Use the searchable city selector on signup or diagnostic to pick any Zimbabwean town, growth point, custom location, or diaspora location.",
      "Reserve a hub workstation directly from /hubs or your /pathway page.",
    ],
    links: [
      { label: "Explore Partner Hubs", href: "/hubs" },
      { label: "Start Diagnostic", href: "/assessment" },
    ],
    keywords: [
      "smartphone",
      "load-shedding",
      "solar",
      "starlink",
      "laptop",
      "partner hub",
      "harare",
      "bulawayo",
      "mutare",
      "gweru",
      "masvingo",
      "chinhoyi",
    ],
  },
  {
    id: "cost-and-sustainability",
    category: "hubs-payments",
    question: "How much does UTARE cost for jobseekers and students?",
    answer: [
      "UTARE is 100% free ($0.00) for candidates and jobseekers—there are zero registration fees, zero CV or Word export fees, zero course fees, and zero hidden salary deductions.",
      "We sustain the ecosystem through a B2B employer success placement fee (10% on verified hires, compared to 20–30% charged by traditional agencies), commercial corporate/diaspora co-working passes at Partner Hubs, and institutional/CSR training partnerships.",
    ],
    links: [
      { label: "About Our Mission", href: "/about" },
      { label: "For Employers", href: "/employers" },
    ],
    keywords: [
      "free",
      "cost",
      "price",
      "fee",
      "monetization",
      "10%",
      "jobseeker",
    ],
  },
  {
    id: "international-usd-payments",
    category: "hubs-payments",
    question:
      "How do remote workers in Zimbabwe receive international USD payments safely?",
    answer: [
      "Every curated remote listing on UTARE must declare a transparent USD monthly compensation range and at least one compliant cross-border payment rail—such as Deel, Payoneer, Wise, or direct USD Nostro bank transfers.",
      "Through our career pathways and Skills Development modules, candidates also receive practical guidance on setting up compliant remote contractor payouts and avoiding informal middleman fees.",
    ],
    links: [
      { label: "Browse Verified Opportunities", href: "/opportunities" },
      { label: "Explore Skills Modules", href: "/skills" },
    ],
    keywords: [
      "deel",
      "payoneer",
      "wise",
      "nostro",
      "usd",
      "paid",
      "payment rails",
      "currency",
    ],
  },

  // 5. Safety, Anti-Scam & Data Privacy
  {
    id: "report-scam-job-listings",
    category: "safety-privacy",
    question:
      "How does UTARE protect against fake jobs, and what happens if I report a suspicious listing?",
    answer: [
      "Every employer account undergoes verification before unrestricted publishing, roles must disclose USD compensation and supported payment rails, and any request for an upfront 'application fee', 'interview deposit', or 'background check payment' violates our zero-fee rule.",
      "If you ever spot a suspicious job in the CV Studio & Remote Jobs board (/jobs), click 'Report Listing' while signed in. Submitting a report immediately removes the listing from the public job board so no one else can apply to it, and escalates it exclusively to platform Superusers (led by Safeguarding Lead Stewart Mangezi) to investigate before either permanently deleting it or restoring it if cleared.",
    ],
    links: [
      { label: "Browse Remote Jobs", href: "/jobs" },
      { label: "Contact Safeguarding Lead", href: "/contact" },
    ],
    keywords: [
      "scam",
      "fake job",
      "report listing",
      "superuser",
      "upfront fee",
      "phishing",
      "Stewart Mangezi",
      "safety",
    ],
  },
  {
    id: "zimbabwe-data-protection-compliance",
    category: "safety-privacy",
    question:
      "How does UTARE comply with Zimbabwe's Cyber and Data Protection Act and protect my information?",
    answer: [
      "UTARE processes personal data in alignment with Zimbabwe's Cyber and Data Protection Act [Chapter 12:07] and Statutory Instrument 155 of 2024 (overseen by POTRAZ), alongside GDPR-aligned principles of consent, purpose limitation, and data minimization.",
      "All personal details are collected strictly on this authenticated web platform (never through unencrypted third-party messaging bots), passwords use salted PBKDF2/scrypt hashing, sessions use cryptographically signed HTTP-only cookies, and any high-risk personal data breach triggers immediate containment, POTRAZ notification within 24 hours, and prompt user notice.",
    ],
    links: [{ label: "Read Full Data & Privacy Policy", href: "/data-policy" }],
    keywords: [
      "potraz",
      "chapter 12:07",
      "si 155",
      "gdpr",
      "privacy",
      "cyber",
      "breach",
      "whatsapp bot",
      "security",
    ],
  },
  {
    id: "inactivity-retention-and-self-delete",
    category: "safety-privacy",
    question:
      "How long is my data kept if I stop using UTARE, and how can I delete my account completely?",
    answer: [
      "Under our 1-Year Inactivity Policy, if your account records 365 days of inactivity, you will be prompted to sign back in and confirm whether you want to keep your account active. We send at least 3 reminder emails to your registered address before any deplatforming or deletion occurs—and simply logging in resets the inactivity window.",
      "You can also permanently erase your account at any time while signed in: open My Workspace (/account), expand 'Data Policy & Account Deletion', review the notice, and type delete to wipe your account, diagnostic, pathway, uploaded documents, tailored CVs, and applications from the database.",
    ],
    bullets: [
      "Special-circumstance erasure (for example, if a user has passed on): authorized family members or representatives can contact Superuser Stewart Mangezi at utarezemai@gmail.com or via /contact for complete erasure on request.",
    ],
    links: [
      { label: "Manage Account Deletion", href: "/account" },
      { label: "Read Data Policy", href: "/data-policy" },
      { label: "Contact Us", href: "/contact" },
    ],
    keywords: [
      "delete account",
      "self-delete",
      "inactivity",
      "1 year",
      "365 days",
      "3 notices",
      "bereavement",
      "erasure",
    ],
  },

  // 6. For Employers & Hiring Partners
  {
    id: "employer-registration-and-verification",
    category: "employers",
    question:
      "How do employers register, get verified, and post remote or hybrid opportunities?",
    answer: [
      "Organisations can create an Employer account via Create Account → 'I am an Employer' (/login?tab=register&role=employer) or submit an enrolment from the For Employers page (/employers). After confirming your email address, an administrator verifies your organisation once.",
      "Once verified, every role you post from your scoped Employer Portal (/employer) auto-publishes with transparent USD compensation, supported payment rails, optional Company Website URLs, external career/reference links, and shared role specification documents.",
    ],
    links: [
      { label: "For Employers Overview", href: "/employers" },
      { label: "Create Employer Account", href: "/login?tab=register&role=employer" },
      { label: "Open Employer Portal", href: "/employer" },
    ],
    keywords: [
      "employer",
      "hiring",
      "company verification",
      "post job",
      "auto-publish",
      "role documents",
    ],
  },
  {
    id: "employer-ai-ranking-and-feedback",
    category: "employers",
    question:
      "How does AI candidate ranking work in the Employer Portal, and is rejection feedback required?",
    answer: [
      "In the Employer Portal (/employer), consented applicants for each of your jobs are scored automatically (0–100% AI Fit) and grouped into tiers (Top Match, Strong Contender, Developing Fit) alongside matched skills, verified credential download links, tailored CV and cover letter previews, and suggested interview questions.",
      "Employers always remain the final human decision-makers. When updating an applicant's status (Under Review, Shortlisted, Hired, or Rejected), adding a written feedback note is completely optional—employers reserve the right to provide or withhold specific application feedback.",
    ],
    links: [
      { label: "Open Employer Portal", href: "/employer" },
      { label: "Read Data Policy", href: "/data-policy" },
    ],
    keywords: [
      "ai fit",
      "applicant ranking",
      "shortlist",
      "rejection feedback",
      "interview questions",
      "scoped",
    ],
  },

  // 7. Accessibility, Audio & Navigation
  {
    id: "audio-walkthrough-and-flow-demo",
    category: "accessibility-navigation",
    question:
      "How do the Audio Overview and 2-Min Flow Demo work, and how do I stop or pause playback?",
    answer: [
      "Every page features an Assistive Toolbar directly below the main header and inside the footer. Clicking 'Audio Overview' opens a zero-bandwidth browser voice walkthrough covering 4 short chapters (Welcome, Diagnostic, CV Studio, and Hubs & Community) with adjustable speed (0.85x to 1.5x), natural voice accent selection, and a synchronized read-along transcript.",
      "Whenever audio is playing, Pause/Resume and Stop buttons stay visible right in the top and footer toolbars, and audio stops automatically if you navigate to another page or finish the final chapter. Prefer a visual walkthrough? Click 'Flow Demo' for an interactive 5-step visual platform tour with Closed Captions (CC).",
    ],
    links: [{ label: "Try How It Works", href: "/how-it-works" }],
    keywords: [
      "audio",
      "voice",
      "stop audio",
      "pause",
      "flow demo",
      "video walkthrough",
      "captions",
      "transcript",
    ],
  },
  {
    id: "accessibility-settings-and-navigation",
    category: "accessibility-navigation",
    question:
      "What language, screen-reader, disability, and low-data/offline features are built in?",
    answer: [
      "UTARE supports English, ChiShona, and isiNdebele via the Language switcher in the top Assistive Toolbar and Accessibility panel, automatically updating the page's screen-reader language tag and Audio Overview transcripts.",
      "For users with visual, motor, or cognitive disabilities, the platform is built with semantic landmarks, keyboard navigation (Tab, Enter, Escape, Skip to main content), ARIA live regions for NVDA, JAWS, VoiceOver, and Android TalkBack, plus WCAG AAA High Contrast, 4 Colorblind filters, 130% text scaling, Dyslexia-friendly spacing, and Reduced Motion.",
      "UTARE is lightweight for smartphones on 3G/4G low-data bundles, auto-saves diagnostic drafts locally on your device if power or data cuts out, and displays an offline status banner until your connection returns.",
    ],
    links: [
      { label: "Home Overview", href: "/" },
      { label: "Contact Accessibility Support", href: "/contact" },
    ],
    keywords: [
      "accessibility",
      "high contrast",
      "colorblind",
      "dyslexic",
      "font size",
      "breadcrumb",
      "back button",
      "mobile",
      "shona",
      "ndebele",
      "screen reader",
      "nvda",
      "talkback",
      "voiceover",
      "disability",
      "low data",
      "offline",
    ],
  },
];

export function filterFaqItems(
  items: FaqItem[],
  category: FaqCategoryId | "all",
  query: string
): FaqItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  const categoryLabels = new Map(
    FAQ_CATEGORIES.map((cat) => [cat.id, cat.label.toLowerCase()])
  );

  return items.filter((item) => {
    if (category !== "all" && item.category !== category) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.question,
      categoryLabels.get(item.category) || "",
      ...item.answer,
      ...(item.bullets || []),
      ...item.keywords,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export interface JourneyFaqGroup {
  heading: string;
  subtitle: string;
  categoryHref: string;
  items: FaqItem[];
}

const FAQ_ITEM_BY_ID = new Map(FAQ_ITEMS.map((item) => [item.id, item]));

function pickFaqItems(ids: string[]): FaqItem[] {
  return ids
    .map((id) => FAQ_ITEM_BY_ID.get(id))
    .filter((item): item is FaqItem => Boolean(item));
}

export function getJourneyFaqsForPath(
  pathname: string
): JourneyFaqGroup | null {
  const normalized =
    pathname && pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname || "/";

  if (normalized === "/faq" || normalized.startsWith("/faq/")) {
    return null;
  }

  if (normalized === "/login" || normalized.startsWith("/auth")) {
    return {
      heading: "Quick Answers for Sign In, Verification & Passwords",
      subtitle:
        "Stuck creating an account, confirming your email, or resetting a password? Get instant answers right here.",
      categoryHref: "/faq?category=login-accounts",
      items: pickFaqItems([
        "create-account-email-confirmation",
        "google-sign-in-oauth",
        "missing-or-expired-verification",
        "password-requirements",
        "forgot-or-change-password",
        "unified-login-and-roles",
      ]),
    };
  }

  if (normalized === "/assessment" || normalized === "/pathway") {
    return {
      heading: "Quick Answers for Your Diagnostic & AI Career Pathway",
      subtitle:
        "Learn how readiness tiers work, why all 6 sliders matter, and how to update your diagnostic or request a human review.",
      categoryHref: "/faq?category=diagnostic-pathway",
      items: pickFaqItems([
        "qualifications-required",
        "rate-all-six-sliders",
        "ai-readiness-tiers-and-appeals",
        "weak-network-fallback",
      ]),
    };
  }

  if (normalized === "/jobs") {
    return {
      heading: "Quick Answers for CV Studio, Applications & Safety",
      subtitle:
        "Understand our Anti-AI-Slop Humanizer, employer sharing consent, CV photos, and one-click scam reporting.",
      categoryHref: "/faq?category=cv-applications",
      items: pickFaqItems([
        "anti-ai-slop-cv-studio",
        "employer-sharing-consent-toggle",
        "profile-photo-and-credential-vault",
        "report-scam-job-listings",
      ]),
    };
  }

  if (normalized === "/account") {
    return {
      heading: "Quick Answers for Your Workspace, Credentials & Privacy",
      subtitle:
        "Manage your password, versioned degrees and certificates, CV photo setting, employer sharing, or account deletion.",
      categoryHref: "/faq?category=cv-applications",
      items: pickFaqItems([
        "forgot-or-change-password",
        "profile-photo-and-credential-vault",
        "employer-sharing-consent-toggle",
        "inactivity-retention-and-self-delete",
      ]),
    };
  }

  if (
    normalized === "/hubs" ||
    normalized === "/opportunities" ||
    normalized === "/skills"
  ) {
    return {
      heading: "Quick Answers for Partner Hubs, Smartphones & USD Payouts",
      subtitle:
        "See how solar-backed hubs solve load-shedding, why UTARE is free for jobseekers, and how remote payouts work.",
      categoryHref: "/faq?category=hubs-payments",
      items: pickFaqItems([
        "smartphone-only-and-load-shedding",
        "cost-and-sustainability",
        "international-usd-payments",
        "report-scam-job-listings",
      ]),
    };
  }

  if (normalized === "/employer" || normalized === "/employers") {
    return {
      heading: "Quick Answers for Employers & Hiring Partners",
      subtitle:
        "How company verification, scoped applicant review, AI fit ranking, and candidate privacy protections work.",
      categoryHref: "/faq?category=employers",
      items: pickFaqItems([
        "employer-registration-and-verification",
        "employer-ai-ranking-and-feedback",
        "employer-sharing-consent-toggle",
      ]),
    };
  }

  if (normalized === "/data-policy" || normalized === "/contact") {
    return {
      heading: "Quick Answers on Data Privacy, Retention & Scam Reporting",
      subtitle:
        "Key protections under Zimbabwe's Cyber and Data Protection Act [Chapter 12:07] and SI 155 of 2024.",
      categoryHref: "/faq?category=safety-privacy",
      items: pickFaqItems([
        "zimbabwe-data-protection-compliance",
        "inactivity-retention-and-self-delete",
        "report-scam-job-listings",
      ]),
    };
  }

  return {
    heading: "Frequently Asked Questions Along Your Journey",
    subtitle:
      "Quick answers about signing up, resetting passwords, solar Partner Hubs, grounded CVs, scam protection, and data control.",
    categoryHref: "/faq",
    items: pickFaqItems([
      "create-account-email-confirmation",
      "forgot-or-change-password",
      "smartphone-only-and-load-shedding",
      "anti-ai-slop-cv-studio",
      "report-scam-job-listings",
      "inactivity-retention-and-self-delete",
    ]),
  };
}
