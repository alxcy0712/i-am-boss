import { createProbabilityAuditCliReport } from "../src/harness/probability-audit";

describe("createProbabilityAuditCliReport", () => {
  it("returns the probability config audit report", () => {
    const report = createProbabilityAuditCliReport();

    expect(report.missingRequiredSections).toEqual([]);
    expect(report.invalidChancePaths).toEqual([]);
    expect(report.uncommentedSections).toEqual([]);
    expect(report.requiredSections).toContain("finance");
    expect(report.requiredSections).toContain("securitiesMarket");
  });
});
