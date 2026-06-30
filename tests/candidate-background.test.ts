import { hireEmployee } from "../src/sim/employee-lifecycle";
import {
  calculateBackgroundTechnicalBonus,
  calculateCandidateTargetSalary,
  generateCandidate,
  generateCandidateBackground,
} from "../src/sim/staffing";
import type { CandidateBackground } from "../src/sim/types";
import { createInitialGameState } from "../src/sim/state";

describe("candidate background", () => {
  it("generates deterministic education, major, and industry experience", () => {
    const first = generateCandidate({ seed: 18, role: "engineer", seniority: "mid" });
    const second = generateCandidate({ seed: 18, role: "engineer", seniority: "mid" });

    expect(first.background).toEqual(second.background);
    expect(first.background.industryExperienceYears).toBeLessThanOrEqual(first.experienceYears);
  });

  it("raises technical score and salary expectations for stronger role-fit backgrounds", () => {
    const strongBackground: CandidateBackground = {
      educationTier: "elite",
      major: "computer-science",
      industryExperienceYears: 8,
    };
    const weakBackground: CandidateBackground = {
      educationTier: "vocational",
      major: "business",
      industryExperienceYears: 0,
    };

    expect(
      calculateBackgroundTechnicalBonus({
        role: "engineer",
        background: strongBackground,
      }),
    ).toBeGreaterThan(
      calculateBackgroundTechnicalBonus({
        role: "engineer",
        background: weakBackground,
      }),
    );
    expect(
      calculateCandidateTargetSalary({
        role: "engineer",
        seniority: "mid",
        technical: 8,
        communication: 6,
        iq: 7,
        background: strongBackground,
      }),
    ).toBeGreaterThan(
      calculateCandidateTargetSalary({
        role: "engineer",
        seniority: "mid",
        technical: 8,
        communication: 6,
        iq: 7,
        background: weakBackground,
      }),
    );
  });

  it("copies candidate background onto hired employees", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 18, role: "engineer", seniority: "mid" });

    const employee = hireEmployee(state, {
      candidate,
      salary: candidate.targetSalary,
      equityPercent: 0,
    });

    expect(employee.background).toEqual(candidate.background);
  });

  it("uses company reputation to attract stronger candidate backgrounds", () => {
    const lowReputation = generateCandidate({
      seed: 22,
      role: "engineer",
      seniority: "mid",
      companyReputation: 1,
    });
    const highReputation = generateCandidate({
      seed: 22,
      role: "engineer",
      seniority: "mid",
      companyReputation: 9,
    });

    expect(candidateQualityScore(highReputation)).toBeGreaterThan(
      candidateQualityScore(lowReputation),
    );
    expect(highReputation.technical).toBeGreaterThanOrEqual(lowReputation.technical);
    expect(highReputation.targetSalary).toBeGreaterThan(lowReputation.targetSalary);
  });

  it("keeps generated backgrounds finite for invalid role and experience inputs", () => {
    const background = generateCandidateBackground({
      role: "invalid" as never,
      experienceYears: Number.NaN,
      educationRoll: Number.NaN,
      majorRoll: Infinity,
      industryRoll: Number.NaN,
    });

    expect(["elite", "strong", "standard", "vocational"]).toContain(background.educationTier);
    expect([
      "computer-science",
      "engineering",
      "business",
      "finance",
      "design",
      "operations",
    ]).toContain(background.major);
    expect(background.industryExperienceYears).toBe(0);
  });

  it("keeps technical bonuses finite for invalid background values", () => {
    const bonus = calculateBackgroundTechnicalBonus({
      role: "invalid" as never,
      background: {
        educationTier: "invalid" as never,
        major: "invalid" as never,
        industryExperienceYears: Number.NaN,
      },
    });

    expect(Number.isFinite(bonus)).toBe(true);
    expect(bonus).toBeGreaterThanOrEqual(0);
  });

  it("keeps salary expectations finite for invalid background and ability values", () => {
    const salary = calculateCandidateTargetSalary({
      role: "engineer",
      seniority: "mid",
      technical: Number.NaN,
      communication: Infinity,
      iq: Number.NaN,
      background: {
        educationTier: "invalid" as never,
        major: "invalid" as never,
        industryExperienceYears: Infinity,
      },
    });

    expect(Number.isFinite(salary)).toBe(true);
    expect(salary).toBeGreaterThan(0);
  });
});

function candidateQualityScore(candidate: ReturnType<typeof generateCandidate>): number {
  const educationScore = {
    elite: 4,
    strong: 3,
    standard: 2,
    vocational: 1,
  }[candidate.background.educationTier];
  const majorScore = ["computer-science", "engineering"].includes(candidate.background.major)
    ? 2
    : 0;

  return (
    educationScore +
    majorScore +
    candidate.technical +
    candidate.background.industryExperienceYears * 0.25
  );
}
