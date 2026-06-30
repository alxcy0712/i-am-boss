import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import type { GameState } from "./types";

export type CourtCaseType = "company_violation" | "employee_violation";

const COURT_CASE_TYPES = new Set<CourtCaseType>(["company_violation", "employee_violation"]);

export interface CourtCaseInput {
  type: CourtCaseType;
  severity: number;
}

export interface CourtCaseResult {
  penalty: number;
  reputationDelta: number;
  abstractSummary: string;
}

export function resolveCourtCase(state: GameState, input: CourtCaseInput): CourtCaseResult {
  state.company.cash = readFinite(state.company.cash, 0);
  state.company.reputation = readFinite(state.company.reputation, 0);
  state.society.legalCaseCount = readNonNegativeFinite(state.society.legalCaseCount, 0);

  if (!COURT_CASE_TYPES.has(input.type)) {
    return {
      penalty: 0,
      reputationDelta: 0,
      abstractSummary: "invalid court case type",
    };
  }

  if (!Number.isFinite(input.severity) || input.severity <= 0) {
    return {
      penalty: 0,
      reputationDelta: 0,
      abstractSummary: "invalid court case severity",
    };
  }

  const penaltyPerSeverity =
    input.type === "company_violation"
      ? PROBABILITY_CONFIG.court.companyViolationPenaltyPerSeverity
      : PROBABILITY_CONFIG.court.employeeViolationPenaltyPerSeverity;
  const penalty = input.severity * penaltyPerSeverity;
  const reputationDelta = -input.severity * PROBABILITY_CONFIG.court.reputationLossPerSeverity;

  state.company.cash -= penalty;
  state.company.reputation = Math.max(0, state.company.reputation + reputationDelta);
  state.society.legalCaseCount += 1;

  const abstractSummary = `${input.type}: severity ${input.severity}, penalty ${penalty}`;
  recordGameEvent(state, {
    type: "court_case_resolved",
    caseType: input.type,
    caseSeverity: input.severity,
    penalty,
  });
  return { penalty, reputationDelta, abstractSummary };
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function readNonNegativeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
