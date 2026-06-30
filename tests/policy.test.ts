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

  it("keeps granted support finite for corrupted company state", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.industry = "technology";
    state.company.cash = Number.NaN;
    state.company.reputation = 6;
    state.society.policySupportCount = Infinity;

    const result = evaluatePolicySupport(state, {
      priorityIndustries: ["technology"],
      minimumReputation: 5,
    });

    expect(result.granted).toBe(true);
    expect(Number.isFinite(state.company.cash)).toBe(true);
    expect(Number.isFinite(state.company.reputation)).toBe(true);
    expect(Number.isFinite(state.society.policySupportCount)).toBe(true);
    expect(state.company.cash).toBe(result.cashDelta);
    expect(state.company.reputation).toBe(7);
    expect(state.society.policySupportCount).toBe(1);
  });

  it("keeps ineligible requests finite for corrupted company state", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.industry = "technology";
    state.company.cash = Number.NaN;
    state.company.reputation = Number.NaN;
    state.society.policySupportCount = Infinity;

    const result = evaluatePolicySupport(state, {
      priorityIndustries: ["biotech"],
      minimumReputation: 5,
    });

    expect(result.granted).toBe(false);
    expect(Number.isFinite(state.company.cash)).toBe(true);
    expect(Number.isFinite(state.company.reputation)).toBe(true);
    expect(Number.isFinite(state.society.policySupportCount)).toBe(true);
    expect(state.company.cash).toBe(0);
    expect(state.company.reputation).toBe(0);
    expect(state.society.policySupportCount).toBe(0);
  });
});
