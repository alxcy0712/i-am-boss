import {
  applySpecialEvent,
  maybeApplySpecialEvent,
  selectSpecialEventType,
} from "../src/sim/special-events";
import { createInitialGameState } from "../src/sim/state";

describe("special events", () => {
  it("selects abstract event types from weighted rolls", () => {
    expect(selectSpecialEventType(0.1)).toBe("financial_crisis");
    expect(selectSpecialEventType(0.55)).toBe("supply_chain_shock");
    expect(selectSpecialEventType(0.9)).toBe("geopolitical_tension");
  });

  it("selects a deterministic event type for non-finite type rolls", () => {
    expect(selectSpecialEventType(Number.NaN)).toBe("financial_crisis");
  });

  it("does not trigger events for non-finite trigger rolls", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;

    const result = maybeApplySpecialEvent(state, {
      triggerRoll: Number.NaN,
      typeRoll: 0,
    });

    expect(result).toBeUndefined();
    expect(state.society.specialEventCount).toBe(0);
    expect(state.company.cash).toBe(previousCash);
  });

  it("applies a financial crisis to cash, market sentiment, and unemployment", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;

    applySpecialEvent(state, { type: "financial_crisis" });

    expect(state.company.cash).toBeLessThan(previousCash);
    expect(state.marketSentiment).toBeLessThan(1);
    expect(state.society.unemploymentRate).toBeGreaterThan(0.07);
    expect(state.society.specialEventCount).toBe(1);
    expect(state.eventLog.at(-1)).toContain("Special event: financial_crisis");
  });

  it("applies a supply chain shock to operating costs", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousMonthlyBurn = state.company.monthlyBurn;

    applySpecialEvent(state, { type: "supply_chain_shock" });

    expect(state.company.monthlyBurn).toBeGreaterThan(previousMonthlyBurn);
    expect(state.society.specialEventCount).toBe(1);
  });

  it("ignores invalid special event types without changing state or events", () => {
    const state = createInitialGameState({ seed: 1 });
    const previous = {
      cash: state.company.cash,
      monthlyBurn: state.company.monthlyBurn,
      reputation: state.company.reputation,
      marketSentiment: state.marketSentiment,
      unemploymentRate: state.society.unemploymentRate,
      specialEventCount: state.society.specialEventCount,
    };
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];

    applySpecialEvent(state, { type: "bad" as never });

    expect(state.company.cash).toBe(previous.cash);
    expect(state.company.monthlyBurn).toBe(previous.monthlyBurn);
    expect(state.company.reputation).toBe(previous.reputation);
    expect(state.marketSentiment).toBe(previous.marketSentiment);
    expect(state.society.unemploymentRate).toBe(previous.unemploymentRate);
    expect(state.society.specialEventCount).toBe(previous.specialEventCount);
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
  });

  it("keeps state and event payloads finite when applying events to corrupted state", () => {
    const eventTypes = ["financial_crisis", "supply_chain_shock", "geopolitical_tension"] as const;

    for (const type of eventTypes) {
      const state = createInitialGameState({ seed: 1 });
      state.company.cash = Number.NaN;
      state.company.monthlyBurn = Infinity;
      state.company.reputation = Number.NaN;
      state.marketSentiment = Number.NaN;
      state.society.unemploymentRate = Number.NaN;
      state.society.specialEventCount = Infinity;

      applySpecialEvent(state, { type });

      const event = state.events.at(-1);
      const cashDelta = event?.type === "special_event" ? event.cashDelta : 0;
      expect(Number.isFinite(state.company.cash)).toBe(true);
      expect(Number.isFinite(state.company.monthlyBurn)).toBe(true);
      expect(Number.isFinite(state.company.reputation)).toBe(true);
      expect(Number.isFinite(state.marketSentiment)).toBe(true);
      expect(Number.isFinite(state.society.unemploymentRate)).toBe(true);
      expect(Number.isFinite(state.society.specialEventCount)).toBe(true);
      expect(Number.isFinite(cashDelta)).toBe(true);
    }
  });

  it("keeps triggered special events finite for corrupted cash state", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.cash = Number.NaN;

    const result = maybeApplySpecialEvent(state, {
      triggerRoll: 0,
      typeRoll: 0,
    });

    expect(result).toBe("financial_crisis");
    expect(Number.isFinite(state.company.cash)).toBe(true);
    const event = state.events.at(-1);
    const cashDelta = event?.type === "special_event" ? event.cashDelta : 0;
    expect(Number.isFinite(cashDelta)).toBe(true);
  });
});
