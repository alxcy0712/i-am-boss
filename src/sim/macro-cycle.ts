import { PROBABILITY_CONFIG } from "../config/probabilities";
import type { GameState, MacroCyclePhase } from "./types";

export interface MacroCycleInfo {
  name: MacroCyclePhase;
  marketSentiment: number;
  unemploymentRate: number;
}

const PHASES: MacroCyclePhase[] = ["recovery", "prosperity", "recession", "depression"];

export function getKondratievPhase(day: number): MacroCycleInfo {
  const cycleDay = normalizeCycleDay(day, PROBABILITY_CONFIG.macroCycle.cycleLengthDays);
  const phaseLength = PROBABILITY_CONFIG.macroCycle.cycleLengthDays / PHASES.length;
  const phase = PHASES[Math.floor(cycleDay / phaseLength)] ?? "recovery";
  const config = PROBABILITY_CONFIG.macroCycle.phases[phase];

  return {
    name: phase,
    marketSentiment: config.marketSentiment,
    unemploymentRate: config.unemploymentRate,
  };
}

export function applyMacroCycle(state: GameState, day: number): MacroCycleInfo {
  const cycle = getKondratievPhase(day);
  state.society.cyclePhase = cycle.name;
  state.society.unemploymentRate = cycle.unemploymentRate;
  state.marketSentiment = cycle.marketSentiment;

  return cycle;
}

function normalizeCycleDay(day: number, cycleLengthDays: number): number {
  if (!Number.isFinite(day)) {
    return 0;
  }

  return ((day % cycleLengthDays) + cycleLengthDays) % cycleLengthDays;
}
