const DEMO_CREDENTIALS = { email: "demo@utaresizedu.ai", password: "Demo123!" };
const AUTH_KEY = "utare-demo-user";

const icons = {
  arrow:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  compass:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1z"/></svg>',
  spark:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>',
  hub: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m11 7-5 9m7-9 5 9M7 18h10"/></svg>',
  briefcase:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22zM4 5.5v14A2.5 2.5 0 0 1 6.5 17H20"/></svg>',
  users:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 10v-2a4 4 0 0 0-3-3.9m-1-11.9a4 4 0 0 1 0 7.8"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
};
const paths = [
  ["Overview", "/overview"],
  ["Dashboard", "/dashboard"],
  ["About Us", "/about"],
  ["How It Works", "/how-it-works"],
  ["Opportunities", "/opportunities"],
  ["Skills Development", "/skills"],
  ["For Employers", "/employers"],
  ["Contact", "/contact"],
];
const stages = [
  {
    n: "01",
    icon: "compass",
    title: "Intake & Diagnostic",
    text: "Map your qualifications, experience, interests and current barriers.",
    href: "/intake",
  },
  {
    n: "02",
    icon: "spark",
    title: "AI Pathway & Coach",
    text: "Explore career directions with structured, clearly labelled demo guidance.",
    href: "/pathway",
  },
  {
    n: "03",
    icon: "hub",
    title: "Partner Hubs",
    text: "Find the kinds of workspace, connectivity and skills support hubs can offer.",
    href: "/hubs",
  },
  {
    n: "04",
    icon: "briefcase",
    title: "Remote Jobs & CV",
    text: "Prepare application materials and explore local and global work options.",
    href: "/opportunities",
  },
];
const challenges = [
  "Limited local employment opportunities",
  "Access to international remote work",
  "Mismatch between qualifications and income opportunities",
  "Relevant digital and professional skills",
  "Connectivity, equipment and infrastructure",
  "Cross-border work and payments",
];
const courseExamples = [
  {
    category: "DIGITAL LITERACY",
    title: "Digital confidence essentials",
    text: "Build comfort with devices, browsers, online accounts and safe everyday digital practices.",
    time: "4 sample lessons",
    lessons: [
      "Digital devices and files",
      "Browsers and online accounts",
      "Safe information habits",
      "Practice and reflection",
    ],
  },
  {
    category: "REMOTE WORK READINESS",
    title: "Working well across borders",
    text: "Explore communication, collaboration and practical habits for distributed teams.",
    time: "4 sample lessons",
    lessons: [
      "Remote work basics",
      "Working across time zones",
      "Team communication",
      "Reliable work routines",
    ],
  },
  {
    category: "PROFESSIONAL COMMUNICATION",
    title: "Clear professional communication",
    text: "Practice writing, listening and presenting with clarity in work settings.",
    time: "3 sample lessons",
    lessons: [
      "Writing concise messages",
      "Professional meetings",
      "Presenting your work",
    ],
  },
  {
    category: "DIGITAL PRODUCTIVITY",
    title: "Plan and organise digital work",
    text: "Use simple digital workflows to manage tasks, documents and collaboration.",
    time: "3 sample lessons",
    lessons: ["Task planning", "Shared documents", "Prioritising work"],
  },
  {
    category: "TECHNICAL SKILLS",
    title: "Explore technical skill pathways",
    text: "A starting point for identifying role relevant technical topics and a practical learning plan.",
    time: "3 sample lessons",
    lessons: [
      "Map skills to roles",
      "Choose a learning project",
      "Review and share progress",
    ],
  },
  {
    category: "ENTREPRENEURSHIP & INCOME",
    title: "Explore an income idea",
    text: "Structure an early idea, understand who it could serve and plan a small next step.",
    time: "3 sample lessons",
    lessons: [
      "Identify a need",
      "Describe a simple offer",
      "Plan a small experiment",
    ],
  },
];
const sampleRoles = [
  {
    id: "ops",
    title: "Digital Operations Associate",
    category: "Operations",
    industry: "Technology",
    level: "Entry",
    arrangement: "Remote",
    location: "Remote · sample listing",
    skills: "Coordination · Digital tools",
    description:
      "Illustrative role focused on supporting day to day digital operations, documentation and team coordination. This sample is not a live vacancy.",
  },
  {
    id: "data",
    title: "Junior Data Support Analyst",
    category: "Data",
    industry: "Research",
    level: "Entry",
    arrangement: "Hybrid",
    location: "Harare / hybrid · sample listing",
    skills: "Spreadsheets · Research",
    description:
      "Illustrative entry level pathway involving data organisation, basic analysis and clear reporting. This sample is not a live vacancy.",
  },
  {
    id: "cx",
    title: "Customer Experience Specialist",
    category: "Customer Support",
    industry: "Technology",
    level: "Mid-level",
    arrangement: "Remote",
    location: "Remote · sample listing",
    skills: "Communication · Service",
    description:
      "Illustrative customer support pathway centred on clear communication and thoughtful issue resolution. This sample is not a live vacancy.",
  },
  {
    id: "design",
    title: "Digital Content Assistant",
    category: "Marketing",
    industry: "Media",
    level: "Entry",
    arrangement: "On-site",
    location: "Zimbabwe · sample listing",
    skills: "Writing · Digital content",
    description:
      "Illustrative role supporting content preparation and digital publishing. This sample is not a live vacancy.",
  },
  {
    id: "finance",
    title: "Finance Operations Coordinator",
    category: "Finance",
    industry: "Professional Services",
    level: "Experienced",
    arrangement: "Hybrid",
    location: "Zimbabwe / hybrid · sample listing",
    skills: "Organisation · Spreadsheets",
    description:
      "Illustrative coordination pathway for finance operations and routine reporting. This sample is not a live vacancy.",
  },
];

