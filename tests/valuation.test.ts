import { calculateCompanyValuation } from "../src/sim/valuation";

describe("calculateCompanyValuation", () => {
  it("uses analyst-style estimates for private companies", () => {
    const valuation = calculateCompanyValuation({
      isPublic: false,
      annualRevenue: 100,
      profitMargin: 0.2,
      reputation: 6,
      marketSentiment: 1
    });

    expect(valuation.kind).toBe("private_estimate");
    expect(valuation.value).toBeGreaterThan(100);
  });

  it("uses market pricing for listed companies", () => {
    const valuation = calculateCompanyValuation({
      isPublic: true,
      annualRevenue: 100,
      profitMargin: 0.2,
      reputation: 6,
      marketSentiment: 1,
      listedMarketValue: 420
    });

    expect(valuation).toEqual({
      kind: "listed_market",
      value: 420
    });
  });
});
