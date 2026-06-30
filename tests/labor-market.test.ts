import { applyLaborMarketPressure } from "../src/sim/labor-market";
import { generateCandidate } from "../src/sim/staffing";

describe("applyLaborMarketPressure", () => {
  it("lowers salary expectations when unemployment is high", () => {
    const candidate = generateCandidate({ seed: 2, role: "engineer", seniority: "mid" });
    const adjusted = applyLaborMarketPressure(candidate, { unemploymentRate: 0.18 });

    expect(adjusted.targetSalary).toBeLessThan(candidate.targetSalary);
    expect(adjusted.minimumSalary).toBeLessThan(candidate.minimumSalary);
  });

  it("raises salary expectations in a tight labor market", () => {
    const candidate = generateCandidate({ seed: 2, role: "engineer", seniority: "mid" });
    const adjusted = applyLaborMarketPressure(candidate, { unemploymentRate: 0.03 });

    expect(adjusted.targetSalary).toBeGreaterThan(candidate.targetSalary);
  });

  it("keeps salary expectations finite when candidate salary fields are invalid", () => {
    const candidate = generateCandidate({ seed: 2, role: "engineer", seniority: "mid" });
    candidate.targetSalary = Number.NaN;
    candidate.minimumSalary = Infinity;

    const adjusted = applyLaborMarketPressure(candidate, { unemploymentRate: 0.18 });

    expect(Number.isFinite(adjusted.targetSalary)).toBe(true);
    expect(Number.isFinite(adjusted.minimumSalary)).toBe(true);
    expect(adjusted.targetSalary).toBeGreaterThan(0);
    expect(adjusted.minimumSalary).toBeGreaterThan(0);
    expect(adjusted.minimumSalary).toBeLessThanOrEqual(adjusted.targetSalary);
  });

  it("treats non-finite unemployment as a neutral labor market", () => {
    const candidate = generateCandidate({ seed: 2, role: "engineer", seniority: "mid" });

    const adjusted = applyLaborMarketPressure(candidate, { unemploymentRate: Infinity });

    expect(adjusted.targetSalary).toBe(candidate.targetSalary);
    expect(adjusted.minimumSalary).toBe(candidate.minimumSalary);
  });
});
