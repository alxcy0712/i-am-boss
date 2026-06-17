import { PROBABILITY_CONFIG } from "../config/probabilities";
import type { GameOverReason, GameState } from "./types";

export interface GameOverStatus {
  isGameOver: boolean;
  reason?: GameOverReason;
}

export function checkGameOver(state: GameState): GameOverStatus {
  if (state.company.cash < 0) {
    return { isGameOver: true, reason: "bankruptcy" };
  }

  if (state.founder.health <= PROBABILITY_CONFIG.founder.minimumHealth) {
    return { isGameOver: true, reason: "death" };
  }

  if (state.founder.age >= PROBABILITY_CONFIG.founder.retirementAge) {
    return { isGameOver: true, reason: "retirement" };
  }

  return { isGameOver: false };
}
