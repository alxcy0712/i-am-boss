import { applyMacroCycle, getKondratievPhase } from "../src/sim/macro-cycle";
import { createInitialGameState } from "../src/sim/state";

describe("getKondratievPhase", () => {
  it("maps long-run days into deterministic economic cycle phases", () => {
    expect(getKondratievPhase(0).name).toBe("recovery");
    expect(getKondratievPhase(365 * 15).name).toBe("prosperity");
    expect(getKondratievPhase(365 * 30).name).toBe("recession");
    expect(getKondratievPhase(365 * 45).name).toBe("depression");
  });

  it("wraps negative days into the same deterministic cycle", () => {
    expect(getKondratievPhase(-1).name).toBe("depression");
  });

  it("uses recovery for non-finite days", () => {
    expect(getKondratievPhase(Number.NaN).name).toBe("recovery");
    expect(getKondratievPhase(Infinity).name).toBe("recovery");
  });
});

describe("applyMacroCycle", () => {
  it("updates market sentiment and unemployment from the current cycle phase", () => {
    const state = createInitialGameState({ seed: 1 });

    applyMacroCycle(state, 365 * 45);

    expect(state.society.cyclePhase).toBe("depression");
    expect(state.marketSentiment).toBeLessThan(1);
    expect(state.society.unemploymentRate).toBeGreaterThan(0.1);
  });
});
