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
});
