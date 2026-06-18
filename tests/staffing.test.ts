import { generateCandidate, getHiringPlan } from "../src/sim/staffing";

describe("getHiringPlan", () => {
  it("scales required roles from tiny startups to larger companies", () => {
    expect(getHiringPlan({ headcount: 1, annualRevenue: 80000 })).toEqual(["engineer"]);

    expect(getHiringPlan({ headcount: 25, annualRevenue: 1_200_000 })).toContain("finance");
    expect(getHiringPlan({ headcount: 25, annualRevenue: 1_200_000 })).toContain("hr");
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
});
