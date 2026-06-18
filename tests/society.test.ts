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
});
