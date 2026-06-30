import { updateListedMarketValue } from "../src/sim/securities-market";
import { createInitialGameState } from "../src/sim/state";

describe("updateListedMarketValue", () => {
  it("ignores market updates for private companies", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousValuation = state.company.valuation;

    const value = updateListedMarketValue(state, { seed: 3 });

    expect(value).toBe(previousValuation);
    expect(state.company.listedMarketValue).toBeUndefined();
    expect(state.events.some((event) => event.type === "listed_market_value")).toBe(false);
  });

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

  it("keeps existing listed value when market inputs are non-finite", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.isPublic = true;
    state.company.listedMarketValue = 500_000;
    state.marketSentiment = Number.NaN;

    const value = updateListedMarketValue(state, { seed: 3 });

    expect(value).toBe(500_000);
    expect(state.company.listedMarketValue).toBe(500_000);
  });
});
