import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import { createSeededRng } from "./rng";
import type { GameState } from "./types";

export interface SecuritiesMarketInput {
  seed: number;
}

export function updateListedMarketValue(
  state: GameState,
  input: SecuritiesMarketInput
): number {
  const currentValue = state.company.listedMarketValue ?? state.company.valuation;
  const sentimentMove =
    (state.marketSentiment - 1) * PROBABILITY_CONFIG.securitiesMarket.sentimentWeight;
  const reputationMove =
    ((state.company.reputation - 5) / 10) * PROBABILITY_CONFIG.securitiesMarket.reputationWeight;
  const noise =
    (createSeededRng(input.seed).next() - 0.5) * PROBABILITY_CONFIG.securitiesMarket.noiseWeight;
  const nextValue = Math.max(0, currentValue * (1 + sentimentMove + reputationMove + noise));

  state.company.listedMarketValue = nextValue;
  recordGameEvent(state, {
    type: "listed_market_value",
    value: nextValue
  });
  return nextValue;
}
