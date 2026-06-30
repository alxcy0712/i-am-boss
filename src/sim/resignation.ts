import { PROBABILITY_CONFIG } from "../config/probabilities";
import { calculateCultureFit, isCompanyCulture } from "./culture-fit";
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
  const config = PROBABILITY_CONFIG.resignation;
  if (
    !Number.isFinite(input.salary) ||
    !Number.isFinite(input.targetSalary) ||
    input.targetSalary <= 0 ||
    !Number.isFinite(input.stressTolerance) ||
    !Number.isFinite(input.culturePressure) ||
    !Number.isFinite(input.morale)
  ) {
    return config.baseRisk;
  }

  const salaryGap = clamp((input.targetSalary - input.salary) / input.targetSalary, 0, 1);
  const pressureGap = clamp((input.culturePressure - input.stressTolerance) / 10, 0, 1);
  const moraleGap = clamp((10 - input.morale) / 10, 0, 1);
  const personality = Number.isFinite(input.personality)
    ? clamp(input.personality as number, 0, 10)
    : undefined;
  const cultureMismatch =
    isCompanyCulture(input.culture) && personality !== undefined
      ? 1 -
        calculateCultureFit({
          culture: input.culture,
          personality,
        })
      : 0;

  const personalityFactor =
    personality !== undefined
      ? config.lowPersonalitySalaryWeight +
        (personality / 10) *
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
