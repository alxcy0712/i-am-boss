import {
  calculateFinalScore,
  calculateScoreBreakdown,
  calculateWealthFromScore,
} from "../src/sim/scoring";

describe("calculateFinalScore", () => {
  it("applies direct 1:2:1 weights for days, valuation, and player wealth", () => {
    const score = calculateFinalScore({
      daysPlayed: 100,
      companyValuation: 200,
      playerWealth: 50,
    });
    expect(score).toBe(100 * 1 + 200 * 2 + 50 * 1);
  });
});

describe("calculateScoreBreakdown", () => {
  it("returns individual point components matching the 1:2:1 ratio", () => {
    const breakdown = calculateScoreBreakdown({
      daysPlayed: 300,
      companyValuation: 500_000,
      playerWealth: 120_000,
    });
    expect(breakdown.daysPoints).toBe(300);
    expect(breakdown.valuationPoints).toBe(1_000_000);
    expect(breakdown.wealthPoints).toBe(120_000);
    expect(breakdown.totalScore).toBe(300 + 1_000_000 + 120_000);
  });

  it("handles zero inputs", () => {
    const breakdown = calculateScoreBreakdown({
      daysPlayed: 0,
      companyValuation: 0,
      playerWealth: 0,
    });
    expect(breakdown.totalScore).toBe(0);
  });

  it("treats non-finite inputs as zero-point components", () => {
    const breakdown = calculateScoreBreakdown({
      daysPlayed: Number.NaN,
      companyValuation: Infinity,
      playerWealth: Number.NaN,
    });

    expect(breakdown).toEqual({
      daysPoints: 0,
      valuationPoints: 0,
      wealthPoints: 0,
      totalScore: 0,
    });
  });
});

describe("calculateWealthFromScore", () => {
  it("recovers wealth from score using the inverse 1:2:1 formula", () => {
    const wealth = calculateWealthFromScore(500_000, 100, 200_000);
    expect(wealth).toBe(500_000 - 100 - 200_000 * 2);
  });

  it("clamps to zero when derived wealth would be negative", () => {
    const wealth = calculateWealthFromScore(10, 100, 50);
    expect(wealth).toBe(0);
  });

  it("returns zero when score inputs are non-finite", () => {
    expect(calculateWealthFromScore(Number.NaN, 100, 50)).toBe(0);
    expect(calculateWealthFromScore(100, Number.NaN, 50)).toBe(0);
    expect(calculateWealthFromScore(100, 10, Infinity)).toBe(0);
  });
});
