import { recordGameEvent } from "./events";
import type { GameState } from "./types";

export type SocietyEventType =
  | "policy_support"
  | "legal_incident"
  | "market_shock"
  | "labor_market_shift";

const SOCIETY_EVENT_TYPES = new Set<SocietyEventType>([
  "policy_support",
  "legal_incident",
  "market_shock",
  "labor_market_shift",
]);

export interface SocietyEvent {
  type: SocietyEventType;
  cashDelta: number;
  reputationDelta: number;
  marketSentimentDelta?: number;
}

export function applySocietyEvent(state: GameState, event: SocietyEvent): void {
  if (!SOCIETY_EVENT_TYPES.has(event.type)) {
    return;
  }

  const marketSentimentDelta = event.marketSentimentDelta ?? 0;
  if (
    !Number.isFinite(event.cashDelta) ||
    !Number.isFinite(event.reputationDelta) ||
    !Number.isFinite(marketSentimentDelta)
  ) {
    return;
  }

  const cash = readFinite(state.company.cash, 0);
  const reputation = readFinite(state.company.reputation, 0);
  const marketSentiment = readFinite(state.marketSentiment, 1);

  state.company.cash = cash + event.cashDelta;
  state.company.reputation = reputation + event.reputationDelta;
  state.marketSentiment = Math.min(1.4, Math.max(0.6, marketSentiment + marketSentimentDelta));
  recordGameEvent(state, {
    type: "society_event",
    eventType: event.type,
    cashDelta: event.cashDelta,
    reputationDelta: event.reputationDelta,
    marketSentimentDelta: event.marketSentimentDelta,
  });
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
