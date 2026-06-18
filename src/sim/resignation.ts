import { PROBABILITY_CONFIG } from "../config/probabilities";
import { calculateCultureFit } from "./culture-fit";
import { clamp } from "./rng";
import type { CompanyCulture } from "./types";

export interface ResignationRiskInput {
  salary: number;
  targetSalary: number;
  stressTolerance: number;
  culturePressure: number;
  morale: number;
  culture?: CompanyCulture;
  personality?: number;
}

export function calculateResignationRisk(input: ResignationRiskInput): number {
  const salaryGap = clamp((input.targetSalary - input.salary) / input.targetSalary, 0, 1);
  const pressureGap = clamp((input.culturePressure - input.stressTolerance) / 10, 0, 1);
  const moraleGap = clamp((10 - input.morale) / 10, 0, 1);
  const cultureMismatch =
    input.culture !== undefined && input.personality !== undefined
      ? 1 -
        calculateCultureFit({
          culture: input.culture,
          personality: input.personality,
        })
      : 0;

  const config = PROBABILITY_CONFIG.resignation;
  const personalityFactor =
    input.personality !== undefined
      ? config.lowPersonalitySalaryWeight +
        (input.personality / 10) *
          (config.highPersonalitySalaryWeight - config.lowPersonalitySalaryWeight)
      : 1;

  return clamp(
    config.baseRisk +
      salaryGap * config.salaryGapWeight * personalityFactor +
      pressureGap * config.pressureWeight +
      moraleGap * config.moraleWeight +
      cultureMismatch * PROBABILITY_CONFIG.cultureFit.resignationRiskWeight,
    0,
    0.95,
  );
}
