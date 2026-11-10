// =============================================================================
// UTARE ZISEDU AI — Default CV Source Details Builder
// =============================================================================
// Populates realistic, editable Zimbabwean work history, education, and project
// notes from a CandidateProfile so candidates have a strong starting draft in
// the CV & Application Letter Studio that they can customize before downloading.
// =============================================================================

import { CandidateProfile, CvSourceDetails } from "@/types";

export function buildDefaultCvDetails(
  profile: CandidateProfile
): CvSourceDetails {
  const nameLower = profile.fullName.toLowerCase();

  if (nameLower.includes("chipo")) {
    return {
      headline: "Economics & Quantitative Research Analyst | Operations Support",
      linkedinOrPortfolio: "linkedin.com/in/chipo-nyamande-zw",
      aboutMe:
        "Economics graduate who enjoys turning messy spreadsheets and survey responses into clear written reports.",
      workHistory: [
        {
          role: "Graduate Research & Data Enumerator (Contract)",
          organization: "Zimbabwe Economic Policy Analysis Unit",
          location: "Harare",
          startDate: "Feb 2025",
          endDate: "Nov 2025",
          notes:
            "Cleaned household survey datasets covering 420 respondents in Excel; checked entries for missing values and outliers; drafted weekly summary tables and 4-page briefing notes for senior economists.",
        },
        {
          role: "Finance & Admin Intern",
          organization: "Harare SME Retailers Cooperative",
          location: "Harare",
          startDate: "Jan 2024",
          endDate: "Aug 2024",
          notes:
            "Reconciled daily cash and EcoCash receipts against supplier invoices; maintained stock tracker in Google Sheets; answered member queries via phone and WhatsApp.",
        },
      ],
      education: [
        {
          qualification: "BSc Honours in Economics & Statistics (2.1)",
          institution: "University of Zimbabwe (UZ)",
          year: "2024",
          details:
            "Final-year dissertation on informal-to-formal SME credit access in Harare.",
        },
      ],
      projects: [
        {
          name: "Harare Urban Transport & Food Basket Price Tracker",
          notes:
            "Built an Excel and Google Sheets workbook tracking monthly USD/ZiG price movements across 18 staple items; shared clean charts with local researchers.",
        },
      ],
      certifications: [
        "Utare ZISEDU Verified Digital Operations & Async Workflow Module",
        "Google Data Analytics Foundations",
      ],
      languages: ["English (Fluent)", "Shona (Native)"],
    };
  }

  if (nameLower.includes("tinashe")) {
    return {
      headline: "Full-Stack Developer & Data Automation Engineer (TypeScript / Python)",
      linkedinOrPortfolio: "github.com/tinashe-dube-zw",
      aboutMe:
        "Computer Science graduate who builds web apps, SQL reports, and Python automation scripts.",
      workHistory: [
        {
          role: "IT Support & Junior Systems Developer",
          organization: "Matabeleland Logistics & Freight",
          location: "Bulawayo",
          startDate: "Mar 2024",
          endDate: "Present",
          notes:
            "Replaced manual waybill spreadsheets with a Next.js and PostgreSQL tracking portal used by 14 dispatch clerks; wrote Python scripts to reconcile fuel logs; cut end-of-month reporting time from 3 days to 4 hours.",
        },
        {
          role: "Freelance Web & Database Technician",
          organization: "Self-Employed",
          location: "Bulawayo",
          startDate: "Jun 2023",
          endDate: "Feb 2024",
          notes:
            "Built websites and inventory databases for 5 local hardware and retail shops; set up automated daily backups.",
        },
      ],
      education: [
        {
          qualification: "BSc Honours in Computer Science",
          institution: "National University of Science and Technology (NUST)",
          year: "2023",
          details: "Capstone project on offline-first clinic patient records.",
        },
      ],
      projects: [
        {
          name: "Utare Inventory & Invoice API",
          notes:
            "Built a REST API in TypeScript, Next.js, and Supabase with automated unit tests in Vitest.",
        },
      ],
      certifications: [
        "Utare ZISEDU Verified Technical & AI QA Assessment",
        "PostgreSQL & SQL Performance Fundamentals",
      ],
      languages: ["English (Fluent)", "Ndebele (Native)", "Shona (Conversational)"],
    };
  }

  if (nameLower.includes("simba")) {
    return {
      headline: "Licensed Solar PV & Electrical Technician | Off-Grid & Commercial Systems",
      linkedinOrPortfolio: "utare-zisedu.org/artisans/simba-chitepo",
      aboutMe:
        "Hands-on electrical and solar technician with 3 years of site installation, inverter sizing, and fault-finding experience.",
      workHistory: [
        {
          role: "Lead Solar & Electrical Installer",
          organization: "Masvingo Off-Grid Energy Contractors",
          location: "Masvingo",
          startDate: "Jan 2023",
          endDate: "Present",
          notes:
            "Sized and installed 38 residential and clinic solar systems between 3kVA and 15kVA; wired lithium battery banks, changeover switches, and surge protection; trained 2 junior apprentices on safe earthing and cable sizing.",
        },
      ],
      education: [
        {
          qualification: "National Certificate in Electrical Power Engineering (Class 2 Skilled Worker)",
          institution: "Masvingo Polytechnic",
          year: "2022",
          details: "Practical trade test passed in single-phase and three-phase wiring.",
        },
      ],
      projects: [
        {
          name: "Rural Clinic 10kVA Solar & Cold-Chain Backup",
          notes:
            "Completed full load audit, panel mounting, and inverter commissioning for a rural clinic vaccine refrigerator circuit.",
        },
      ],
      certifications: [
        "Zimbabwe Manpower Development Fund (ZIMDEF) Trade Certificate",
        "Solar PV System Sizing & Safety Workshop",
      ],
      languages: ["English (Professional)", "Shona (Native)"],
    };
  }

  // Generic default built from whatever profile the user entered
  const topSkills = profile.currentSkills.slice(0, 4).join(", ") || profile.fieldOfStudy;
  return {
    headline: `${profile.fieldOfStudy} Specialist | ${profile.primaryGoal}`,
    linkedinOrPortfolio: "",
    aboutMe: `Trained in ${profile.fieldOfStudy} (${profile.highestQualification}) in ${profile.city}, Zimbabwe, with practical experience in ${topSkills}.`,
    workHistory: [
      {
        role:
          profile.employmentStatus === "Unemployed"
            ? `Graduate Project & Operations Assistant (${profile.fieldOfStudy})`
            : `Operations & Technical Associate (${profile.fieldOfStudy})`,
        organization: `${profile.city} Enterprise & Community Projects`,
        location: profile.city,
        startDate: "Jan 2024",
        endDate: "Present",
        notes: `Applied ${topSkills} to weekly deliverables and client records; maintained organized documentation and spreadsheets; collaborated with team members to meet deadlines reliably.`,
      },
    ],
    education: [
      {
        qualification: `${profile.highestQualification} in ${profile.fieldOfStudy}`,
        institution:
          profile.city === "Bulawayo"
            ? "National University of Science and Technology (NUST)"
            : profile.city === "Mutare"
            ? "Africa University / Mutare Polytechnic"
            : "University of Zimbabwe / Harare Polytechnic",
        year: "2024",
        details: `Completed coursework and practical assessments in ${profile.fieldOfStudy}.`,
      },
    ],
    projects: [
      {
        name: `${profile.fieldOfStudy} Applied Portfolio Deliverable`,
        notes: `Completed a practical case study demonstrating ${topSkills}; documented findings and process steps for review.`,
      },
    ],
    certifications: [
      `Utare ZISEDU Verified Readiness Assessment (${profile.city} Partner Hub)`,
    ],
    languages: ["English (Fluent)", "Shona / Ndebele (Native)"],
  };
}
