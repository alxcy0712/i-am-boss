import {
  auditProbabilityConfig,
  auditProbabilityConfigSource,
} from "../src/harness/probability-config-audit";

describe("auditProbabilityConfig", () => {
  it("reports tunable config coverage and validates chance-like values", () => {
    const audit = auditProbabilityConfig();

    expect(audit.topLevelSections).toContain("hiring");
    expect(audit.topLevelSections).toContain("securitiesMarket");
    expect(audit.numericLeafCount).toBeGreaterThan(20);
    expect(audit.invalidChancePaths).toEqual([]);
    expect(audit.uncommentedSections).toEqual([]);
    expect(audit.missingRequiredSections).toEqual([]);
  });

  it("reports required gameplay systems missing from probability config", () => {
    const audit = auditProbabilityConfigSource(
      {
        hiring: {
          baseAcceptance: 0.2,
        },
      },
      `
export const PROBABILITY_CONFIG = {
  hiring: {
    // Baseline hiring chance.
    baseAcceptance: 0.2
  }
} as const;
`,
    );

    expect(audit.missingRequiredSections).toContain("finance");
    expect(audit.missingRequiredSections).toContain("securitiesMarket");
    expect(audit.missingRequiredSections).toContain("macroCycle");
    expect(audit.missingRequiredSections).not.toContain("hiring");
  });
});
