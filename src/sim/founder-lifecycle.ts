import { PROBABILITY_CONFIG } from "../config/probabilities";
import {
  calculatePersonalHappiness,
  maybeProcessDivorce,
  processPersonalExpenses,
} from "./founder-life";
import { clamp } from "./rng";
import type { GameState } from "./types";

export interface FounderLifecycleInput {
  daysElapsed: number;
}

export function advanceFounderLifecycle(state: GameState, input: FounderLifecycleInput): void {
  if (!Number.isFinite(input.daysElapsed) || input.daysElapsed <= 0) {
    return;
  }

  if (Number.isFinite(state.day)) {
    const previousAgeYears = Math.floor(
      (state.day - input.daysElapsed) / PROBABILITY_CONFIG.founder.daysPerAgeYear,
    );
    const currentAgeYears = Math.floor(state.day / PROBABILITY_CONFIG.founder.daysPerAgeYear);
    state.founder.age += currentAgeYears - previousAgeYears;
  }

  const monthFraction = input.daysElapsed / 30;
  const culturePressure = readFinite(state.company.culturePressure, 0);
  const stressTolerance = readFinite(state.founder.abilities.stressTolerance, 0);
  const morale = readFinite(state.company.morale, 5);
  const founderHealth = readFinite(state.founder.health, 100);
  const stressGap = clamp((culturePressure - stressTolerance) / 10, 0, 1);
  const moraleGap = clamp((5 - morale) / 5, 0, 1);

  const personalHappiness = readFinite(calculatePersonalHappiness(state), 5);
  const happinessModifier = (5 - personalHappiness) / 10;

  const healthLoss =
    monthFraction *
    (PROBABILITY_CONFIG.founder.monthlyBaseHealthLoss +
      stressGap * PROBABILITY_CONFIG.founder.culturePressureHealthWeight +
      moraleGap * PROBABILITY_CONFIG.founder.lowMoraleHealthWeight +
      happinessModifier * PROBABILITY_CONFIG.personalLife.workLifeBalanceWeight);

  if (healthLoss > 0) {
    state.founder.health = clamp(founderHealth - healthLoss, 0, 100);
  } else {
    state.founder.health = clamp(founderHealth, 0, 100);
  }

  if (monthFraction >= 1) {
    processPersonalExpenses(state);
    maybeProcessDivorce(state);
  }
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
