import { calculateCultureFit } from "../src/sim/culture-fit";
import { negotiateHiring } from "../src/sim/hiring";
import { calculateResignationRisk } from "../src/sim/resignation";
import type { Candidate } from "../src/sim/hiring";

const ambitiousCandidate: Candidate = {
  role: "engineer",
  targetSalary: 16_000,
  minimumSalary: 12_000,
  technical: 8,
  experienceYears: 5,
  stressTolerance: 8,
  communication: 7,
  eq: 7,
  iq: 8,
  background: {
    educationTier: "strong",
    major: "computer-science",
    industryExperienceYears: 5
  },
  personality: "ambitious"
};

describe("culture fit", () => {
  it("scores personality fit by company culture", () => {
    expect(calculateCultureFit({ culture: "wolf", personality: "ambitious" })).toBeGreaterThan(
      calculateCultureFit({ culture: "wolf", personality: "steady" })
    );
    expect(
      calculateCultureFit({ culture: "laissez-faire", personality: "independent" })
    ).toBeGreaterThan(calculateCultureFit({ culture: "laissez-faire", personality: "ambitious" }));
  });

  it("raises hiring acceptance when personality fits the company culture", () => {
    const wolfResult = negotiateHiring({
      seed: 7,
      companyReputation: 6,
      companyCulture: "wolf",
      offer: { salary: 16_000, equityPercent: 0.1 },
      candidate: ambitiousCandidate
    });
    const adaptiveResult = negotiateHiring({
      seed: 7,
      companyReputation: 6,
      companyCulture: "laissez-faire",
      offer: { salary: 16_000, equityPercent: 0.1 },
      candidate: ambitiousCandidate
    });

    expect(wolfResult.acceptanceProbability).toBeGreaterThan(
      adaptiveResult.acceptanceProbability
    );
  });

  it("raises resignation risk when personality clashes with culture", () => {
    const alignedRisk = calculateResignationRisk({
      salary: 16_000,
      targetSalary: 16_000,
      stressTolerance: 7,
      culturePressure: 6,
      morale: 7,
      culture: "wolf",
      personality: "ambitious"
    });
    const mismatchedRisk = calculateResignationRisk({
      salary: 16_000,
      targetSalary: 16_000,
      stressTolerance: 7,
      culturePressure: 6,
      morale: 7,
      culture: "wolf",
      personality: "steady"
    });

    expect(mismatchedRisk).toBeGreaterThan(alignedRisk);
  });
});
