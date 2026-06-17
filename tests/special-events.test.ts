import { applySpecialEvent, selectSpecialEventType } from "../src/sim/special-events";
import { createInitialGameState } from "../src/sim/state";

describe("special events", () => {
  it("selects abstract event types from weighted rolls", () => {
    expect(selectSpecialEventType(0.1)).toBe("financial_crisis");
    expect(selectSpecialEventType(0.55)).toBe("supply_chain_shock");
    expect(selectSpecialEventType(0.9)).toBe("geopolitical_tension");
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
});
