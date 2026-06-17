import { PROBABILITY_CONFIG } from "../config/probabilities";

export type ValuationKind = "private_estimate" | "listed_market";

export interface ValuationInput {
  isPublic: boolean;
  annualRevenue: number;
  profitMargin: number;
  reputation: number;
  marketSentiment: number;
  listedMarketValue?: number;
}

export interface ValuationResult {
  kind: ValuationKind;
  value: number;
}

export function calculateCompanyValuation(input: ValuationInput): ValuationResult {
  if (input.isPublic) {
    return {
      kind: "listed_market",
      value: input.listedMarketValue ?? 0
    };
  }

  const multiple =
    PROBABILITY_CONFIG.valuation.privateRevenueMultiple +
    input.profitMargin * PROBABILITY_CONFIG.valuation.profitMarginWeight +
    (input.reputation / 10) * PROBABILITY_CONFIG.valuation.reputationWeight;

  return {
    kind: "private_estimate",
    value: input.annualRevenue * multiple * input.marketSentiment
  };
}
