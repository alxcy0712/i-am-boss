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
  const reputationEligible = state.company.reputation >= input.minimumReputation;

  if (!industryEligible || !reputationEligible) {
    recordGameEvent(state, {
      type: "policy_support_ineligible"
    });
    return { granted: false, cashDelta: 0, reputationDelta: 0 };
  }

  const cashDelta = PROBABILITY_CONFIG.policy.supportGrantCash;
  const reputationDelta = PROBABILITY_CONFIG.policy.supportReputationGain;
  state.company.cash += cashDelta;
  state.company.reputation += reputationDelta;
  state.society.policySupportCount += 1;
  recordGameEvent(state, {
    type: "policy_support_granted",
    cashDelta
  });
  return { granted: true, cashDelta, reputationDelta };
}
