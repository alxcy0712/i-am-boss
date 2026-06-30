import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import { createSeededRng } from "./rng";
import type {
  ComplianceResult,
  DelistingRisk,
  DelistingRiskLevel,
  GameState,
  GovernanceMetrics,
  ShareholderResult,
} from "./types";
import { clamp } from "./rng";

export function evaluateGovernance(state: GameState): GovernanceMetrics {
  const cfg = PROBABILITY_CONFIG.listedGovernance;
  const company = state.company;
  const morale = readFinite(company.morale, 0);
  const reputation = readFinite(company.reputation, 0);

  const shareholderSatisfaction = clamp((morale / 10) * 0.6 + (reputation / 10) * 0.4, 0, 1);

  const daysSinceDisclosure =
    company.lastDisclosureDay != null
      ? readNonNegativeFinite(state.day, 0) - readNonNegativeFinite(company.lastDisclosureDay, 0)
      : 0;
  const disclosureCompliance = clamp(
    1 -
      Math.max(0, daysSinceDisclosure - cfg.minimumDisclosureFrequency) /
        cfg.minimumDisclosureFrequency,
    0,
    1,
  );

  const regulatoryCompliance = clamp(
    1 - readNonNegativeFinite(state.society.legalCaseCount, 0) * 0.1,
    0,
    1,
  );

  const overallScore = clamp(
    shareholderSatisfaction * cfg.shareholderSatisfactionWeight +
      disclosureCompliance * cfg.disclosureComplianceWeight +
      regulatoryCompliance * cfg.regulatoryComplianceWeight,
    0,
    1,
  );

  return {
    shareholderSatisfaction,
    disclosureCompliance,
    regulatoryCompliance,
    overallScore,
  };
}

export function processShareholderRelations(
  state: GameState,
  input: { seed: number },
): ShareholderResult {
  const cfg = PROBABILITY_CONFIG.listedGovernance;
  const rng = createSeededRng(input.seed);
  const company = state.company;
  const morale = readFinite(company.morale, 0);
  const reputation = readFinite(company.reputation, 0);
  const cash = readFinite(company.cash, 0);
  const valuation = readNonNegativeFinite(company.valuation, 0);

  const moraleScore = morale / 10;
  const reputationScore = reputation / 10;
  const cashFlowScore = cash > 0 ? 1 : 0;
  const satisfaction = moraleScore * 0.4 + reputationScore * 0.3 + cashFlowScore * 0.3;

  const satisfactionDelta =
    (satisfaction - cfg.shareholderPressureThreshold) * 0.1 + (rng.next() - 0.5) * 0.02;

  const reputationDelta = satisfactionDelta * 0.05;
  company.reputation = clamp(reputation + reputationDelta, 0, 10);

  const valuationImpact = satisfactionDelta * valuation * 0.02;
  if (valuationImpact !== 0) {
    company.valuation = Math.max(0, valuation + valuationImpact);
  } else {
    company.valuation = valuation;
  }

  return { satisfactionDelta, reputationDelta, valuationImpact };
}

export function checkDisclosureCompliance(state: GameState): ComplianceResult {
  const cfg = PROBABILITY_CONFIG.listedGovernance;
  const company = state.company;

  if (company.lastDisclosureDay == null) {
    company.lastDisclosureDay = readNonNegativeFinite(state.day, 0);
    return { isCompliant: true, daysOverdue: 0, penalty: 0 };
  }

  const currentDay = readNonNegativeFinite(state.day, 0);
  const lastDisclosureDay = readNonNegativeFinite(company.lastDisclosureDay, currentDay);
  const daysSinceDisclosure = currentDay - lastDisclosureDay;
  const daysOverdue = Math.max(0, daysSinceDisclosure - cfg.minimumDisclosureFrequency);

  if (daysOverdue > 0) {
    const severity = daysOverdue / cfg.minimumDisclosureFrequency;
    const penalty = Math.round(
      Math.min(severity, 1) *
        cfg.governancePenaltyRate *
        readNonNegativeFinite(company.valuation, 0),
    );
    applyGovernancePenalties(state, {
      reason: "disclosure_overdue",
      severity,
    });
    company.lastDisclosureDay = currentDay;
    return {
      isCompliant: false,
      daysOverdue,
      penalty,
      reason: `Disclosure overdue by ${daysOverdue} days`,
    };
  }

  company.lastDisclosureDay = currentDay;
  return { isCompliant: true, daysOverdue: 0, penalty: 0 };
}

