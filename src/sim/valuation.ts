import { PROBABILITY_CONFIG } from "../config/probabilities";

export type ValuationKind = "private_estimate" | "listed_market";

export interface ValuationInput {
  isPublic: boolean;
  annualRevenue: number;
  profitMargin: number;
  reputation: number;
  marketSentiment: number;
  listedMarketValue?: number;
  operationalCapability?: number;
}

export interface ValuationResult {
  kind: ValuationKind;
  value: number;
}

export function calculateCompanyValuation(input: ValuationInput): ValuationResult {
  if (input.isPublic) {
    return {
      kind: "listed_market",
      value: readFinite(input.listedMarketValue, 0),
    };
  }

  if (
    !Number.isFinite(input.annualRevenue) ||
    !Number.isFinite(input.profitMargin) ||
    !Number.isFinite(input.reputation) ||
    !Number.isFinite(input.marketSentiment)
  ) {
    return {
      kind: "private_estimate",
      value: 0,
    };
  }

  const operationalCapability = readFinite(input.operationalCapability, 5);
  const capabilityBonus =
    (operationalCapability / 10) *
    PROBABILITY_CONFIG.companyResources.operationalCapabilityRevenueMultiplier;

  const multiple =
    PROBABILITY_CONFIG.valuation.privateRevenueMultiple +
    input.profitMargin * PROBABILITY_CONFIG.valuation.profitMarginWeight +
    (input.reputation / 10) * PROBABILITY_CONFIG.valuation.reputationWeight +
    capabilityBonus;

  return {
    kind: "private_estimate",
    value: input.annualRevenue * multiple * input.marketSentiment,
  };
}

function readFinite(value: number | undefined, fallback: number): number {
  return value == null || !Number.isFinite(value) ? fallback : value;
}
