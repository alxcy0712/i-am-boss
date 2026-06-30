import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import type { GameState, InsurancePolicy, InsuranceType, RiskProfile } from "./types";

const INSURANCE_CONFIG = PROBABILITY_CONFIG.insurance;
const INSURANCE_TYPES = new Set<InsuranceType>(["legal", "operational", "market", "comprehensive"]);

export interface InsuranceResult {
  purchased: boolean;
  policy?: InsurancePolicy;
  reason?: string;
}

export interface ClaimResult {
  approved: boolean;
  payout: number;
  reason?: string;
}

export function purchaseInsurance(
  state: GameState,
  input: { type: InsuranceType },
): InsuranceResult {
  if (!INSURANCE_TYPES.has(input.type)) {
    return { purchased: false, reason: "invalid_insurance_type" };
  }

  const coverageType = INSURANCE_CONFIG.coverageTypes[input.type];
  const riskProfile = evaluateRiskProfile(state);
  const companySize = state.company.headcount;

  const premium = calculateInsurancePremium({
    type: input.type,
    companySize,
    riskScore: riskProfile.riskScore,
  });

  const coverage = premium / coverageType.baseRate;
  const deductible = Math.round(coverage * INSURANCE_CONFIG.deductibleRate);

  if (state.company.cash < premium) {
    return { purchased: false, reason: "insufficient_cash" };
  }

  const existingPolicy = state.company.insurancePolicies.find(
    (p) => p.type === input.type && p.active,
  );
  if (existingPolicy) {
    return { purchased: false, reason: "policy_already_active" };
  }

  const policy: InsurancePolicy = {
    id: `policy-${state.company.insurancePolicies.length + 1}`,
    type: input.type,
    premium,
    coverage,
    deductible,
    active: true,
    startDate: state.day,
  };

  state.company.cash -= premium;
  state.company.insurancePolicies.push(policy);

  recordGameEvent(state, {
    type: "insurance_purchased",
    insuranceType: input.type,
    premium,
    coverage,
  });

  return { purchased: true, policy };
}

export function processInsuranceClaim(
  state: GameState,
  input: { policyId: string; damageAmount: number },
): ClaimResult {
  if (typeof input.policyId !== "string" || !input.policyId.trim()) {
    return { approved: false, payout: 0, reason: "invalid_policy" };
  }

  const policy = state.company.insurancePolicies.find((p) => p.id === input.policyId);

  if (!policy) {
    return { approved: false, payout: 0, reason: "policy_not_found" };
  }

  if (typeof policy.id !== "string" || !policy.id.trim()) {
    return { approved: false, payout: 0, reason: "invalid_policy" };
  }

  if (!policy.active) {
    return { approved: false, payout: 0, reason: "policy_inactive" };
  }

  if (!Number.isFinite(input.damageAmount) || input.damageAmount < 0) {
    return { approved: false, payout: 0, reason: "invalid_damage_amount" };
  }

  if (
    !Number.isFinite(policy.coverage) ||
    policy.coverage <= 0 ||
    !Number.isFinite(policy.deductible) ||
    policy.deductible < 0
  ) {
    return { approved: false, payout: 0, reason: "invalid_policy" };
  }

  if (input.damageAmount <= policy.deductible) {
    return { approved: false, payout: 0, reason: "damage_below_deductible" };
  }

  const claimableAmount = input.damageAmount - policy.deductible;
  const maxPayout = Math.round(policy.coverage * INSURANCE_CONFIG.maxPayoutRate);
  const payout = Math.min(claimableAmount, maxPayout);

  state.company.cash += payout;

  recordGameEvent(state, {
    type: "insurance_claim_paid",
    policyId: policy.id,
    payout,
    damageAmount: input.damageAmount,
  });

  return { approved: true, payout };
}

export function calculateInsurancePremium(input: {
  type: InsuranceType;
  companySize: number;
  riskScore: number;
}): number {
  const coverageType = INSURANCE_CONFIG.coverageTypes[input.type];
  const basePremium = coverageType.baseRate * INSURANCE_CONFIG.basePremiumRate * 10000;
  const companySize = readPositiveFinite(input.companySize, 1);
  const riskScore = clamp(readFinite(input.riskScore, 0), 0, 10);
  const sizeMultiplier = 1 + Math.log2(Math.max(1, companySize)) * 0.1;
  const riskLoad = 1 + (riskScore * (INSURANCE_CONFIG.premiumMultiplier - 1)) / 10;

  return Math.round(basePremium * sizeMultiplier * riskLoad);
}

export function evaluateRiskProfile(state: GameState): RiskProfile {
  const legalCaseCount = readNonNegativeFinite(state.society.legalCaseCount, 0);
  const operationalCapability = readFinite(state.company.operationalCapability, 5);
  const marketSentiment = readFinite(state.marketSentiment, 1);

  const legalRisk = Math.min(10, legalCaseCount * 2);
  const operationalRisk = clamp(10 - operationalCapability, 0, 10);
  const marketRisk = clamp(5 - marketSentiment * 5, 0, 10);

  const riskScore = Math.round(((legalRisk + operationalRisk + marketRisk) / 3) * 10) / 10;

  const recommendations: string[] = [];
  if (legalRisk > 5) {
    recommendations.push("High legal risk: consider legal insurance");
  }
  if (operationalRisk > 5) {
    recommendations.push("Low operational capability: consider operational insurance");
  }
  if (marketRisk > 3) {
    recommendations.push("Market volatility: consider market insurance");
  }
  if (riskScore > 6) {
    recommendations.push("Overall high risk: comprehensive insurance recommended");
  }

  return {
    riskScore,
    factors: {
      legalRisk,
      operationalRisk,
      marketRisk,
    },
    recommendations,
  };
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function readNonNegativeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readPositiveFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
