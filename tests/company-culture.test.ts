import { changeCompanyCulture } from "../src/sim/company-culture";
import { createInitialGameState } from "../src/sim/state";

describe("changeCompanyCulture", () => {
  it("changes company culture and applies transition costs", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;
    const previousMorale = state.company.morale;

    changeCompanyCulture(state, { culture: "wolf" });

    expect(state.company.culture).toBe("wolf");
    expect(state.company.culturePressure).toBe(9);
    expect(state.company.cash).toBeLessThan(previousCash);
    expect(state.company.morale).toBeLessThan(previousMorale);
    expect(state.eventLog.at(-1)).toBe("Culture changed: wolf");
  });

  it("supports lower-pressure company ideals", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.culture = "wolf";
    state.company.culturePressure = 9;

    changeCompanyCulture(state, { culture: "laissez-faire" });

    expect(state.company.culture).toBe("laissez-faire");
    expect(state.company.culturePressure).toBe(3);
    expect(state.company.morale).toBeGreaterThan(7);
  });

  it("ignores invalid culture values", () => {
    const state = createInitialGameState({ seed: 1 });
    const previous = {
      culture: state.company.culture,
      culturePressure: state.company.culturePressure,
      cash: state.company.cash,
      morale: state.company.morale,
      reputation: state.company.reputation,
    };

    changeCompanyCulture(state, { culture: undefined as never });

    expect(state.company).toMatchObject(previous);
    expect(state.eventLog).not.toContain("Culture changed: undefined");
  });
});
