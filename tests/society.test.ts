import { applySocietyEvent } from "../src/sim/society";
import { createInitialGameState } from "../src/sim/state";

describe("applySocietyEvent", () => {
  it("applies policy support to cash and reputation", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;
    const previousReputation = state.company.reputation;

    applySocietyEvent(state, { type: "policy_support", cashDelta: 10_000, reputationDelta: 1 });

    expect(state.company.cash).toBe(previousCash + 10_000);
    expect(state.company.reputation).toBe(previousReputation + 1);
  });

  it("applies legal incidents as abstract cash and reputation penalties", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;
    const previousReputation = state.company.reputation;

    applySocietyEvent(state, {
      type: "legal_incident",
      cashDelta: -15_000,
      reputationDelta: -2,
    });

    expect(state.company.cash).toBe(previousCash - 15_000);
    expect(state.company.reputation).toBe(previousReputation - 2);
  });

  it("ignores society events with non-finite deltas", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;
    const previousReputation = state.company.reputation;
    const previousMarketSentiment = state.marketSentiment;

    applySocietyEvent(state, {
      type: "policy_support",
      cashDelta: Number.NaN,
      reputationDelta: 1,
      marketSentimentDelta: 0,
    });

    expect(state.company.cash).toBe(previousCash);
    expect(state.company.reputation).toBe(previousReputation);
    expect(state.marketSentiment).toBe(previousMarketSentiment);
  });

  it("ignores society events with invalid types without changing state or events", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;
    const previousReputation = state.company.reputation;
    const previousMarketSentiment = state.marketSentiment;
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];

    applySocietyEvent(state, {
      type: "bad" as never,
      cashDelta: 10_000,
      reputationDelta: 1,
      marketSentimentDelta: 0.1,
    });

    expect(state.company.cash).toBe(previousCash);
    expect(state.company.reputation).toBe(previousReputation);
    expect(state.marketSentiment).toBe(previousMarketSentiment);
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
  });

  it("keeps state finite when applying valid events to corrupted state", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.cash = Number.NaN;
    state.company.reputation = Number.NaN;
    state.marketSentiment = Number.NaN;

    applySocietyEvent(state, {
      type: "policy_support",
      cashDelta: 10_000,
      reputationDelta: 1,
      marketSentimentDelta: 0.1,
    });

    expect(Number.isFinite(state.company.cash)).toBe(true);
    expect(Number.isFinite(state.company.reputation)).toBe(true);
    expect(Number.isFinite(state.marketSentiment)).toBe(true);
    expect(state.company.cash).toBe(10_000);
    expect(state.company.reputation).toBe(1);
    expect(state.marketSentiment).toBe(1.1);
  });
});
