import { calculateCompanyValuation } from "../src/sim/valuation";

describe("calculateCompanyValuation", () => {
  it("uses analyst-style estimates for private companies", () => {
    const valuation = calculateCompanyValuation({
      isPublic: false,
      annualRevenue: 100,
      profitMargin: 0.2,
      reputation: 6,
      marketSentiment: 1,
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
      listedMarketValue: 420,
    });

    expect(valuation).toEqual({
      kind: "listed_market",
      value: 420,
    });
  });

  it("increases valuation with higher operational capability", () => {
    const lowCapability = calculateCompanyValuation({
      isPublic: false,
      annualRevenue: 1_000_000,
      profitMargin: 0.2,
      reputation: 6,
      marketSentiment: 1,
      operationalCapability: 2,
    });

    const highCapability = calculateCompanyValuation({
      isPublic: false,
      annualRevenue: 1_000_000,
      profitMargin: 0.2,
      reputation: 6,
      marketSentiment: 1,
      operationalCapability: 9,
    });

    expect(highCapability.value).toBeGreaterThan(lowCapability.value);
  });

  it("defaults operational capability to 5 when not provided", () => {
    const withDefault = calculateCompanyValuation({
      isPublic: false,
      annualRevenue: 1_000_000,
      profitMargin: 0.2,
      reputation: 6,
      marketSentiment: 1,
    });

    const withExplicit = calculateCompanyValuation({
      isPublic: false,
      annualRevenue: 1_000_000,
      profitMargin: 0.2,
      reputation: 6,
      marketSentiment: 1,
      operationalCapability: 5,
    });

    expect(withDefault.value).toBe(withExplicit.value);
  });

  it("returns zero for non-finite private valuation inputs", () => {
    const valuation = calculateCompanyValuation({
      isPublic: false,
      annualRevenue: Number.NaN,
      profitMargin: 0.2,
      reputation: 6,
      marketSentiment: 1,
    });

    expect(valuation).toEqual({
      kind: "private_estimate",
      value: 0,
    });
  });

  it("returns zero for non-finite listed market value", () => {
    const valuation = calculateCompanyValuation({
      isPublic: true,
      annualRevenue: 100,
      profitMargin: 0.2,
      reputation: 6,
      marketSentiment: 1,
      listedMarketValue: Number.NaN,
    });

    expect(valuation).toEqual({
      kind: "listed_market",
      value: 0,
    });
  });
});
