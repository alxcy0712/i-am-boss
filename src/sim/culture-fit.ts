import { PROBABILITY_CONFIG } from "../config/probabilities";
import type { CompanyCulture } from "./types";

export interface CultureFitInput {
  culture: CompanyCulture;
  personality: number;
}

function interpolatePersonality(
  personality: number,
  referencePoints: readonly number[],
  values: readonly number[],
): number {
  const clamped = Math.max(
    referencePoints[0],
    Math.min(referencePoints[referencePoints.length - 1], personality),
  );

  if (clamped <= referencePoints[0]) return values[0];
  if (clamped >= referencePoints[referencePoints.length - 1]) return values[values.length - 1];

  for (let i = 0; i < referencePoints.length - 1; i++) {
    if (clamped <= referencePoints[i + 1]) {
      const t = (clamped - referencePoints[i]) / (referencePoints[i + 1] - referencePoints[i]);
      return values[i] + (values[i + 1] - values[i]) * t;
    }
  }

  return values[values.length - 1];
}

export function calculateCultureFit(input: CultureFitInput): number {
  const { personalityReferencePoints, compatibilityByCulture } = PROBABILITY_CONFIG.cultureFit;
  const cultureValues = compatibilityByCulture[input.culture];
  return interpolatePersonality(input.personality, personalityReferencePoints, cultureValues);
}

export function resolvePersonalityLabel(personality: number): string {
  if (personality <= 3) return "steady";
  if (personality <= 6) return "collaborative";
  if (personality <= 8) return "ambitious";
  return "independent";
}