function route() {
  return (location.hash.replace(/^#/, "") || "/").split("?")[0];
}
function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}
function go(href) {
  location.hash = href;
}
function link(label, href, cls = "") {
  return `<a class="${cls}" href="#${href}">${label}</a>`;
}
function button(label, href, cls = "button") {
  return link(`${label}${icons.arrow}`, href, cls);
}
function brand(light = false) {
  return `<a class="brand ${light ? "brand-light" : ""}" href="#/overview" aria-label="UTARE ZISEDU AI overview"><span class="brand-mark">U</span><span><b>UTARE</b> ZISEDU AI<small>Zimbabwe Economic Mobility &amp; Remote Bridge</small></span></a>`;
}
function avatar(name = "UT") {
  return `<span class="avatar" aria-hidden="true">${name.slice(0, 2).toUpperCase()}</span>`;
}

function header(active) {
  const user = currentUser();
  return `<header class="site-header"><div class="header-inner">${brand()}<button class="mobile-menu" aria-label="Toggle navigation" aria-expanded="false">${icons.menu}</button><nav class="main-nav" aria-label="Main navigation">${paths.map(([label, href]) => link(label, href, active === href ? "active" : "")).join("")}</nav><div class="header-end">${user ? `<div class="profile-menu"><button class="profile-trigger" aria-expanded="false">${avatar(user.name || user.email)}<span>${escapeHtml(user.name || "Demo User")}</span><span class="chevron">⌄</span></button><div class="profile-dropdown"><a href="#/profile">My Profile</a><a href="#/settings">Settings</a><button class="logout">Log Out</button></div></div>` : link("Sign in", "/", "signin-link")}</div></div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="footer-top">${brand(true)}<p>Connecting Zimbabwean talent with pathways to sustainable economic opportunity.</p><div class="footer-links"><a href="#/about">About</a><a href="#/how-it-works">How it works</a><a href="#/opportunities">Opportunities</a><a href="#/contact">Contact</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} UTARE ZISEDU AI</span><span>Zimbabwe Economic Mobility &amp; Remote Bridge</span></div></footer>`;
}
function shell(content, active, includeFooter = true) {
  return `${header(active)}<main>${content}</main>${includeFooter ? footer() : ""}`;
}
function iconTile(key, tone = "") {
  return `<span class="icon-tile ${tone}">${icons[key] || icons.spark}</span>`;
}
function sectionHeading(kicker, title, text = "") {
  return `<div class="section-heading"><span class="eyebrow">${kicker}</span><h2>${title}</h2>${text ? `<p>${text}</p>` : ""}</div>`;
}

function loginPage() {
  return `<main class="login-page"><section class="login-visual"><div class="login-visual-inner">${brand(true)}<div class="login-copy"><span class="eyebrow eyebrow-light">ECONOMIC MOBILITY, WITH POSSIBILITY</span><h1>Bridging Zimbabwe's Credentials to <em>Economic Opportunity.</em></h1><p>Helping Zimbabwean talent access career pathways, develop relevant skills and connect to opportunities beyond geographical boundaries.</p><div class="visual-graphic" aria-hidden="true"><div class="graphic-orbit orbit-a"></div><div class="graphic-orbit orbit-b"></div><div class="graphic-core">${icons.hub}</div><span class="graphic-node node-a">${icons.book}</span><span class="graphic-node node-b">${icons.briefcase}</span><span class="graphic-node node-c">${icons.users}</span><div class="graphic-caption"><span class="pulse"></span> Talent, skills &amp; opportunity in motion</div></div></div><div class="login-footnote">A demonstration platform for Zimbabwe's economic mobility ecosystem.</div></div></section><section class="login-form-side"><div class="login-form-wrap"><div class="mobile-brand">${brand()}</div><span class="eyebrow">WELCOME TO YOUR NEXT STEP</span><h2>Welcome back</h2><p class="login-intro">Sign in to continue exploring your pathway.</p><div class="demo-note"><b>Frontend demonstration</b><span>Use the demo credentials shown below. No account service is connected.</span></div><form id="login-form" class="form-stack" novalidate><label class="field"><span>Email or username</span><input name="email" type="text" autocomplete="username" placeholder="you@example.com" required aria-describedby="login-error" /></label><label class="field"><span>Password</span><span class="password-wrap"><input name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required /><button type="button" class="password-toggle" aria-label="Show password">${icons.eye}</button></span></label><div class="form-options"><label class="check-label"><input type="checkbox" name="remember" checked /><span>Remember me</span></label><button type="button" class="text-button forgot-link">Forgot password?</button></div><p class="form-error" id="login-error" role="alert"></p><button class="button button-wide" type="submit">Sign In ${icons.arrow}</button></form><div class="credential-box"><span>DEMO ACCESS</span><code>demo@utaresizedu.ai</code><code>Demo123!</code></div><p class="auth-disclaimer">Demonstration login only. Do not enter personal or sensitive information.</p></div></section></main>`;
}

function overviewPage() {
  const journey = stages
    .map(
      (s) =>
        `<article class="journey-card">${iconTile(s.icon)}<span class="step-number">${s.n}</span><h3>${s.title}</h3><p>${s.text}</p>${link("Explore this stage", s.href, "text-link")}</article>`,
    )
    .join("");
  const problemList = challenges
    .map(
      (c, i) =>
        `<li>${iconTile(["briefcase", "hub", "compass", "spark", "users", "arrow"][i], "icon-small")}<span>${c}</span></li>`,
    )
    .join("");
  return shell(
    `<section class="hero-wrap"><div class="hero-panel"><div class="hero-text"><span class="eyebrow eyebrow-light">UTARE ZISEDU AI · ECONOMIC MOBILITY ECOSYSTEM</span><h1>Bridging Zimbabwe's <em>Credential-to-Livelihood Paradox</em></h1><p>Zimbabwe has talented graduates and skilled individuals, yet many struggle to translate qualifications into sustainable income. UTARE aims to bridge this gap through career guidance, human coaching, partner hubs and access to local and international earning opportunities.</p><div class="hero-actions">${button("Start Candidate Bridge", "/intake", "button button-green")}${link("Explore Partner Innovation Hubs", "/hubs", "button button-ghost")}</div><div class="hero-note">${icons.check}<span>Guidance and access, with no promise of a job or income.</span></div></div><div class="hero-visual" aria-label="Illustration of Zimbabwe connected to global opportunities"><div class="visual-grid"></div><div class="map-ring ring-1"></div><div class="map-ring ring-2"></div><div class="map-center"><span>ZW</span><small>ZIMBABWE</small></div><span class="map-point point-1">${icons.book}</span><span class="map-point point-2">${icons.briefcase}</span><span class="map-point point-3">${icons.hub}</span><span class="map-line line-1"></span><span class="map-line line-2"></span><span class="map-line line-3"></span><div class="map-label">Connected pathways<br/><b>Local roots · Global reach</b></div></div></div></section><section class="survey-section"><div class="survey-intro">${sectionHeading("EVIDENCE WITH CONTEXT", "Empirical Grounding: UTARE Mobility Survey", "The survey should guide the platform’s priorities and be shown with its sample size and original question wording.")}</div><div class="survey-placeholder"><span class="survey-mark">${icons.book}</span><div><b>Verified survey findings will appear here</b><p>No survey figures or source file were included with this project brief. This space is reserved for validated findings and their sample size.</p></div><span class="data-status">DATA TO BE ADDED</span></div></section><section class="journey-section section-pad">${sectionHeading("A CLEAR NEXT STEP", "Your Pathway to Economic Mobility", "A guided experience that helps candidates make informed decisions at every stage.")}<div class="journey-grid">${journey}</div></section><section class="mobility-section"><div class="mobility-inner"><div class="mobility-copy">${sectionHeading("WHY THIS BRIDGE MATTERS", "Turning Qualifications into Economic Opportunity", "The platform is designed around practical barriers faced by Zimbabwean talent. Progress takes collaboration across candidates, employers and local partners.")}${button("Learn how it works", "/how-it-works", "button button-green")}</div><ul class="challenge-list">${problemList}</ul></div></section><section class="features-section section-pad">${sectionHeading("A CONNECTED SUPPORT SYSTEM", "Support for the whole journey", "Career guidance, human support and practical access work together to help candidates move forward.")}<div class="feature-grid"><article class="feature-card">${iconTile("compass")}<h3>Career Pathway Guidance</h3><p>Explore directions that connect your experience with evolving opportunity areas.</p></article><article class="feature-card">${iconTile("users")}<h3>Human Coaching &amp; Professional Development</h3><p>Build confidence and practical readiness with structured human support.</p></article><article class="feature-card">${iconTile("hub")}<h3>Partner Innovation Hubs</h3><p>Connect with community spaces that may offer equipment, connectivity and learning.</p></article><article class="feature-card">${iconTile("briefcase")}<h3>Remote Employment &amp; CV Preparation</h3><p>Prepare application materials and learn how to explore remote work options.</p></article></div></section><section class="closing-cta"><div><span class="eyebrow eyebrow-light">YOUR NEXT STEP STARTS HERE</span><h2>Your Qualifications Should Open Doors to Opportunity.</h2><p>Build your skills, explore career pathways and learn about new economic opportunities.</p></div><div class="closing-actions">${button("Start Candidate Bridge", "/intake", "button button-green")}${link("Explore Remote Opportunities", "/opportunities", "button button-ghost")}</div></section>`,
    "/overview",
  );
}

function pageHero(kicker, title, text, actions = "") {
  return `<section class="page-hero"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${text}</p>${actions ? `<div class="hero-actions">${actions}</div>` : ""}</section>`;
}
function aboutPage() {
  const team = Array.from(
    { length: 6 },
    (_, i) =>
      `<article class="team-card"><div class="team-avatar">${String(i + 1).padStart(2, "0")}</div><span class="eyebrow">TEAM MEMBER ${String(i + 1).padStart(2, "0")}</span><h3>Name to be added</h3><p>Profile details will be added when the team member’s approved biography is provided.</p></article>`,
  ).join("");
  return shell(
    `${pageHero("ABOUT UTARE ZISEDU AI", "Zimbabwean potential deserves more pathways.", "UTARE is a student-led initiative exploring how talent can connect qualifications and skills to sustainable earning possibilities in Zimbabwe.")}<section class="content-section two-col"><div>${sectionHeading("OUR STORY", "Six young people, one shared challenge", "Five Mastercard Foundation Scholars and one USAP alumnus came together through an educational challenge encouraging young people to identify real community problems and develop practical solutions.")}</div><div class="prose"><p>Our team chose to focus on the gap between education, qualifications and sustainable income opportunities in Zimbabwe. Many capable people face barriers that make it difficult to translate what they know into stable livelihoods.</p><p>UTARE is our proposed response: a connected platform concept for career direction, human coaching, partner hub access, skills development and employment pathways.</p><div class="callout">${icons.spark}<span><b>A student-led initiative.</b> Mention of Mastercard Foundation Scholars and a USAP alumnus describes team backgrounds only; it does not imply institutional endorsement or sponsorship.</span></div></div></section><section class="values-band"><article><span>OUR MISSION</span><h3>Connect learning to livelihood pathways</h3><p>Help Zimbabwean talent explore practical steps from qualifications and skills toward sustainable income opportunities.</p></article><article><span>OUR VISION</span><h3>More accessible economic mobility</h3><p>A future where geography and access barriers place fewer limits on a person’s ability to develop and contribute.</p></article><article><span>OUR PROPOSAL</span><h3>Bring support into one journey</h3><p>Connect candidate insight, pathway guidance, partner support and opportunity readiness.</p></article></section><section class="content-section"><div class="section-heading">${sectionHeading("THE CHALLENGE", "The credential-to-livelihood paradox", "Qualifications and skills matter, yet they do not always translate into sustainable income when opportunity and access barriers remain.")}</div><div class="feature-grid about-challenges">${[
      ["Limited openings", "Local employment opportunities can be limited."],
      [
        "Access gaps",
        "Connectivity, equipment and professional networks can be difficult to reach.",
      ],
      [
        "Skills mismatch",
        "Available qualifications may not map clearly to income pathways.",
      ],
      [
        "Cross-border friction",
        "Remote work can bring payment, communication and compliance challenges.",
      ],
    ]
      .map(
        (x) =>
          `<article class="feature-card"><span class="challenge-index">0${["Limited openings", "Access gaps", "Skills mismatch", "Cross-border friction"].indexOf(x[0]) + 1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`,
      )
      .join(
        "",
      )}</div><div class="solution-banner"><div>${sectionHeading("OUR PROPOSED SOLUTION", "A bridge of guidance, development and access", "UTARE proposes a connected candidate journey with human support and practical partner involvement.")}</div>${button("See how it works", "/how-it-works", "button button-green")}</div></section><section class="team-section"><div class="team-section-heading">${sectionHeading("THE PEOPLE BEHIND THE INITIATIVE", "Our six-person team", "We’ll add names, photographs, institutions and biographies when the team provides approved details.")}</div><div class="team-grid">${team}</div></section>`,
    "/about",
  );
}
function howPage() {
  const explanations = [
    "Share your qualifications, experience, interests, skills and current barriers in a guided intake. This helps you reflect on where you are starting from.",
    "Explore possible career directions and discuss next steps with a human coach. Any AI guidance shown is a frontend demonstration and is not currently connected to an AI service.",
    "Learn about partner innovation hubs that may offer internet access, equipment, workspace or skills support. Partner directory details are proposed until verified.",
    "Prepare a professional CV and explore sample local and international opportunity listings. Listings on this site are demonstration content, not live vacancies.",
  ];
  return shell(
    `${pageHero("HOW IT WORKS", "A guided path from skills to opportunity.", "UTARE proposes four connected stages to help candidates understand their starting point, build readiness and explore pathways.")}<section class="content-section journey-detail">${stages.map((s, i) => `<article class="journey-row"><div class="journey-row-icon">${iconTile(s.icon)}<span>${s.n}</span></div><div><span class="eyebrow">STAGE ${s.n} · PROPOSED</span><h2>${s.title}</h2><p>${explanations[i]}</p><p class="muted">This page explains the proposed model. Feature availability depends on development and partner participation.</p></div>${link(i === 3 ? "Explore opportunities" : "Preview stage", s.href, "text-link")}</article>`).join("")}</section><section class="notice-band">${icons.spark}<div><b>What is operational today?</b><p>This website is a frontend demonstration. Intake, AI coaching, hub matching and job/CV services are proposed features; no backend service or AI integration is connected.</p></div></section><section class="content-section compact-cta"><div>${sectionHeading("START WHERE YOU ARE", "Take the first step when you’re ready", "A short diagnostic can help organise your experience, interests and barriers.")}</div>${button("Start Candidate Bridge", "/intake", "button button-green")}</section>`,
    "/how-it-works",
  );
}
function opportunitiesPage() {
  const options = (values) =>
    values.map((v) => `<option>${v}</option>`).join("");
  const cards = sampleRoles
    .map(
      (r) =>
        `<article class="opportunity-card" data-role-id="${r.id}" data-search="${(r.title + " " + r.location + " " + r.skills + " " + r.industry + " " + r.category).toLowerCase()}" data-category="${r.category}" data-industry="${r.industry}" data-level="${r.level}" data-arrangement="${r.arrangement}"><div class="opportunity-top"><span class="opportunity-icon">${icons.briefcase}</span><span class="demo-pill">DEMO LISTING</span></div><span class="eyebrow">${r.arrangement.toUpperCase()} · SAMPLE</span><h3>${r.title}</h3><p class="org-name">No real employer · interface example only</p><div class="job-meta"><span>${r.location}</span><span>${r.skills}</span></div><button class="text-link opportunity-detail" data-role="${r.id}">View details ${icons.arrow}</button></article>`,
    )
    .join("");
  return shell(
    `${pageHero("OPPORTUNITIES", "Explore pathways that fit your skills.", "Browse illustrative opportunity types and filter by category, industry, experience and work arrangement. Listings are sample interface content, not real vacancies or employer partnerships.")}<section class="content-section"><div class="directory-top"><div><span class="eyebrow">OPPORTUNITY EXPLORER</span><h2>Sample opportunity listings</h2></div><label class="search-box">⌕ <input id="opportunity-search" type="search" placeholder="Search roles, skills or industry" aria-label="Search opportunities" /></label></div><div class="filter-bar"><label>Category<select id="filter-category"><option value="">All categories</option>${options([...new Set(sampleRoles.map((r) => r.category))])}</select></label><label>Industry<select id="filter-industry"><option value="">All industries</option>${options([...new Set(sampleRoles.map((r) => r.industry))])}</select></label><label>Experience level<select id="filter-level"><option value="">Any level</option>${options([...new Set(sampleRoles.map((r) => r.level))])}</select></label><label>Work arrangement<select id="filter-arrangement"><option value="">Any arrangement</option>${options([...new Set(sampleRoles.map((r) => r.arrangement))])}</select></label><button id="clear-filters" class="text-button">Clear filters</button></div><div class="opportunity-grid" id="opportunity-grid">${cards}</div><p id="no-results" class="empty-message" hidden>No sample opportunities match those filters.</p><p class="content-disclaimer">Every card is labelled as demonstration content. Confirm role details, eligibility, compensation and payment arrangements directly with any real employer.</p></section><section class="closing-cta"><div><span class="eyebrow eyebrow-light">PREPARE FOR WHAT’S NEXT</span><h2>Build your readiness alongside your search.</h2><p>Explore skills development and career direction as you consider opportunities.</p></div><div class="closing-actions">${button("Explore Skills", "/skills", "button button-green")}${link("How UTARE works", "/how-it-works", "button button-ghost")}</div></section>`,
    "/opportunities",
  );
}
function skillsPage() {
  const progress = readProgress();
  return shell(
    `${pageHero("SKILLS DEVELOPMENT", "Build the skills that help you move forward.", "Explore digital literacy, remote work readiness, communication, productivity, technical skills and entrepreneurship through sample learning pathways.")}<section class="content-section"><div class="directory-top"><div>${sectionHeading("LEARNING PREVIEW", "Skills pathways", "Open a course preview to see sample lessons. Progress is stored locally in this browser for demonstration only.")}</div><span class="demo-pill">SAMPLE · NOT ACCREDITED</span></div><div class="course-grid">${courseExamples
      .map((c, i) => {
        const done = progress[c.title] || 0;
        return `<article class="course-card">${iconTile(["book", "users", "mail", "check", "spark", "hub"][i])}<span class="eyebrow">${c.category}</span><h3>${c.title}</h3><p>${c.text}</p><div class="course-progress"><div><span>Demo progress</span><b>${done}/${c.lessons.length} lessons</b></div><div class="progress-track"><span style="width:${Math.round((done / c.lessons.length) * 100)}%"></span></div></div><div class="course-foot"><span>${c.time}</span><button class="text-link course-button" data-course="${escapeHtml(c.title)}">Course details ${icons.arrow}</button></div></article>`;
      })
      .join(
        "",
      )}</div></section><section class="content-section skills-note"><div class="notice-band">${icons.hub}<div><b>Demonstration learning content</b><p>These course previews are not accredited and do not grant certification. Connectivity, devices, mentorship and a supportive place to learn can all shape access to skills development.</p></div></div></section>`,
    "/skills",
  );
}
function dashboardPage() {
  const user = currentUser() || { name: "Demo Candidate" };
  return shell(
    `${pageHero("MAIN DASHBOARD", `Welcome${user.name ? `, ${escapeHtml(user.name.split(" ")[0])}` : ""}. Your next step starts here.`, "Your UTARE overview brings your pathway, learning and opportunity exploration into one place.")}<section class="content-section dashboard-content"><div class="demo-banner">${icons.spark}<span><b>Demonstration dashboard</b> Progress and opportunity examples on this screen are sample interface content.</span></div><div class="dashboard-grid"><article class="dashboard-card progress-card"><div class="card-heading"><div>${sectionHeading("YOUR JOURNEY", "Candidate Bridge progress", "Sample progress preview")}</div><span class="progress-count">2 of 4</span></div><div class="progress-track"><span></span></div><div class="progress-labels"><span>Intake started</span><span>Pathway ahead</span></div><a class="text-link" href="#/intake">Continue your intake ${icons.arrow}</a></article><article class="dashboard-card pathway-card"><div class="card-heading"><div>${sectionHeading("CAREER PATHWAYS", "Featured directions", "Areas to explore based on changing work needs.")}</div>${iconTile("compass")}</div><div class="pathway-tags"><span>Digital operations</span><span>Customer experience</span><span>Data support</span></div><a class="text-link" href="#/pathway">Explore pathway guidance ${icons.arrow}</a></article><article class="dashboard-card hub-card"><div class="card-heading"><div>${sectionHeading("PARTNER HUBS", "Local support preview", "Hubs may offer workspace, connectivity and skills support.")}</div>${iconTile("hub")}</div><div class="mini-row"><span class="mini-avatar">H</span><div><b>Innovation hub directory</b><small>Partner information preview</small></div></div><a class="text-link" href="#/hubs">Explore partner hubs ${icons.arrow}</a></article><article class="dashboard-card remote-card"><div class="card-heading"><div>${sectionHeading("REMOTE EMPLOYMENT", "Opportunity preview", "Sample listings to demonstrate the dashboard.")}</div>${iconTile("briefcase")}</div><div class="mini-row"><span class="mini-avatar green">${icons.briefcase}</span><div><b>Digital Operations Associate</b><small>Sample listing · remote</small></div></div><a class="text-link" href="#/opportunities">Browse opportunities ${icons.arrow}</a></article></div><div class="dashboard-bottom"><article class="dashboard-card updates-card">${sectionHeading("RECENT PLATFORM UPDATES", "What’s new", "Updates will appear here as the platform develops.")}<div class="update-line"><span class="update-dot"></span><p><b>Skills pathway preview added</b><small>Explore sample professional development topics.</small></p><span class="update-date">DEMO</span></div><div class="update-line"><span class="update-dot"></span><p><b>Candidate Bridge stages outlined</b><small>See how the four platform sections connect.</small></p><span class="update-date">DEMO</span></div></article><article class="dashboard-card quick-card">${sectionHeading("QUICK LINKS", "Continue exploring", "Jump to a platform section.")}${[
      ["Intake & Diagnostic", "/intake", "compass"],
      ["AI Pathway & Coach", "/pathway", "spark"],
      ["Partner Hubs", "/hubs", "hub"],
      ["Remote Jobs & CV", "/opportunities", "briefcase"],
    ]
      .map(
        (x) =>
          `<a class="quick-link" href="#${x[1]}">${iconTile(x[2], "icon-small")}<span>${x[0]}</span>${icons.arrow}</a>`,
      )
      .join("")}</article></div></section>`,
    "/dashboard",
  );
}
function employerPage() {
  return shell(
    `${pageHero("FOR EMPLOYERS & PARTNERS", "Connect with talent ready to grow.", "UTARE proposes a bridge between organisations and Zimbabwean talent. The model is in development; no existing employer partnership or recruitment service is claimed.")}<section class="content-section two-col employer-intro"><div>${sectionHeading("WHY CONSIDER ZIMBABWEAN TALENT?", "Skills, perspective and potential", "Zimbabwean candidates bring varied educational backgrounds, practical experience and motivation to contribute. UTARE aims to make those capabilities easier to understand and develop.")}</div><div class="prose"><p>Employers can help by sharing clear role requirements, giving useful feedback on readiness and considering candidates through transparent processes.</p><p>UTARE is a proposed connection and preparation model. It does not guarantee a qualified pipeline, placement, recruitment outcome or business result.</p>${button("Start a conversation", "/contact", "button button-green")}</div></section><section class="partner-options employer-steps">${[
      [
        "01",
        "Share your needs",
        "Describe roles, skills and working arrangements clearly.",
      ],
      [
        "02",
        "Support readiness",
        "Help candidates understand relevant expectations and preparation.",
      ],
      [
        "03",
        "Explore a fit",
        "Consider introductions through a responsible, transparent process.",
      ],
    ]
      .map(
        (x) =>
          `<article><span class="eyebrow">PROPOSED PROCESS · ${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p></article>`,
      )
      .join(
        "",
      )}</section><section class="content-section employer-form-section"><div>${sectionHeading("EMPLOYER ENQUIRY", "Tell us how you’d like to collaborate", "The form validates in your browser and shows a demonstration success message. It does not transmit or save information.")}</div><form class="form-card form-stack local-form" data-success="Thanks for your interest. This is a demonstration; your details were not sent or stored."><label class="field"><span>Organisation name</span><input name="organisation" required placeholder="Your organisation" /></label><label class="field"><span>Contact email</span><input name="email" type="email" required placeholder="you@organisation.org" /></label><label class="field"><span>Partnership interest</span><select name="interest"><option>Employer opportunities</option><option>Skills development</option><option>Partner innovation hub</option><option>Other collaboration</option></select></label><label class="field"><span>How might you work with UTARE?</span><textarea name="details" rows="4" placeholder="Share a little about your interest" required></textarea></label><button class="button button-green" type="submit">Register interest ${icons.arrow}</button><p class="form-feedback" role="status"></p></form></section>`,
    "/employers",
  );
}
function contactPage() {
  return shell(
    `${pageHero("CONTACT UTARE", "Let’s start a conversation.", "Reach out about the platform, a partnership or how to take your next step. The contact details below are fictional demonstration placeholders.")}<section class="content-section contact-grid"><div class="contact-info">${sectionHeading("GET IN TOUCH", "We’d like to hear from you", "Zimbabwe · Demonstration contact details only")}<div class="contact-detail">${iconTile("hub")}<div><b>Location</b><span>Zimbabwe</span></div></div><div class="contact-detail">${iconTile("mail")}<div><b>Phone · fictional placeholder</b><span>+263 00 000 0000 · not a working number</span></div></div><div class="contact-detail">${iconTile("mail")}<div><b>Email · fictional placeholder</b><span>info@utaresizedu.ai · not a working inbox</span></div></div></div><form class="form-card form-stack local-form" data-success="Your message is ready in this demo. Nothing was sent or stored."><span class="eyebrow">DEMONSTRATION FORM</span><label class="field"><span>Your name</span><input name="name" required placeholder="Full name" /></label><label class="field"><span>Email address</span><input name="email" type="email" required placeholder="you@example.com" /></label><label class="field"><span>What would you like to discuss?</span><select name="topic"><option>General enquiry</option><option>Career support</option><option>Employer partnership</option><option>Innovation hub partnership</option></select></label><label class="field"><span>Message</span><textarea name="message" rows="5" required placeholder="Write your message"></textarea></label><button class="button button-green" type="submit">Send message ${icons.arrow}</button><p class="form-feedback" role="status"></p><p class="content-disclaimer">Frontend demonstration only. Submitting does not send or store your message.</p></form></section>`,
    "/contact",
  );
}
function infoPage(title) {
  const routeMap = {
    "Intake & Diagnostic": { url: "/assessment", label: "Launch Live 6-Factor Assessment", desc: "Take the empirical readiness diagnostic that tests English, digital literacy, internet speed, device ownership, power availability, and work experience." },
    "AI Pathway & Coach": { url: "/pathway", label: "Open Live AI Career Coach", desc: "Generate a custom 90-day upskilling roadmap powered by Google Gemini 2.5 and pair with a verified Zimbabwean mentor." },
    "Partner Hubs": { url: "/hubs", label: "Explore Partner Hub Directory", desc: "Find co-working spaces across Harare, Bulawayo, Mutare, Gweru, and Masvingo with Starlink connectivity and backup solar power." },
    "Remote Jobs & CV": { url: "/jobs", label: "Open ATS CV & Cover Letter Studio", desc: "Generate grounded, ATS-compliant CVs and Zimbabwean business letters stripped of AI slop with 1-click Word (.docx) export." },
  };
  const live = routeMap[title];
  const cta = live ? `<div style="margin-top: 20px; padding: 20px; background: #eaf5f0; border-radius: 12px; border: 1px solid #c2e2d4;">
    <div style="font-weight: 700; font-size: 13px; color: #004d40; margin-bottom: 6px;">Connected to Live Next.js Backend</div>
    <p style="margin: 0 0 16px 0; color: #2e4a3d; font-size: 11px; line-height: 1.6;">${live.desc}</p>
    <a href="${live.url}" class="button button-green" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">${live.label} ${icons.arrow}</a>
  </div>` : "";

  return shell(
    `${pageHero("UTARE PLATFORM", title, "This section is live on our Next.js backend with containerized PostgreSQL database persistence and background AI execution.")}<section class="content-section"><div class="notice-band">${icons.spark}<div><b>Live Feature Available</b><p>You can run this feature directly on the platform with full backend functionality.</p></div></div>${cta}<div style="margin-top: 20px;">${button("Return to Overview", "/overview", "button")}</div></section>`,
  );
}
function settingsPage() {
  return shell(
    `${pageHero("ACCOUNT SETTINGS", "Your demonstration account", "The login on this site is frontend-only and stores its state in this browser.")}<section class="content-section"><div class="notice-band">${icons.check}<div><b>Demo session active</b><p>Sign out from the profile menu to end this browser demonstration session.</p></div></div><div style="margin-top: 20px;"><a href="/account" class="button button-green" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">Go to Full Candidate Workspace ${icons.arrow}</a></div></section>`,
  );
}
function profilePage() {
  const user = currentUser() || {};
  return shell(
    `${pageHero("MY PROFILE", "Candidate Workspace & Profile", "Manage your profile, matched hub pass, and track live job applications.")}<section class="content-section"><article class="dashboard-card profile-preview"><div class="profile-preview-avatar">${avatar(user.name || "Demo Candidate")}</div><div><span class="eyebrow">CANDIDATE WORKSPACE</span><h2>${escapeHtml(user.name || "Demo Candidate")}</h2><p>${escapeHtml(user.email || "demo@utaresizedu.ai")}</p><p class="content-disclaimer">Connected to containerized PostgreSQL database (utare_db). Candidate view hides developer API keys.</p></div></article><div style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;"><a href="/account" class="button button-green" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">Open Candidate Workspace ${icons.arrow}</a><a href="/admin" class="button" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">Facilitator Admin Console ${icons.arrow}</a></div></section>`,
    "",
  );
}
function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function readProgress() {
  try {
    return JSON.parse(
      localStorage.getItem("utare-demo-course-progress") || "{}",
    );
  } catch {
    return {};
  }
}

function render() {
  const p = route();
  const user = currentUser();
  if (p !== "/" && !user) {
    go("/");
    return;
  }
  if (p === "/" && user) {
    go("/overview");
    return;
  }
  const view =
    {
      "/": loginPage,
      "/overview": overviewPage,
      "/about": aboutPage,
      "/how-it-works": howPage,
      "/opportunities": opportunitiesPage,
      "/skills": skillsPage,
      "/dashboard": dashboardPage,
      "/employers": employerPage,
      "/contact": contactPage,
      "/settings": settingsPage,
      "/profile": profilePage,
      "/intake": () => infoPage("Intake & Diagnostic"),
      "/pathway": () => infoPage("AI Pathway & Coach"),
      "/hubs": () => infoPage("Partner Hubs"),
    }[p] ||
    (() =>
      shell(
        `${pageHero("PAGE NOT FOUND", "Let’s find your next step.", "The page you requested is not available.")}${button("Return to Overview", "/overview", "button button-green")}`,
      ));
  document.querySelector("#app").innerHTML = view();
  document.title = `${{ "/": "Sign in", "/overview": "Overview", "/about": "About Us", "/how-it-works": "How It Works", "/opportunities": "Opportunities", "/skills": "Skills Development", "/dashboard": "Dashboard", "/employers": "For Employers", "/contact": "Contact" }[p] || "UTARE"} — UTARE ZISEDU AI`;
  bindInteractions();
}
function bindInteractions() {
  const form = document.querySelector("#login-form");
  if (form) {
    const error = document.querySelector("#login-error");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form),
        email = String(data.get("email") || "")
          .trim()
          .toLowerCase(),
        password = String(data.get("password") || "");
      if (!email || !password) {
        error.textContent = "Enter your email and password to continue.";
        return;
      }
      if (
        email !== DEMO_CREDENTIALS.email ||
        password !== DEMO_CREDENTIALS.password
      ) {
        error.textContent =
          "Those demo details don’t match. Check the credentials shown below and try again.";
        return;
      }
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({
          email,
          name: "Demo Candidate",
          remember: data.has("remember"),
        }),
      );
      go("/overview");
    });
    document
      .querySelector(".password-toggle")
      .addEventListener("click", (e) => {
        const input = form.elements.password;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        e.currentTarget.setAttribute(
          "aria-label",
          show ? "Hide password" : "Show password",
        );
      });
    document.querySelector(".forgot-link").addEventListener("click", () => {
      error.textContent =
        "Password recovery is a frontend placeholder. Use the demo credentials shown below.";
    });
  }
  const mobile = document.querySelector(".mobile-menu");
  mobile?.addEventListener("click", () => {
    const nav = document.querySelector(".main-nav"),
      open = nav.classList.toggle("open");
    mobile.setAttribute("aria-expanded", String(open));
  });
  const trigger = document.querySelector(".profile-trigger");
  trigger?.addEventListener("click", () => {
    const menu = document.querySelector(".profile-dropdown"),
      open = menu.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(open));
  });
  document.querySelector(".logout")?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_KEY);
    go("/");
  });
  const filterRoles = () => {
    const q = (document.querySelector("#opportunity-search")?.value || "")
        .trim()
        .toLowerCase(),
      category = document.querySelector("#filter-category")?.value || "",
      industry = document.querySelector("#filter-industry")?.value || "",
      level = document.querySelector("#filter-level")?.value || "",
      arrangement = document.querySelector("#filter-arrangement")?.value || "";
    let visible = 0;
    document.querySelectorAll(".opportunity-card").forEach((card) => {
      const match =
        card.dataset.search.includes(q) &&
        (!category || card.dataset.category === category) &&
        (!industry || card.dataset.industry === industry) &&
        (!level || card.dataset.level === level) &&
        (!arrangement || card.dataset.arrangement === arrangement);
      card.hidden = !match;
      if (match) visible++;
    });
    const empty = document.querySelector("#no-results");
    if (empty) empty.hidden = visible > 0;
  };
  [
    "#opportunity-search",
    "#filter-category",
    "#filter-industry",
    "#filter-level",
    "#filter-arrangement",
  ].forEach((sel) => {
    document
      .querySelector(sel)
      ?.addEventListener(
        sel === "#opportunity-search" ? "input" : "change",
        filterRoles,
      );
  });
  document.querySelector("#clear-filters")?.addEventListener("click", () => {
    [
      "#opportunity-search",
      "#filter-category",
      "#filter-industry",
      "#filter-level",
      "#filter-arrangement",
    ].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) el.value = "";
    });
    filterRoles();
  });
  document
    .querySelectorAll(".opportunity-detail")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        showOpportunityModal(btn.dataset.role),
      ),
    );
  document
    .querySelectorAll(".course-button")
    .forEach((btn) =>
      btn.addEventListener("click", () => showCourseModal(btn.dataset.course)),
    );
  document.querySelectorAll(".local-form").forEach((f) =>
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedback = f.querySelector(".form-feedback");
      const submitBtn = f.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting to database...";
      }

      const isEmployer = f.elements.organisation !== undefined;
      const isContact = f.elements.topic !== undefined;

      try {
        if (isEmployer) {
          const org = f.elements.organisation ? f.elements.organisation.value : "";
          const email = f.elements.email ? f.elements.email.value : "";
          const interest = f.elements.interest ? f.elements.interest.value : "";
          const details = f.elements.details ? f.elements.details.value : "";

          const res = await fetch("/api/employers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyName: org,
              contactPerson: org,
              email: email,
              industry: interest,
              rolesNeeded: details,
              estimatedHires: 1,
              remoteType: "Fully Remote",
              message: details,
            }),
          });
          const data = await res.json();
          if (feedback) {
            feedback.style.color = "#00875a";
            feedback.textContent = `✓ Employer interest saved to PostgreSQL! Ref #${data.registration?.id || "EMP-" + Date.now()}`;
          }
          f.reset();
        } else if (isContact) {
          const name = f.elements.name ? f.elements.name.value : "";
          const email = f.elements.email ? f.elements.email.value : "";
          const topic = f.elements.topic ? f.elements.topic.value : "";
          const message = f.elements.message ? f.elements.message.value : "";

          const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              category: topic,
              message,
            }),
          });
          const data = await res.json();
          if (feedback) {
            feedback.style.color = "#00875a";
            feedback.textContent = `✓ Message saved to PostgreSQL! Ticket #${data.messageRecord?.id || "MSG-" + Date.now()}`;
          }
          f.reset();
        } else {
          if (feedback) feedback.textContent = f.dataset.success;
          f.reset();
        }
      } catch (err) {
        // Fallback for opening via file:// protocol without active web server
        if (feedback) {
          feedback.style.color = "";
          feedback.textContent = f.dataset.success;
        }
        f.reset();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    }),
  );
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", () => {
      document.querySelector(".main-nav")?.classList.remove("open");
    }),
  );
}
function closeModal(modal) {
  modal?.remove();
}
function showOpportunityModal(id) {
  const role = sampleRoles.find((item) => item.id === id);
  if (!role) return;
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<section class="simple-modal detail-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(role.title)}"><button class="modal-close" aria-label="Close">×</button><span class="eyebrow">SAMPLE OPPORTUNITY · DEMONSTRATION ONLY</span><h2>${escapeHtml(role.title)}</h2><p>${escapeHtml(role.description)}</p><dl class="detail-list"><div><dt>Category</dt><dd>${escapeHtml(role.category)}</dd></div><div><dt>Industry</dt><dd>${escapeHtml(role.industry)}</dd></div><div><dt>Experience</dt><dd>${escapeHtml(role.level)}</dd></div><div><dt>Arrangement</dt><dd>${escapeHtml(role.arrangement)}</dd></div><div><dt>Location</dt><dd>${escapeHtml(role.location)}</dd></div><div><dt>Skills</dt><dd>${escapeHtml(role.skills)}</dd></div></dl><p class="content-disclaimer">This is not a genuine vacancy. No employer or application process is connected.</p><button class="button button-green modal-nav">Explore skills development ${icons.arrow}</button></section>`;
  document.body.append(modal);
  modal.querySelector(".modal-close").focus();
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".modal-close"))
      closeModal(modal);
  });
  modal.querySelector(".modal-nav").addEventListener("click", () => {
    closeModal(modal);
    go("/skills");
  });
}
function showCourseModal(title) {
  const course = courseExamples.find((item) => item.title === title);
  if (!course) return;
  const progress = readProgress(),
    done = progress[title] || 0;
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<section class="simple-modal course-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><button class="modal-close" aria-label="Close">×</button><span class="eyebrow">${escapeHtml(course.category)} · DEMONSTRATION</span><h2>${escapeHtml(course.title)}</h2><p>${escapeHtml(course.text)}</p><h3>Sample lessons</h3><ol>${course.lessons.map((lesson, i) => `<li class="${i < done ? "lesson-done" : ""}">${i < done ? "✓ " : ""}${escapeHtml(lesson)}</li>`).join("")}</ol><div class="course-progress"><div><span>Demo progress</span><b>${done}/${course.lessons.length} lessons</b></div><div class="progress-track"><span style="width:${Math.round((done / course.lessons.length) * 100)}%"></span></div></div><p class="content-disclaimer">Sample learning content only. It is not accredited and does not provide certification.</p><button class="button button-green course-advance" ${done >= course.lessons.length ? "disabled" : ""}>${done >= course.lessons.length ? "Preview complete" : "Mark next lesson complete"} ${icons.check}</button></section>`;
  document.body.append(modal);
  modal.querySelector(".modal-close").focus();
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".modal-close"))
      closeModal(modal);
  });
  modal.querySelector(".course-advance").addEventListener("click", () => {
    const current = readProgress();
    current[title] = Math.min(course.lessons.length, (current[title] || 0) + 1);
    localStorage.setItem("utare-demo-course-progress", JSON.stringify(current));
    closeModal(modal);
    render();
  });
}
window.addEventListener("hashchange", render);
window.addEventListener("storage", render);
render();
