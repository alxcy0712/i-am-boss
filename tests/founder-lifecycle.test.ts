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

  it("ignores non-finite elapsed days without corrupting founder state", () => {
    const state = createInitialGameState({ seed: 1 });
    const previous = {
      age: state.founder.age,
      health: state.founder.health,
      cash: state.company.cash,
    };

    advanceFounderLifecycle(state, { daysElapsed: Number.NaN });

    expect(state.founder.age).toBe(previous.age);
    expect(state.founder.health).toBe(previous.health);
    expect(state.company.cash).toBe(previous.cash);
  });

  it("keeps founder state finite when the current day is corrupted", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousAge = state.founder.age;
    state.day = Number.NaN;
    state.company.culturePressure = 10;
    state.company.morale = 2;

    advanceFounderLifecycle(state, { daysElapsed: 30 });

    expect(state.founder.age).toBe(previousAge);
    expect(Number.isFinite(state.founder.health)).toBe(true);
  });

  it("normalizes corrupted health inputs during lifecycle advancement", () => {
    const state = createInitialGameState({ seed: 1 });
    state.founder.health = Number.NaN;
    state.founder.abilities.stressTolerance = Number.NaN;
    state.company.culturePressure = Infinity;
    state.company.morale = Number.NaN;

    advanceFounderLifecycle(state, { daysElapsed: 30 });

    expect(Number.isFinite(state.founder.health)).toBe(true);
    expect(state.founder.health).toBeGreaterThanOrEqual(0);
    expect(state.founder.health).toBeLessThanOrEqual(100);
  });
});
