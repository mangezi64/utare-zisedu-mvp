import { describe, it, expect } from "vitest";
import {
  SURVEY_BENCHMARKS,
  SEED_INNOVATION_HUBS,
  SEED_COACHES,
  SEED_REMOTE_JOBS,
} from "@/lib/mock-data";

describe("UTARE Survey Benchmarks & Ecosystem Seed Integrity", () => {
  it("contains all 4 core UTARE N=23 empirical survey benchmarks", () => {
    expect(SURVEY_BENCHMARKS).toHaveLength(4);
    const metrics = SURVEY_BENCHMARKS.map((b) => b.metric);
    expect(metrics).toContain("82.6%");
    expect(metrics).toContain("43.5%");
    expect(metrics).toContain("84.6%");
    expect(metrics).toContain("73.9%");
  });

  it("provides solar-backed Innovation Hubs across major Zimbabwean cities", () => {
    expect(SEED_INNOVATION_HUBS.length).toBeGreaterThanOrEqual(4);
    for (const hub of SEED_INNOVATION_HUBS) {
      expect(hub.hasSolarBackup).toBe(true);
      expect(hub.avgSpeedMbps).toBeGreaterThanOrEqual(90);
      expect(hub.availableWorkstations).toBeGreaterThan(0);
    }
  });

  it("includes human coaches with valid booking links and weekly slots", () => {
    expect(SEED_COACHES.length).toBeGreaterThanOrEqual(4);
    for (const coach of SEED_COACHES) {
      expect(coach.availableSlotsWeekly).toBeGreaterThan(0);
      expect(coach.calBookingLink).toMatch(/^https?:\/\//);
    }
  });

  it("lists verified remote jobs with explicit cross-border payment rails", () => {
    expect(SEED_REMOTE_JOBS.length).toBeGreaterThanOrEqual(4);
    for (const job of SEED_REMOTE_JOBS) {
      expect(job.supportedPaymentRails.length).toBeGreaterThan(0);
      expect(job.requiredSkills.length).toBeGreaterThan(0);
    }
  });
});
