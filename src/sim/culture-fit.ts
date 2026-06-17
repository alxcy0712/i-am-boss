import { PROBABILITY_CONFIG } from "../config/probabilities";
import type { CompanyCulture, EmployeePersonality } from "./types";

export interface CultureFitInput {
  culture: CompanyCulture;
  personality: EmployeePersonality;
}

export function calculateCultureFit(input: CultureFitInput): number {
  return PROBABILITY_CONFIG.cultureFit.compatibilityByCulture[input.culture][
    input.personality
  ];
}
