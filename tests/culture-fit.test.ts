import { calculateCultureFit, resolvePersonalityLabel } from "../src/sim/culture-fit";
import { negotiateHiring } from "../src/sim/hiring";
import { calculateResignationRisk } from "../src/sim/resignation";
import { generateCandidate } from "../src/sim/staffing";
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
    industryExperienceYears: 5,
  },
  personality: 8,
};

describe("culture fit", () => {
  it("scores personality fit by company culture", () => {
    expect(calculateCultureFit({ culture: "wolf", personality: 8 })).toBeGreaterThan(
      calculateCultureFit({ culture: "wolf", personality: 5 }),
    );
    expect(calculateCultureFit({ culture: "laissez-faire", personality: 9 })).toBeGreaterThan(
      calculateCultureFit({ culture: "laissez-faire", personality: 8 }),
    );
  });

  it("matches legacy discrete values at reference points", () => {
    expect(calculateCultureFit({ culture: "wolf", personality: 0 })).toBeCloseTo(0.45, 5);
    expect(calculateCultureFit({ culture: "wolf", personality: 4 })).toBeCloseTo(0.55, 5);
    expect(calculateCultureFit({ culture: "wolf", personality: 7 })).toBeCloseTo(1.0, 5);
    expect(calculateCultureFit({ culture: "wolf", personality: 10 })).toBeCloseTo(0.65, 5);

    expect(calculateCultureFit({ culture: "adaptive", personality: 0 })).toBeCloseTo(0.9, 5);
    expect(calculateCultureFit({ culture: "adaptive", personality: 4 })).toBeCloseTo(1.0, 5);
    expect(calculateCultureFit({ culture: "adaptive", personality: 7 })).toBeCloseTo(0.75, 5);
    expect(calculateCultureFit({ culture: "adaptive", personality: 10 })).toBeCloseTo(0.8, 5);
  });

  it("interpolates linearly between reference points", () => {
    const wolfMid = calculateCultureFit({ culture: "wolf", personality: 5.5 });
    expect(wolfMid).toBeGreaterThan(calculateCultureFit({ culture: "wolf", personality: 4 }));
    expect(wolfMid).toBeLessThan(calculateCultureFit({ culture: "wolf", personality: 7 }));

    const wolfQuarter = calculateCultureFit({ culture: "wolf", personality: 2 });
    expect(wolfQuarter).toBeGreaterThan(calculateCultureFit({ culture: "wolf", personality: 0 }));
    expect(wolfQuarter).toBeLessThan(calculateCultureFit({ culture: "wolf", personality: 4 }));
  });

  it("clamps personality values outside 0-10 to boundary scores", () => {
    expect(calculateCultureFit({ culture: "wolf", personality: -5 })).toBeCloseTo(0.45, 5);
    expect(calculateCultureFit({ culture: "wolf", personality: 15 })).toBeCloseTo(0.65, 5);
  });

  it("returns zero fit for invalid culture values", () => {
    const fit = calculateCultureFit({ culture: "invalid" as never, personality: 5 });

    expect(fit).toBe(0);
  });

  it("keeps culture fit finite for non-finite personality values", () => {
    const fit = calculateCultureFit({ culture: "wolf", personality: Number.NaN });

    expect(Number.isFinite(fit)).toBe(true);
    expect(fit).toBeGreaterThanOrEqual(0);
    expect(fit).toBeLessThanOrEqual(1);
  });

  it("raises hiring acceptance when personality fits the company culture", () => {
    const wolfResult = negotiateHiring({
      seed: 7,
      companyReputation: 6,
      companyCulture: "wolf",
      offer: { salary: 16_000, equityPercent: 0.1 },
      candidate: ambitiousCandidate,
    });
    const adaptiveResult = negotiateHiring({
      seed: 7,
      companyReputation: 6,
      companyCulture: "laissez-faire",
      offer: { salary: 16_000, equityPercent: 0.1 },
      candidate: ambitiousCandidate,
    });

    expect(wolfResult.acceptanceProbability).toBeGreaterThan(adaptiveResult.acceptanceProbability);
  });

  it("raises resignation risk when personality clashes with culture", () => {
    const alignedRisk = calculateResignationRisk({
      salary: 16_000,
      targetSalary: 16_000,
      stressTolerance: 7,
      culturePressure: 6,
      morale: 7,
      culture: "wolf",
      personality: 8,
    });
    const mismatchedRisk = calculateResignationRisk({
      salary: 16_000,
      targetSalary: 16_000,
      stressTolerance: 7,
      culturePressure: 6,
      morale: 7,
      culture: "wolf",
      personality: 5,
    });

    expect(mismatchedRisk).toBeGreaterThan(alignedRisk);
  });
});

describe("numeric personality behavior", () => {
  it("maps personality score to behavioral labels", () => {
    expect(resolvePersonalityLabel(0)).toBe("steady");
    expect(resolvePersonalityLabel(3)).toBe("steady");
    expect(resolvePersonalityLabel(4)).toBe("collaborative");
    expect(resolvePersonalityLabel(6)).toBe("collaborative");
    expect(resolvePersonalityLabel(7)).toBe("ambitious");
    expect(resolvePersonalityLabel(8)).toBe("ambitious");
    expect(resolvePersonalityLabel(9)).toBe("independent");
    expect(resolvePersonalityLabel(10)).toBe("independent");
  });

  it("scales salary-driven resignation risk with personality score", () => {
    const lowPersonalityRisk = calculateResignationRisk({
      salary: 10_000,
      targetSalary: 15_000,
      stressTolerance: 8,
      culturePressure: 3,
      morale: 8,
      personality: 0,
    });
    const highPersonalityRisk = calculateResignationRisk({
      salary: 10_000,
      targetSalary: 15_000,
      stressTolerance: 8,
      culturePressure: 3,
      morale: 8,
      personality: 10,
    });

    expect(highPersonalityRisk).toBeGreaterThan(lowPersonalityRisk);
  });

  it("assigns senior candidates personality in 6-10 range", () => {
    const seniorCandidates = Array.from({ length: 20 }, (_, i) =>
      generateCandidate({ seed: i * 100, role: "engineer", seniority: "senior" }),
    );

    for (const candidate of seniorCandidates) {
      expect(candidate.personality).toBeGreaterThanOrEqual(6);
      expect(candidate.personality).toBeLessThanOrEqual(10);
    }
  });

  it("assigns junior candidates personality in 3-7 range", () => {
    const juniorCandidates = Array.from({ length: 20 }, (_, i) =>
      generateCandidate({ seed: i * 100, role: "engineer", seniority: "junior" }),
    );

    for (const candidate of juniorCandidates) {
      expect(candidate.personality).toBeGreaterThanOrEqual(3);
      expect(candidate.personality).toBeLessThanOrEqual(7);
    }
  });

  it("produces deterministic personality for same seed", () => {
    const first = generateCandidate({ seed: 42, role: "engineer", seniority: "mid" });
    const second = generateCandidate({ seed: 42, role: "engineer", seniority: "mid" });

    expect(first.personality).toBe(second.personality);
  });
});
