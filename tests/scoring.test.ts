import { calculateFinalScore } from "../src/sim/scoring";

describe("calculateFinalScore", () => {
  it("applies day, valuation, and player wealth weights of 1:2:1", () => {
    expect(
      calculateFinalScore({
        daysPlayed: 100,
        companyValuation: 200,
        playerWealth: 50
      })
    ).toBe(550);
  });
});
