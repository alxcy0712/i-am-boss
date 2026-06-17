import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import type { GameState } from "./types";
import { calculateCompanyValuation } from "./valuation";

export interface LoanInput {
  requestedAmount: number;
}

export interface FinanceResult {
  approved: boolean;
  reason?: string;
}

export function applyBankLoan(state: GameState, input: LoanInput): FinanceResult {
  const hasCredibility =
    state.company.reputation >= PROBABILITY_CONFIG.finance.minimumLoanReputation;
  const hasCashFlow = state.company.annualRevenue > state.company.monthlyBurn * 6;

  if (!hasCredibility || !hasCashFlow) {
    return { approved: false, reason: "credit_requirements_not_met" };
  }

  state.company.cash += input.requestedAmount;
  state.company.debt += input.requestedAmount;
  recordGameEvent(state, {
    type: "bank_loan_approved",
    amount: input.requestedAmount
  });
  return { approved: true };
}

export interface IpoInput {
  marketSentiment: number;
}

export function prepareIpo(state: GameState, input: IpoInput): FinanceResult {
  const eligible =
    state.company.annualRevenue >= PROBABILITY_CONFIG.finance.ipoRevenueThreshold &&
    state.company.reputation >= PROBABILITY_CONFIG.finance.ipoReputationThreshold &&
    state.company.headcount >= PROBABILITY_CONFIG.finance.ipoHeadcountThreshold;

  if (!eligible) {
    return { approved: false, reason: "ipo_requirements_not_met" };
  }

  const valuation = calculateCompanyValuation({
    isPublic: false,
    annualRevenue: state.company.annualRevenue,
    profitMargin: 0.18,
    reputation: state.company.reputation,
    marketSentiment: input.marketSentiment
  });

  state.company.isPublic = true;
  state.company.listedMarketValue = valuation.value * 1.15;
  recordGameEvent(state, {
    type: "ipo_prepared",
    listedMarketValue: state.company.listedMarketValue
  });
  return { approved: true };
}
