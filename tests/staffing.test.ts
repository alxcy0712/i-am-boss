import {
  calculateCandidateTargetSalary,
  generateCandidate,
  getHiringPlan,
} from "../src/sim/staffing";

describe("getHiringPlan", () => {
  it("scales required roles from tiny startups to larger companies", () => {
    expect(getHiringPlan({ headcount: 1, annualRevenue: 80000 })).toEqual(["engineer"]);

    expect(getHiringPlan({ headcount: 25, annualRevenue: 1_200_000 })).toContain("finance");
    expect(getHiringPlan({ headcount: 25, annualRevenue: 1_200_000 })).toContain("hr");
  });

  it("uses a conservative plan for non-finite company inputs", () => {
    expect(
      getHiringPlan({
        headcount: Number.NaN,
        annualRevenue: Infinity,
        resources: Infinity,
      }),
    ).toEqual(["engineer"]);
  });
});

describe("generateCandidate", () => {
  it("creates deterministic candidates with salary expectations tied to ability and experience", () => {
    const junior = generateCandidate({ seed: 3, role: "engineer", seniority: "junior" });
    const senior = generateCandidate({ seed: 3, role: "engineer", seniority: "senior" });

    expect(junior.role).toBe("engineer");
    expect(senior.targetSalary).toBeGreaterThan(junior.targetSalary);
    expect(senior.minimumSalary).toBeLessThan(senior.targetSalary);
    expect(senior.technical).toBeGreaterThanOrEqual(junior.technical);
  });

  it("keeps salary expectations finite for invalid seniority values", () => {
    const candidate = generateCandidate({
      seed: 3,
      role: "engineer",
      seniority: "invalid" as never,
    });

    expect(Number.isFinite(candidate.targetSalary)).toBe(true);
    expect(Number.isFinite(candidate.minimumSalary)).toBe(true);
    expect(candidate.targetSalary).toBeGreaterThan(0);
    expect(candidate.minimumSalary).toBeGreaterThan(0);
  });

  it("falls back to a valid role for invalid role values", () => {
    const candidate = generateCandidate({
      seed: 3,
      role: "invalid" as never,
      seniority: "junior",
    });

    expect(candidate.role).toBe("engineer");
    expect(Number.isFinite(candidate.targetSalary)).toBe(true);
    expect(candidate.targetSalary).toBeGreaterThan(0);
  });
});

describe("calculateCandidateTargetSalary", () => {
  it("returns a finite salary for invalid role and seniority values", () => {
    const salary = calculateCandidateTargetSalary({
      role: "invalid" as never,
      seniority: "invalid" as never,
      technical: 5,
      communication: 5,
      iq: 5,
      background: {
        educationTier: "standard",
        major: "computer-science",
        industryExperienceYears: 2,
      },
    });

    expect(Number.isFinite(salary)).toBe(true);
    expect(salary).toBeGreaterThan(0);
  });
});
