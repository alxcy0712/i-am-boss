import { PROBABILITY_CONFIG } from "../config/probabilities";
import type { Candidate } from "./hiring";

export interface LaborMarketInput {
  unemploymentRate: number;
}

export function applyLaborMarketPressure(candidate: Candidate, input: LaborMarketInput): Candidate {
  let multiplier = 1;
  const unemploymentRate = readFinite(input.unemploymentRate, 0.07);
  const targetSalary = readPositiveFinite(
    candidate.targetSalary,
    PROBABILITY_CONFIG.staffing.baseMonthlySalaryByRole[candidate.role] ?? 10_000,
  );
  const minimumSalary = Math.min(
    readPositiveFinite(candidate.minimumSalary, Math.round(targetSalary * 0.82)),
    targetSalary,
  );

  if (unemploymentRate >= PROBABILITY_CONFIG.laborMarket.highUnemploymentThreshold) {
    multiplier -= PROBABILITY_CONFIG.laborMarket.highUnemploymentSalaryDiscount;
  }

  if (unemploymentRate <= PROBABILITY_CONFIG.laborMarket.tightMarketThreshold) {
    multiplier += PROBABILITY_CONFIG.laborMarket.tightMarketSalaryPremium;
  }

  return {
    ...candidate,
    targetSalary: Math.round(targetSalary * multiplier),
    minimumSalary: Math.round(minimumSalary * multiplier),
  };
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function readPositiveFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
