import { evaluatePolicySupport } from "../src/sim/policy";
import { createInitialGameState } from "../src/sim/state";

describe("evaluatePolicySupport", () => {
  it("grants support when the company matches policy priorities", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.reputation = 6;
    state.company.industry = "technology";

    const result = evaluatePolicySupport(state, {
      priorityIndustries: ["technology", "advanced-manufacturing"],
      minimumReputation: 5,
    });

    expect(result.granted).toBe(true);
    expect(result.cashDelta).toBeGreaterThan(0);
    expect(state.company.cash).toBeGreaterThan(100000);
  });

  it("records ineligible policy requests without changing cash", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;

    const result = evaluatePolicySupport(state, {
      priorityIndustries: ["biotech"],
      minimumReputation: 5,
    });

    expect(result.granted).toBe(false);
    expect(state.company.cash).toBe(previousCash);
  });
});
