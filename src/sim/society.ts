import { recordGameEvent } from "./events";
import type { GameState } from "./types";

export type SocietyEventType =
  | "policy_support"
  | "legal_incident"
  | "market_shock"
  | "labor_market_shift";

export interface SocietyEvent {
  type: SocietyEventType;
  cashDelta: number;
  reputationDelta: number;
  marketSentimentDelta?: number;
}

export function applySocietyEvent(state: GameState, event: SocietyEvent): void {
  state.company.cash += event.cashDelta;
  state.company.reputation += event.reputationDelta;
  state.marketSentiment = Math.min(
    1.4,
    Math.max(0.6, state.marketSentiment + (event.marketSentimentDelta ?? 0)),
  );
  recordGameEvent(state, {
    type: "society_event",
    eventType: event.type,
    cashDelta: event.cashDelta,
    reputationDelta: event.reputationDelta,
    marketSentimentDelta: event.marketSentimentDelta,
  });
}
