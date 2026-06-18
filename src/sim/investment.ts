import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import { createSeededRng } from "./rng";
import type { GameState, Investment, InvestmentType } from "./types";

const INVESTMENT_CONFIG = PROBABILITY_CONFIG.investment;

export interface InvestmentResult {
  success: boolean;
  investment?: Investment;
  reason?: string;
}

export interface SellInvestmentResult {
  success: boolean;
  saleAmount?: number;
  gain?: number;
  reason?: string;
}

export interface InvestmentReturnResult {
  totalGain: number;
  investmentsProcessed: number;
}

export interface RiskAssessment {
  riskLevel: number;
  volatility: number;
  riskCategory: "low" | "moderate" | "high" | "very_high";
}

export function makeInvestment(
  state: GameState,
  input: { type: InvestmentType; amount: number },
): InvestmentResult {
  const config = INVESTMENT_CONFIG;

  if (input.amount < config.minimumInvestment) {
    return { success: false, reason: "below_minimum_investment" };
  }

  const maxAllowed = state.company.cash * config.maxPortfolioPercentage;
  const cappedAmount = Math.min(input.amount, maxAllowed);

  if (cappedAmount < config.minimumInvestment) {
    return { success: false, reason: "insufficient_cash" };
  }

  if (state.company.cash < cappedAmount) {
    return { success: false, reason: "insufficient_cash" };
  }

  const expectedReturn = calculateInvestmentReturn({
    type: input.type,
    marketSentiment: state.marketSentiment,
    riskLevel: config.riskLevels[input.type],
  });

  const investment: Investment = {
    id: `inv-${state.company.investments.length + 1}-${state.day}`,
    type: input.type,
    amount: cappedAmount,
    startDate: state.day,
    expectedReturn,
    riskLevel: config.riskLevels[input.type],
    currentValue: cappedAmount,
  };

  state.company.cash -= cappedAmount;
  state.company.investments.push(investment);

  recordGameEvent(state, {
    type: "investment_made",
    investmentType: input.type,
    amount: cappedAmount,
    expectedReturn,
  });

  return { success: true, investment };
}

export function sellInvestment(
  state: GameState,
  input: { investmentId: string },
): SellInvestmentResult {
  const index = state.company.investments.findIndex((inv) => inv.id === input.investmentId);

  if (index === -1) {
    return { success: false, reason: "investment_not_found" };
  }

  const investment = state.company.investments[index];
  const saleAmount = Math.round(investment.currentValue);
  const gain = saleAmount - investment.amount;

  state.company.cash += saleAmount;
  state.company.investments.splice(index, 1);

  recordGameEvent(state, {
    type: "investment_sold",
    investmentId: investment.id,
    investmentType: investment.type,
    saleAmount,
    gain,
  });

  return { success: true, saleAmount, gain };
}

export function processInvestmentReturns(
  state: GameState,
  input: { seed: number },
): InvestmentReturnResult {
  if (state.company.investments.length === 0) {
    return { totalGain: 0, investmentsProcessed: 0 };
  }

  const rng = createSeededRng(input.seed + state.day);
  let totalGain = 0;

  for (const investment of state.company.investments) {
    const monthlyReturn = calculateMonthlyReturn(investment, state.marketSentiment, rng.next());
    const gain = Math.round(investment.currentValue * monthlyReturn);
    investment.currentValue = Math.max(0, investment.currentValue + gain);
    totalGain += gain;

    if (gain !== 0) {
      recordGameEvent(state, {
        type: "investment_return",
        investmentId: investment.id,
        returnAmount: gain,
        currentValue: investment.currentValue,
      });
    }
  }

  return { totalGain, investmentsProcessed: state.company.investments.length };
}

export function calculateInvestmentReturn(input: {
  type: InvestmentType;
  marketSentiment: number;
  riskLevel: number;
}): number {
  const config = INVESTMENT_CONFIG;
  const baseReturn = config.baseReturnRates[input.type];
  const sentimentAdjustment = (input.marketSentiment - 1) * config.marketSentimentWeight;
  return baseReturn + sentimentAdjustment;
}

export function evaluateInvestmentRisk(input: {
  type: InvestmentType;
  marketSentiment: number;
}): RiskAssessment {
  const config = INVESTMENT_CONFIG;
  const riskLevel = config.riskLevels[input.type];
  const volatility = config.volatilityByType[input.type];

  const sentimentPenalty = input.marketSentiment < 0.8 ? (0.8 - input.marketSentiment) * 0.3 : 0;
  const adjustedRisk = Math.min(1, riskLevel + sentimentPenalty);

  let riskCategory: RiskAssessment["riskCategory"];
  if (adjustedRisk < 0.3) riskCategory = "low";
  else if (adjustedRisk < 0.5) riskCategory = "moderate";
  else if (adjustedRisk < 0.75) riskCategory = "high";
  else riskCategory = "very_high";

  return { riskLevel: adjustedRisk, volatility, riskCategory };
}

function calculateMonthlyReturn(
  investment: Investment,
  marketSentiment: number,
  roll: number,
): number {
  const config = INVESTMENT_CONFIG;
  const annualReturn = config.baseReturnRates[investment.type];
  const sentimentEffect = (marketSentiment - 1) * config.marketSentimentWeight;
  const monthlyBase = (annualReturn + sentimentEffect) / 12;

  const volatility = config.volatilityByType[investment.type];
  const noise = ((roll - 0.5) * 2 * volatility) / Math.sqrt(12);

  return monthlyBase + noise;
}

export function getPortfolioValue(state: GameState): number {
  return state.company.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
}

export function getPortfolioSummary(state: GameState): {
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  byType: Record<InvestmentType, { count: number; value: number }>;
} {
  const byType: Record<InvestmentType, { count: number; value: number }> = {
    stocks: { count: 0, value: 0 },
    bonds: { count: 0, value: 0 },
    real_estate: { count: 0, value: 0 },
    venture: { count: 0, value: 0 },
    crypto: { count: 0, value: 0 },
  };

  let totalInvested = 0;

  for (const inv of state.company.investments) {
    totalInvested += inv.amount;
    byType[inv.type].count += 1;
    byType[inv.type].value += inv.currentValue;
  }

  const totalValue = getPortfolioValue(state);

  return {
    totalValue,
    totalInvested,
    totalGain: totalValue - totalInvested,
    byType,
  };
}
