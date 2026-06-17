import { advanceGameState, summarizeGameState } from "../src/harness/sim-harness";
import { createInitialGameState } from "../src/sim/state";

describe("advanceGameState lifecycle endings", () => {
  it("records retirement for a sustainable company that reaches retirement age", () => {
    const state = createInitialGameState({ seed: 11, initialChoiceId: "resilient-founder" });
    state.founder.age = 64;
    state.company.cash = 10_000_000;
    state.company.annualRevenue = 2_000_000;
    state.company.monthlyBurn = 1_000;
    state.company.reputation = 8;
    state.company.headcount = 30;

    const result = advanceGameState(state, { seed: 11, days: 730 });
    const summary = summarizeGameState(result.state, result.gameOverReason);

    expect(summary.gameOverReason).toBe("retirement");
    expect(summary.founderAge).toBe(65);
    expect(summary.daysPlayed).toBe(365);
    expect(summary.eventLog.at(-1)).toBe("Game over: retirement");
  });

  it("records founder death when health reaches zero under severe pressure", () => {
    const state = createInitialGameState({ seed: 12, initialChoiceId: "technical-founder" });
    state.founder.health = 0.01;
    state.founder.abilities.stressTolerance = 0;
    state.company.cash = 10_000_000;
    state.company.annualRevenue = 2_000_000;
    state.company.monthlyBurn = 1_000;
    state.company.culturePressure = 10;
    state.company.morale = 0;

    const result = advanceGameState(state, { seed: 12, days: 30 });
    const summary = summarizeGameState(result.state, result.gameOverReason);

    expect(summary.gameOverReason).toBe("death");
    expect(summary.founderHealth).toBe(0);
    expect(summary.eventLog.at(-1)).toBe("Game over: death");
  });
});
