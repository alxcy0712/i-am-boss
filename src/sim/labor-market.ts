import { PROBABILITY_CONFIG } from "../config/probabilities";
import type { Candidate } from "./hiring";

export interface LaborMarketInput {
  unemploymentRate: number;
}

export function applyLaborMarketPressure(candidate: Candidate, input: LaborMarketInput): Candidate {
  let multiplier = 1;

  if (input.unemploymentRate >= PROBABILITY_CONFIG.laborMarket.highUnemploymentThreshold) {
    multiplier -= PROBABILITY_CONFIG.laborMarket.highUnemploymentSalaryDiscount;
  }

  if (input.unemploymentRate <= PROBABILITY_CONFIG.laborMarket.tightMarketThreshold) {
    multiplier += PROBABILITY_CONFIG.laborMarket.tightMarketSalaryPremium;
  }

  return {
    ...candidate,
    targetSalary: Math.round(candidate.targetSalary * multiplier),
    minimumSalary: Math.round(candidate.minimumSalary * multiplier),
  };
}
