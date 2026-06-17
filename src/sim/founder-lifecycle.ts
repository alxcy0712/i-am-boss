import { PROBABILITY_CONFIG } from "../config/probabilities";
import { clamp } from "./rng";
import type { GameState } from "./types";

export interface FounderLifecycleInput {
  daysElapsed: number;
}

export function advanceFounderLifecycle(
  state: GameState,
  input: FounderLifecycleInput
): void {
  const previousAgeYears = Math.floor(
    (state.day - input.daysElapsed) / PROBABILITY_CONFIG.founder.daysPerAgeYear
  );
  const currentAgeYears = Math.floor(
    state.day / PROBABILITY_CONFIG.founder.daysPerAgeYear
  );
  state.founder.age += currentAgeYears - previousAgeYears;

  const monthFraction = input.daysElapsed / 30;
  const stressGap = clamp(
    (state.company.culturePressure - state.founder.abilities.stressTolerance) / 10,
    0,
    1
  );
  const moraleGap = clamp((5 - state.company.morale) / 5, 0, 1);
  const healthLoss =
    monthFraction *
    (PROBABILITY_CONFIG.founder.monthlyBaseHealthLoss +
      stressGap * PROBABILITY_CONFIG.founder.culturePressureHealthWeight +
      moraleGap * PROBABILITY_CONFIG.founder.lowMoraleHealthWeight);

  if (healthLoss > 0) {
    state.founder.health = clamp(state.founder.health - healthLoss, 0, 100);
  }
}
