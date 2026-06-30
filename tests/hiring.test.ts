import { negotiateHiring } from "../src/sim/hiring";

describe("negotiateHiring", () => {
  const candidate = {
    role: "engineer" as const,
    targetSalary: 15000,
    minimumSalary: 12000,
    technical: 8,
    experienceYears: 4,
    stressTolerance: 6,
    communication: 5,
    eq: 5,
    iq: 8,
    background: {
      educationTier: "standard" as const,
      major: "computer-science" as const,
      industryExperienceYears: 4,
    },
    personality: 5 as const,
  };

  it("rejects an offer below the candidate minimum salary", () => {
    const result = negotiateHiring({
      seed: 7,
      companyReputation: 5,
      offer: { salary: 9000, equityPercent: 0 },
      candidate,
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("salary_below_minimum");
  });

  it("rejects non-finite offers with zero acceptance probability", () => {
    const result = negotiateHiring({
      seed: 7,
      companyReputation: 8,
      offer: { salary: Infinity, equityPercent: 1 },
      candidate,
    });

    expect(result.accepted).toBe(false);
    expect(result.acceptanceProbability).toBe(0);
    expect(result.reason).toBe("invalid_offer");
  });

  it("rejects equity offers outside the supported range", () => {
    for (const equityPercent of [-0.01, 1.01]) {
      const result = negotiateHiring({
        seed: 7,
        companyReputation: 8,
        offer: { salary: 16000, equityPercent },
        candidate,
      });

      expect(result.accepted).toBe(false);
      expect(result.acceptanceProbability).toBe(0);
      expect(result.reason).toBe("invalid_offer");
    }
  });

  it("accepts a fair offer for a candidate when seeded probability succeeds", () => {
    const result = negotiateHiring({
      seed: 7,
      companyReputation: 8,
      offer: { salary: 16000, equityPercent: 0.2 },
      candidate,
    });

    expect(result.accepted).toBe(true);
    expect(result.acceptanceProbability).toBeGreaterThan(0.7);
  });

  it("keeps acceptance probability finite for polluted candidate inputs", () => {
    const result = negotiateHiring({
      seed: 7,
      companyReputation: Number.NaN,
      companyCulture: "invalid" as never,
      offer: { salary: 16000, equityPercent: 0.2 },
      candidate: {
        ...candidate,
        targetSalary: Number.NaN,
        minimumSalary: Number.NaN,
        communication: Infinity,
        personality: Number.NaN,
      },
    });

    expect(Number.isFinite(result.acceptanceProbability)).toBe(true);
    expect(result.acceptanceProbability).toBeGreaterThanOrEqual(0);
    expect(result.acceptanceProbability).toBeLessThan(0.5);
  });
});
