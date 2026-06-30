import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import { clamp } from "./rng";
import type { GameState } from "./types";

export type SpecialEventType = "financial_crisis" | "supply_chain_shock" | "geopolitical_tension";

const SPECIAL_EVENT_TYPES = new Set<SpecialEventType>([
  "financial_crisis",
  "supply_chain_shock",
  "geopolitical_tension",
]);

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
  if (!Number.isFinite(input.triggerRoll) || !Number.isFinite(input.typeRoll)) {
    return undefined;
  }

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
  const finiteRoll = Number.isFinite(roll) ? roll : 0;
  const weightedRoll = clamp(finiteRoll, 0, 0.999999) * totalWeight;

  if (weightedRoll < config.financialCrisisWeight) {
    return "financial_crisis";
  }

  if (weightedRoll < config.financialCrisisWeight + config.supplyChainShockWeight) {
    return "supply_chain_shock";
  }

  return "geopolitical_tension";
}

export function applySpecialEvent(state: GameState, event: SpecialEvent): void {
  if (!SPECIAL_EVENT_TYPES.has(event.type)) {
    return;
  }

  const config = PROBABILITY_CONFIG.specialEvents;
  state.company.monthlyBurn = readNonNegativeFinite(state.company.monthlyBurn, 0);

  if (event.type === "financial_crisis") {
    const cash = readFinite(state.company.cash, 0);
    applyEventDeltas(state, {
      type: event.type,
      cashDelta: -Math.round(cash * config.financialCrisisCashLossRate),
      marketSentimentDelta: config.financialCrisisSentimentDelta,
      unemploymentDelta: config.financialCrisisUnemploymentDelta,
    });
    return;
  }

  if (event.type === "supply_chain_shock") {
    const monthlyBurn = state.company.monthlyBurn;
    const cash = readFinite(state.company.cash, 0);
    const burnIncrease = Math.round(monthlyBurn * config.supplyChainBurnIncreaseRate);
    state.company.monthlyBurn = monthlyBurn + burnIncrease;
    applyEventDeltas(state, {
      type: event.type,
      cashDelta: -Math.round(cash * config.supplyChainCashLossRate),
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
  const cash = readFinite(state.company.cash, 0);
  const reputation = readFinite(state.company.reputation, 0);
  const marketSentiment = readFinite(state.marketSentiment, 1);
  const unemploymentRate = readFinite(state.society.unemploymentRate, 0.07);
  const specialEventCount = readNonNegativeFinite(state.society.specialEventCount, 0);
  const cashDelta = readFinite(input.cashDelta, 0);
  const reputationDelta = readFinite(input.reputationDelta ?? 0, 0);
  const marketSentimentDelta = readFinite(input.marketSentimentDelta, 0);
  const unemploymentDelta = readFinite(input.unemploymentDelta, 0);

  state.company.cash = cash + cashDelta;
  state.company.reputation = Math.max(0, reputation + reputationDelta);
  state.marketSentiment = clamp(marketSentiment + marketSentimentDelta, 0.55, 1.45);
  state.society.unemploymentRate = clamp(unemploymentRate + unemploymentDelta, 0.02, 0.3);
  state.society.specialEventCount = specialEventCount + 1;
  recordGameEvent(state, {
    type: "special_event",
    eventType: input.type,
    cashDelta,
    reputationDelta,
    marketSentimentDelta,
    unemploymentDelta,
  });
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function readNonNegativeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
