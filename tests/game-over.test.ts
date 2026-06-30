import { checkGameOver } from "../src/sim/game-over";
import { createInitialGameState } from "../src/sim/state";

describe("checkGameOver", () => {
  it("ends the game when cash falls below zero", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.cash = -1;

    expect(checkGameOver(state)).toEqual({
      isGameOver: true,
      reason: "bankruptcy",
    });
  });

  it("ends the game when the founder reaches retirement age", () => {
    const state = createInitialGameState({ seed: 1 });
    state.founder.age = 65;

    expect(checkGameOver(state)).toEqual({
      isGameOver: true,
      reason: "retirement",
    });
  });

  it("ends the game when founder health reaches zero", () => {
    const state = createInitialGameState({ seed: 1 });
    state.founder.health = 0;

    expect(checkGameOver(state)).toEqual({
      isGameOver: true,
      reason: "death",
    });
  });

  it("does not end the game for unknown non-finite status values", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.cash = Number.NaN;
    state.founder.health = Number.NaN;
    state.founder.age = Number.NaN;

    expect(checkGameOver(state)).toEqual({ isGameOver: false });
  });
});
