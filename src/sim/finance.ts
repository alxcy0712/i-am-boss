import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import type { GameState } from "./types";
import { calculateCompanyValuation } from "./valuation";

const FINANCE_CONFIG = PROBABILITY_CONFIG.finance;

export interface LoanInput {
  requestedAmount: number;
}

export interface FinanceResult {
  approved: boolean;
  reason?: "credit_requirements_not_met" | "ipo_requirements_not_met" | "invalid_loan_amount";
}

export function applyBankLoan(state: GameState, input: LoanInput): FinanceResult {
  if (!Number.isFinite(input.requestedAmount) || input.requestedAmount <= 0) {
    return { approved: false, reason: "invalid_loan_amount" };
  }

  const resources = readFinite(state.company.resources, 0);
  const reputation = readFinite(state.company.reputation, 0);
  const annualRevenue = readFinite(state.company.annualRevenue, 0);
  const monthlyBurn = readFinite(state.company.monthlyBurn, Infinity);
  const resourceBonus = Math.max(0, resources - 3) * FINANCE_CONFIG.resourceLoanBonusRate;
  const effectiveReputation = reputation + resourceBonus;

  const hasCredibility = effectiveReputation >= FINANCE_CONFIG.minimumLoanReputation;
  const hasCashFlow = annualRevenue > monthlyBurn * 6;

  if (!hasCredibility || !hasCashFlow) {
    return { approved: false, reason: "credit_requirements_not_met" };
  }

  state.company.cash = readFinite(state.company.cash, 0) + input.requestedAmount;
  state.company.debt = readFinite(state.company.debt, 0) + input.requestedAmount;
  recordGameEvent(state, {
    type: "bank_loan_approved",
    amount: input.requestedAmount,
  });
  return { approved: true };
}

export interface IpoInput {
  marketSentiment: number;
}

export function prepareIpo(state: GameState, input: IpoInput): FinanceResult {
  if (state.company.isPublic) {
    return { approved: false, reason: "ipo_requirements_not_met" };
  }

  if (!Number.isFinite(input.marketSentiment)) {
    return { approved: false, reason: "ipo_requirements_not_met" };
  }

  const eligible =
    state.company.annualRevenue >= FINANCE_CONFIG.ipoRevenueThreshold &&
    state.company.reputation >= FINANCE_CONFIG.ipoReputationThreshold &&
    state.company.headcount >= FINANCE_CONFIG.ipoHeadcountThreshold &&
    state.company.operationalCapability >= FINANCE_CONFIG.ipoOperationalCapabilityThreshold;

  if (!eligible) {
    return { approved: false, reason: "ipo_requirements_not_met" };
  }

  const valuation = calculateCompanyValuation({
    isPublic: false,
    annualRevenue: state.company.annualRevenue,
    profitMargin: 0.18,
    reputation: state.company.reputation,
    marketSentiment: input.marketSentiment,
    operationalCapability: state.company.operationalCapability,
  });

  state.company.isPublic = true;
  state.company.listedMarketValue = valuation.value * 1.15;
  recordGameEvent(state, {
    type: "ipo_prepared",
    listedMarketValue: state.company.listedMarketValue,
  });
  return { approved: true };
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