export function evaluateDelistingRisk(state: GameState): DelistingRisk {
  const cfg = PROBABILITY_CONFIG.listedGovernance;
  const company = state.company;
  const reasons: string[] = [];
  const cash = readFinite(company.cash, cfg.delistingCashThreshold - 1);
  const reputation = readFinite(company.reputation, cfg.delistingReputationThreshold - 1);
  const valuation = readFinite(company.valuation, cfg.delistingValuationThreshold - 1);

  const cashRisk = cash < cfg.delistingCashThreshold;
  const reputationRisk = reputation < cfg.delistingReputationThreshold;
  const valuationRisk = valuation < cfg.delistingValuationThreshold;

  const cashWarning = cash < cfg.delistingCashThreshold * 0.8;
  const reputationWarning = reputation < cfg.delistingReputationThreshold + 1;
  const valuationWarning = valuation < cfg.delistingValuationThreshold * 1.2;

  if (cashRisk)
    reasons.push(`Cash ${Math.round(cash)} below threshold ${cfg.delistingCashThreshold}`);
  if (reputationRisk)
    reasons.push(
      `Reputation ${reputation.toFixed(1)} below threshold ${cfg.delistingReputationThreshold}`,
    );
  if (valuationRisk)
    reasons.push(
      `Valuation ${Math.round(valuation)} below threshold ${cfg.delistingValuationThreshold}`,
    );

  const riskCount = [cashRisk, reputationRisk, valuationRisk].filter(Boolean).length;
  const warningCount = [cashWarning, reputationWarning, valuationWarning].filter(Boolean).length;

  let riskLevel: DelistingRiskLevel = "none";
  if (riskCount >= 3) riskLevel = "critical";
  else if (riskCount === 2) riskLevel = "high";
  else if (riskCount === 1) riskLevel = "medium";
  else if (warningCount > 0) riskLevel = "low";

  return { riskLevel, reasons, cashRisk, reputationRisk, valuationRisk };
}

export function applyGovernancePenalties(
  state: GameState,
  input: { reason: string; severity: number },
): void {
  if (typeof input.reason !== "string" || !input.reason.trim()) {
    return;
  }

  const cfg = PROBABILITY_CONFIG.listedGovernance;
  const company = state.company;

  const severity = readFinite(input.severity, 0);
  const clampedSeverity = clamp(severity, 0, 1);
  const penalty = Math.round(
    clampedSeverity * cfg.governancePenaltyRate * readNonNegativeFinite(company.valuation, 0),
  );
  company.cash = readFinite(company.cash, 0) - penalty;
  company.reputation = Math.max(0, readFinite(company.reputation, 0) - clampedSeverity * 0.5);

  recordGameEvent(state, {
    type: "governance_penalty",
    reason: input.reason,
    severityLevel: clampedSeverity,
    penalty,
  });
}

export function processMonthlyGovernance(state: GameState, input: { seed: number }): void {
  if (!state.company.isPublic) return;

  processShareholderRelations(state, input);
  checkDisclosureCompliance(state);

  const metrics = evaluateGovernance(state);
  state.company.governanceMetrics = metrics;

  const delistingRisk = evaluateDelistingRisk(state);
  if (delistingRisk.riskLevel !== "none" && delistingRisk.riskLevel !== "low") {
    recordGameEvent(state, {
      type: "delisting_warning",
      riskLevel: delistingRisk.riskLevel,
      reasons: delistingRisk.reasons,
    });
  }
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function readNonNegativeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
