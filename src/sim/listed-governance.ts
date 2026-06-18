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

  const shareholderSatisfaction = clamp(
    (company.morale / 10) * 0.6 + (company.reputation / 10) * 0.4,
    0,
    1,
  );

  const daysSinceDisclosure =
    company.lastDisclosureDay != null ? state.day - company.lastDisclosureDay : 0;
  const disclosureCompliance = clamp(
    1 -
      Math.max(0, daysSinceDisclosure - cfg.minimumDisclosureFrequency) /
        cfg.minimumDisclosureFrequency,
    0,
    1,
  );

  const regulatoryCompliance = clamp(1 - state.society.legalCaseCount * 0.1, 0, 1);

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

  const moraleScore = company.morale / 10;
  const reputationScore = company.reputation / 10;
  const cashFlowScore = company.cash > 0 ? 1 : 0;
  const satisfaction = moraleScore * 0.4 + reputationScore * 0.3 + cashFlowScore * 0.3;

  const satisfactionDelta =
    (satisfaction - cfg.shareholderPressureThreshold) * 0.1 + (rng.next() - 0.5) * 0.02;

  const reputationDelta = satisfactionDelta * 0.05;
  company.reputation = clamp(company.reputation + reputationDelta, 0, 10);

  const valuationImpact = satisfactionDelta * company.valuation * 0.02;
  if (valuationImpact !== 0) {
    company.valuation = Math.max(0, company.valuation + valuationImpact);
  }

  return { satisfactionDelta, reputationDelta, valuationImpact };
}

export function checkDisclosureCompliance(state: GameState): ComplianceResult {
  const cfg = PROBABILITY_CONFIG.listedGovernance;
  const company = state.company;

  if (company.lastDisclosureDay == null) {
    company.lastDisclosureDay = state.day;
    return { isCompliant: true, daysOverdue: 0, penalty: 0 };
  }

  const daysSinceDisclosure = state.day - company.lastDisclosureDay;
  const daysOverdue = Math.max(0, daysSinceDisclosure - cfg.minimumDisclosureFrequency);

  if (daysOverdue > 0) {
    const severity = daysOverdue / cfg.minimumDisclosureFrequency;
    const penalty = Math.round(
      Math.min(severity, 1) * cfg.governancePenaltyRate * company.valuation,
    );
    applyGovernancePenalties(state, {
      reason: "disclosure_overdue",
      severity,
    });
    company.lastDisclosureDay = state.day;
    return {
      isCompliant: false,
      daysOverdue,
      penalty,
      reason: `Disclosure overdue by ${daysOverdue} days`,
    };
  }

  company.lastDisclosureDay = state.day;
  return { isCompliant: true, daysOverdue: 0, penalty: 0 };
}

export function evaluateDelistingRisk(state: GameState): DelistingRisk {
  const cfg = PROBABILITY_CONFIG.listedGovernance;
  const company = state.company;
  const reasons: string[] = [];

  const cashRisk = company.cash < cfg.delistingCashThreshold;
  const reputationRisk = company.reputation < cfg.delistingReputationThreshold;
  const valuationRisk = company.valuation < cfg.delistingValuationThreshold;

  const cashWarning = company.cash < cfg.delistingCashThreshold * 0.8;
  const reputationWarning = company.reputation < cfg.delistingReputationThreshold + 1;
  const valuationWarning = company.valuation < cfg.delistingValuationThreshold * 1.2;

  if (cashRisk)
    reasons.push(`Cash ${Math.round(company.cash)} below threshold ${cfg.delistingCashThreshold}`);
  if (reputationRisk)
    reasons.push(
      `Reputation ${company.reputation.toFixed(1)} below threshold ${cfg.delistingReputationThreshold}`,
    );
  if (valuationRisk)
    reasons.push(
      `Valuation ${Math.round(company.valuation)} below threshold ${cfg.delistingValuationThreshold}`,
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
  const cfg = PROBABILITY_CONFIG.listedGovernance;
  const company = state.company;

  const clampedSeverity = clamp(input.severity, 0, 1);
  const penalty = Math.round(clampedSeverity * cfg.governancePenaltyRate * company.valuation);
  company.cash -= penalty;
  company.reputation = Math.max(0, company.reputation - clampedSeverity * 0.5);

  recordGameEvent(state, {
    type: "governance_penalty",
    reason: input.reason,
    severityLevel: input.severity,
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
