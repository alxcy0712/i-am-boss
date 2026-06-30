import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import { createSeededRng } from "./rng";
import type { GameState } from "./types";

export interface SecuritiesMarketInput {
  seed: number;
}

export function updateListedMarketValue(state: GameState, input: SecuritiesMarketInput): number {
  if (!state.company.isPublic) {
    return Number.isFinite(state.company.valuation) ? state.company.valuation : 0;
  }

  const currentValue = state.company.listedMarketValue ?? state.company.valuation;
  if (
    !Number.isFinite(currentValue) ||
    !Number.isFinite(state.marketSentiment) ||
    !Number.isFinite(state.company.reputation) ||
    !Number.isFinite(state.company.governanceMetrics?.overallScore ?? 0)
  ) {
    const fallbackValue = Number.isFinite(currentValue) ? currentValue : 0;
    state.company.listedMarketValue = fallbackValue;
    return fallbackValue;
  }

  const sentimentMove =
    (state.marketSentiment - 1) * PROBABILITY_CONFIG.securitiesMarket.sentimentWeight;
  const reputationMove =
    ((state.company.reputation - 5) / 10) * PROBABILITY_CONFIG.securitiesMarket.reputationWeight;
  const noise =
    (createSeededRng(input.seed).next() - 0.5) * PROBABILITY_CONFIG.securitiesMarket.noiseWeight;

  const governanceScore = state.company.governanceMetrics?.overallScore;
  const governanceMove =
    governanceScore != null
      ? (governanceScore - 0.5) * 2 * PROBABILITY_CONFIG.listedGovernance.marketPerceptionWeight
      : 0;

  const nextValue = Math.max(
    0,
    currentValue * (1 + sentimentMove + reputationMove + noise + governanceMove),
  );

  state.company.listedMarketValue = nextValue;
  recordGameEvent(state, {
    type: "listed_market_value",
    value: nextValue,
  });
  return nextValue;
}
