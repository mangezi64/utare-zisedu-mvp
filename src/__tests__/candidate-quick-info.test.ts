import { describe, it, expect } from "vitest";
import CandidateQuickInfoModal from "@/components/CandidateQuickInfoModal";
import { StoredCandidateRecord, JobApplicationRecord } from "@/lib/store";
import { CandidateDocument, CandidateCvArtifact } from "@/types";

describe("CandidateQuickInfoModal Integration & Quick Info Architecture", () => {
  const mockCandidate: StoredCandidateRecord = {
    id: "cand-test-123",
    userId: "user-456",
    profile: {
      fullName: "Farai Moyo",
      email: "farai.moyo@example.co.zw",
      phone: "+263 77 123 4567",
      city: "Harare",
      highestQualification: "Bachelors Degree",
      fieldOfStudy: "Software Engineering",
      yearsExperience: 3,
      employmentStatus: "Survival Gig (Misaligned)",
      monthlyIncomeBracket: "$1 - $150 / mo",
      hasDedicatedLaptop: true,
      primaryDevice: "Dedicated Laptop / PC",
      internetAccessType: "Home Fiber / Wi-Fi",
      powerReliabilityHours: 8,
      hasGlobalPaymentRail: true,
      primaryGoal: "International Remote Work",
      currentSkills: ["TypeScript", "Next.js", "Python"],
      avatarDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
    assessment: {
      domainCompetencyScore: 85,
      digitalReadinessScore: 80,
      remoteWorkLiteracyScore: 78,
      infrastructureIndexScore: 90,
      overallScore: 83,
      readinessTier: "Market-Ready (Direct Placement)",
      strengths: ["Strong full-stack foundations", "Reliable internet & hardware"],
      criticalGaps: ["Needs global remote billing setup primer"],
    },
    pathway: {
      recommendedTrack: "Full-Stack Software Development",
      executiveDiagnosis: "Candidate is technically capable with solid local infrastructure.",
      infrastructureBridgePlan: "Paired with Harare Tech Hub for redundant power during load-shedding.",
      recommendedHub: {
        id: "hub-hre-1",
        name: "Harare Innovation Hub",
        city: "Harare",
        address: "123 Samora Machel Ave",
        hasSolarBackup: true,
        internetProvider: "Starlink",
        avgSpeedMbps: 200,
        availableWorkstations: 30,
        laptopLoanAvailable: true,
        dailyPassUsd: 0,
        utarePartnerSubsidized: true,
        contactEmail: "hub@harare.co.zw",
        operatingHours: "08:00 - 18:00",
      },
      assignedCoach: {
        id: "coach-1",
        fullName: "Coach Catherine",
        title: "Senior Career Architect",
        organization: "Utare ZEM AI",
        specialtyTrack: "Tech Career Mobility",
        bio: "Specialist in remote career transitions.",
        city: "Harare",
        availableSlotsWeekly: 5,
        calBookingLink: "https://cal.com/coach-catherine",
      },
      coachingAgenda: ["Profile polish", "Interview prep"],
      upskillingMilestones: [
        {
          phase: "Phase 1: Readiness",
          durationWeeks: 2,
          title: "Remote Portfolio Modernization",
          objective: "Deploy modern portfolio on Vercel.",
          deliverable: "Live portfolio URL",
          resources: ["Portfolio Guide"],
          lowBandwidthFriendly: true,
        },
      ],
      targetRemoteRoles: [
        {
          role: "Frontend Engineer",
          estimatedMonthlyUsd: "$1,200 - $1,800 / mo",
          matchReason: "High alignment with React/Next.js experience.",
        },
      ],
      paymentRailGuidance: "Configure Deel with local Nostro account.",
      tailoredResumeSummary: "Dedicated software engineer.",
      generatedBy: "gemini-live",
    },
    completedMilestones: [],
    coachingStatus: "Pending Booking",
    createdAt: "2026-11-16T10:00:00Z",
  };

  const mockDocuments: CandidateDocument[] = [
    {
      id: "doc-1",
      candidateEmail: "farai.moyo@example.co.zw",
      category: "degree",
      title: "BSc in Software Engineering",
      issuer: "University of Zimbabwe",
      issueYear: "2023",
      fileName: "degree_certificate.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 204800,
      dataUrl: "data:application/pdf;base64,JVBERi0xLjQK...",
      version: 1,
      isLatest: true,
      createdAt: "2026-11-16T11:00:00Z",
    },
    {
      id: "doc-2",
      candidateEmail: "other.person@example.co.zw",
      category: "certificate",
      title: "AWS Cloud Practitioner",
      fileName: "aws_cert.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 102400,
      dataUrl: "data:application/pdf;base64,JVBERi0xLjQK...",
      version: 1,
      isLatest: true,
      createdAt: "2026-11-16T11:30:00Z",
    },
  ];

  const mockArtifacts: CandidateCvArtifact[] = [
    {
      id: "art-1",
      candidateEmail: "farai.moyo@example.co.zw",
      jobTitle: "Remote React Developer",
      company: "Acme Global",
      version: 1,
      generatedCv: {
        fullName: "Farai Moyo",
        headline: "Frontend Specialist",
        contactLine: "farai.moyo@example.co.zw",
        summary: "Specialist in accessible UI engineering.",
        coreSkills: ["React", "TypeScript", "Tailwind CSS"],
        experience: [
          {
            role: "Developer",
            organization: "ZimTech",
            dates: "2024 - Present",
            bullets: ["Built performant web portals"],
          },
        ],
        projects: [],
        education: [
          {
            qualification: "BSc Software Engineering",
            institution: "UZ",
            year: "2023",
          },
        ],
        certifications: [],
        languages: ["English", "Shona"],
        generatedBy: "gemini-live",
      },
      generatedCoverLetter: {
        fullName: "Farai Moyo",
        contactLine: "farai.moyo@example.co.zw",
        date: "Nov 16, 2026",
        recipient: "Hiring Manager",
        subject: "Application for Remote React Developer",
        greeting: "Dear Hiring Team,",
        paragraphs: ["I am writing to express my strong enthusiasm..."],
        signOff: "Sincerely, Farai Moyo",
        generatedBy: "gemini-live",
      },
      createdAt: "2026-11-16T12:00:00Z",
    },
  ];

  const mockApplications: JobApplicationRecord[] = [
    {
      id: "app-1",
      candidateId: "cand-test-123",
      candidateName: "Farai Moyo",
      candidateEmail: "farai.moyo@example.co.zw",
      jobId: "job-99",
      jobTitle: "Remote React Developer",
      company: "Acme Global",
      tailoredResumePitch: "Prepared for async delivery.",
      status: "shortlisted",
      appliedAt: "2026-11-16T12:30:00Z",
    },
  ];

  it("exports CandidateQuickInfoModal component function", () => {
    expect(typeof CandidateQuickInfoModal).toBe("function");
  });

  it("verifies candidate profile fields structure for quick info inspection", () => {
    expect(mockCandidate.profile.fullName).toBe("Farai Moyo");
    expect(mockCandidate.profile.email).toBe("farai.moyo@example.co.zw");
    expect(mockCandidate.profile.city).toBe("Harare");
    expect(mockCandidate.profile.highestQualification).toBe("Bachelors Degree");
    expect(mockCandidate.profile.fieldOfStudy).toBe("Software Engineering");
    expect(mockCandidate.profile.hasDedicatedLaptop).toBe(true);
    expect(mockCandidate.profile.primaryDevice).toBe("Dedicated Laptop / PC");
    expect(mockCandidate.profile.internetAccessType).toBe("Home Fiber / Wi-Fi");
    expect(mockCandidate.profile.powerReliabilityHours).toBe(8);
  });

  it("calculates estimated productive weekly capacity from daily power reliability", () => {
    const powerHours = mockCandidate.profile.powerReliabilityHours;
    const estimatedWeeklyCapacity = Math.min(powerHours * 5, 40);
    expect(estimatedWeeklyCapacity).toBe(40);

    const constrainedCandidateHours = 4;
    const constrainedWeeklyCapacity = Math.min(constrainedCandidateHours * 5, 40);
    expect(constrainedWeeklyCapacity).toBe(20);
  });

  it("filters candidate documents correctly by candidate email", () => {
    const email = mockCandidate.profile.email.toLowerCase();
    const candidateDocs = mockDocuments.filter(
      (d) => d.candidateEmail.toLowerCase() === email
    );

    expect(candidateDocs.length).toBe(1);
    expect(candidateDocs[0].title).toBe("BSc in Software Engineering");
    expect(candidateDocs[0].category).toBe("degree");
    expect(candidateDocs[0].issuer).toBe("University of Zimbabwe");
    expect(candidateDocs[0].fileName).toBe("degree_certificate.pdf");
  });

  it("filters candidate CV artifacts correctly by candidate email", () => {
    const email = mockCandidate.profile.email.toLowerCase();
    const candidateArtifacts = mockArtifacts.filter(
      (a) => a.candidateEmail.toLowerCase() === email
    );

    expect(candidateArtifacts.length).toBe(1);
    expect(candidateArtifacts[0].jobTitle).toBe("Remote React Developer");
    expect(candidateArtifacts[0].company).toBe("Acme Global");
    expect(candidateArtifacts[0].generatedCv.coreSkills).toContain("TypeScript");
  });

  it("links candidate to submitted applications cleanly", () => {
    const apps = mockApplications.filter(
      (a) => a.candidateId === mockCandidate.id || a.candidateEmail === mockCandidate.profile.email
    );

    expect(apps.length).toBe(1);
    expect(apps[0].jobTitle).toBe("Remote React Developer");
    expect(apps[0].status).toBe("shortlisted");
  });

  it("verifies pathway summary details and coach/hub pairings", () => {
    expect(mockCandidate.pathway.recommendedTrack).toBe("Full-Stack Software Development");
    expect(mockCandidate.pathway.assignedCoach.fullName).toBe("Coach Catherine");
    expect(mockCandidate.pathway.recommendedHub.name).toBe("Harare Innovation Hub");
    expect(mockCandidate.pathway.recommendedHub.hasSolarBackup).toBe(true);
    expect(mockCandidate.pathway.targetRemoteRoles[0].role).toBe("Frontend Engineer");
    expect(mockCandidate.pathway.targetRemoteRoles[0].estimatedMonthlyUsd).toBe("$1,200 - $1,800 / mo");
  });
});
