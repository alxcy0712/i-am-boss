export interface ScoreInput {
  daysPlayed: number;
  companyValuation: number;
  playerWealth: number;
}

export function calculateFinalScore(input: ScoreInput): number {
  return input.daysPlayed + input.companyValuation * 2 + input.playerWealth;
}
