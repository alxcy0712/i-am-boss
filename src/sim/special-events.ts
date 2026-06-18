import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import { clamp } from "./rng";
import type { GameState } from "./types";

export type SpecialEventType = "financial_crisis" | "supply_chain_shock" | "geopolitical_tension";

export interface SpecialEvent {
  type: SpecialEventType;
}

export interface SpecialEventTriggerInput {
  triggerRoll: number;
  typeRoll: number;
}

export function maybeApplySpecialEvent(
  state: GameState,
  input: SpecialEventTriggerInput,
): SpecialEventType | undefined {
  if (input.triggerRoll >= PROBABILITY_CONFIG.specialEvents.monthlyChance) {
    return undefined;
  }

  const type = selectSpecialEventType(input.typeRoll);
  applySpecialEvent(state, { type });
  return type;
}

export function selectSpecialEventType(roll: number): SpecialEventType {
  const config = PROBABILITY_CONFIG.specialEvents;
  const totalWeight =
    config.financialCrisisWeight + config.supplyChainShockWeight + config.geopoliticalTensionWeight;
  const weightedRoll = clamp(roll, 0, 0.999999) * totalWeight;

  if (weightedRoll < config.financialCrisisWeight) {
    return "financial_crisis";
  }

  if (weightedRoll < config.financialCrisisWeight + config.supplyChainShockWeight) {
    return "supply_chain_shock";
  }

  return "geopolitical_tension";
}

export function applySpecialEvent(state: GameState, event: SpecialEvent): void {
  const config = PROBABILITY_CONFIG.specialEvents;

  if (event.type === "financial_crisis") {
    applyEventDeltas(state, {
      type: event.type,
      cashDelta: -Math.round(state.company.cash * config.financialCrisisCashLossRate),
      marketSentimentDelta: config.financialCrisisSentimentDelta,
      unemploymentDelta: config.financialCrisisUnemploymentDelta,
    });
    return;
  }

  if (event.type === "supply_chain_shock") {
    const burnIncrease = Math.round(state.company.monthlyBurn * config.supplyChainBurnIncreaseRate);
    state.company.monthlyBurn += burnIncrease;
    applyEventDeltas(state, {
      type: event.type,
      cashDelta: -Math.round(state.company.cash * config.supplyChainCashLossRate),
      marketSentimentDelta: config.supplyChainSentimentDelta,
      unemploymentDelta: 0,
    });
    return;
  }

  applyEventDeltas(state, {
    type: event.type,
    cashDelta: 0,
    reputationDelta: -config.geopoliticalTensionReputationLoss,
    marketSentimentDelta: config.geopoliticalTensionSentimentDelta,
    unemploymentDelta: config.geopoliticalTensionUnemploymentDelta,
  });
}

function applyEventDeltas(
  state: GameState,
  input: {
    type: SpecialEventType;
    cashDelta: number;
    reputationDelta?: number;
    marketSentimentDelta: number;
    unemploymentDelta: number;
  },
): void {
  state.company.cash += input.cashDelta;
  state.company.reputation = Math.max(0, state.company.reputation + (input.reputationDelta ?? 0));
  state.marketSentiment = clamp(state.marketSentiment + input.marketSentimentDelta, 0.55, 1.45);
  state.society.unemploymentRate = clamp(
    state.society.unemploymentRate + input.unemploymentDelta,
    0.02,
    0.3,
  );
  state.society.specialEventCount += 1;
  recordGameEvent(state, {
    type: "special_event",
    eventType: input.type,
    cashDelta: input.cashDelta,
    reputationDelta: input.reputationDelta,
    marketSentimentDelta: input.marketSentimentDelta,
    unemploymentDelta: input.unemploymentDelta,
  });
}
