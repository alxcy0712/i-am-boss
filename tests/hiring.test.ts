import { negotiateHiring } from "../src/sim/hiring";

describe("negotiateHiring", () => {
  it("rejects an offer below the candidate minimum salary", () => {
    const result = negotiateHiring({
      seed: 7,
      companyReputation: 5,
      offer: { salary: 9000, equityPercent: 0 },
      candidate: {
        role: "engineer",
        targetSalary: 15000,
        minimumSalary: 12000,
        technical: 8,
        experienceYears: 4,
        stressTolerance: 6,
        communication: 5,
        eq: 5,
        iq: 8,
        background: {
          educationTier: "standard",
          major: "computer-science",
          industryExperienceYears: 4,
        },
        personality: 5,
      },
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("salary_below_minimum");
  });

  it("accepts a fair offer for a candidate when seeded probability succeeds", () => {
    const result = negotiateHiring({
      seed: 7,
      companyReputation: 8,
      offer: { salary: 16000, equityPercent: 0.2 },
      candidate: {
        role: "engineer",
        targetSalary: 15000,
        minimumSalary: 12000,
        technical: 8,
        experienceYears: 4,
        stressTolerance: 6,
        communication: 5,
        eq: 5,
        iq: 8,
        background: {
          educationTier: "standard",
          major: "computer-science",
          industryExperienceYears: 4,
        },
        personality: 5,
      },
    });

    expect(result.accepted).toBe(true);
    expect(result.acceptanceProbability).toBeGreaterThan(0.7);
  });
});
