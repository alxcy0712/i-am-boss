import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import type { CompanyIndustry, GameState } from "./types";

export interface PolicyInput {
  priorityIndustries: CompanyIndustry[];
  minimumReputation: number;
}

export interface PolicyResult {
  granted: boolean;
  cashDelta: number;
  reputationDelta: number;
}

export function evaluatePolicySupport(state: GameState, input: PolicyInput): PolicyResult {
  const industryEligible = input.priorityIndustries.includes(state.company.industry);
  const reputation = readFinite(state.company.reputation, 0);
  state.company.cash = readFinite(state.company.cash, 0);
  state.company.reputation = reputation;
  state.society.policySupportCount = readNonNegativeFinite(state.society.policySupportCount, 0);

  const minimumReputation = readFinite(input.minimumReputation, Infinity);
  const reputationEligible = reputation >= minimumReputation;

  if (!industryEligible || !reputationEligible) {
    recordGameEvent(state, {
      type: "policy_support_ineligible",
    });
    return { granted: false, cashDelta: 0, reputationDelta: 0 };
  }

  const cashDelta = PROBABILITY_CONFIG.policy.supportGrantCash;
  const reputationDelta = PROBABILITY_CONFIG.policy.supportReputationGain;
  state.company.cash += cashDelta;
  state.company.reputation = reputation + reputationDelta;
  state.society.policySupportCount += 1;
  recordGameEvent(state, {
    type: "policy_support_granted",
    cashDelta,
  });
  return { granted: true, cashDelta, reputationDelta };
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function readNonNegativeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
