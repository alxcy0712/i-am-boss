import { updateListedMarketValue } from "../src/sim/securities-market";
import { createInitialGameState } from "../src/sim/state";

describe("updateListedMarketValue", () => {
  it("moves listed market value with sentiment and reputation", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.isPublic = true;
    state.company.listedMarketValue = 500_000;
    state.marketSentiment = 1.2;
    state.company.reputation = 8;

    const value = updateListedMarketValue(state, { seed: 3 });

    expect(value).toBeGreaterThan(500_000);
    expect(state.company.listedMarketValue).toBe(value);
  });
});
