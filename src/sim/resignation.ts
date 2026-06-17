import { PROBABILITY_CONFIG } from "../config/probabilities";
import { calculateCultureFit } from "./culture-fit";
import { clamp } from "./rng";
import type { CompanyCulture, EmployeePersonality } from "./types";

export interface ResignationRiskInput {
  salary: number;
  targetSalary: number;
  stressTolerance: number;
  culturePressure: number;
  morale: number;
  culture?: CompanyCulture;
  personality?: EmployeePersonality;
}

export function calculateResignationRisk(input: ResignationRiskInput): number {
  const salaryGap = clamp((input.targetSalary - input.salary) / input.targetSalary, 0, 1);
  const pressureGap = clamp((input.culturePressure - input.stressTolerance) / 10, 0, 1);
  const moraleGap = clamp((10 - input.morale) / 10, 0, 1);
  const cultureMismatch =
    input.culture && input.personality
      ? 1 -
        calculateCultureFit({
          culture: input.culture,
          personality: input.personality
        })
      : 0;

  return clamp(
    PROBABILITY_CONFIG.resignation.baseRisk +
      salaryGap * PROBABILITY_CONFIG.resignation.salaryGapWeight +
      pressureGap * PROBABILITY_CONFIG.resignation.pressureWeight +
      moraleGap * PROBABILITY_CONFIG.resignation.moraleWeight +
      cultureMismatch * PROBABILITY_CONFIG.cultureFit.resignationRiskWeight,
    0,
    0.95
  );
}
