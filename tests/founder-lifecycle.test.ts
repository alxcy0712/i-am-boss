import { advanceFounderLifecycle } from "../src/sim/founder-lifecycle";
import { createInitialGameState } from "../src/sim/state";

describe("advanceFounderLifecycle", () => {
  it("ages the founder by elapsed in-game days", () => {
    const state = createInitialGameState({ seed: 1 });

    advanceFounderLifecycle(state, { daysElapsed: 365 });

    expect(state.founder.age).toBe(26);
  });

  it("reduces health when culture pressure exceeds stress tolerance", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.culturePressure = 10;
    state.company.morale = 2;
    const previousHealth = state.founder.health;

    advanceFounderLifecycle(state, { daysElapsed: 30 });

    expect(state.founder.health).toBeLessThan(previousHealth);
  });

  it("keeps resilient founders healthier under the same pressure", () => {
    const technical = createInitialGameState({
      seed: 1,
      initialChoiceId: "technical-founder",
    });
    const resilient = createInitialGameState({
      seed: 1,
      initialChoiceId: "resilient-founder",
    });
    technical.company.culturePressure = 10;
    resilient.company.culturePressure = 10;
    technical.company.morale = 2;
    resilient.company.morale = 2;

    advanceFounderLifecycle(technical, { daysElapsed: 30 });
    advanceFounderLifecycle(resilient, { daysElapsed: 30 });

    expect(resilient.founder.health).toBeGreaterThan(technical.founder.health);
  });
});
