export interface ScoreInput {
  daysPlayed: number;
  companyValuation: number;
  playerWealth: number;
}

export interface ScoreBreakdown {
  daysPoints: number;
  valuationPoints: number;
  wealthPoints: number;
  totalScore: number;
}

export function calculateScoreBreakdown(input: ScoreInput): ScoreBreakdown {
  const daysPoints = readFinite(input.daysPlayed) * 1;
  const valuationPoints = readFinite(input.companyValuation) * 2;
  const wealthPoints = readFinite(input.playerWealth) * 1;
  return {
    daysPoints,
    valuationPoints,
    wealthPoints,
    totalScore: daysPoints + valuationPoints + wealthPoints,
  };
}

export function calculateFinalScore(input: ScoreInput): number {
  return calculateScoreBreakdown(input).totalScore;
}

/** Inverse of 1:2:1 formula: wealth = score - days - valuation*2 (clamped ≥ 0) */
export function calculateWealthFromScore(
  score: number,
  daysPlayed: number,
  companyValuation: number,
): number {
  if (
    !Number.isFinite(score) ||
    !Number.isFinite(daysPlayed) ||
    !Number.isFinite(companyValuation)
  ) {
    return 0;
  }

  return Math.max(0, score - daysPlayed - companyValuation * 2);
}

function readFinite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
