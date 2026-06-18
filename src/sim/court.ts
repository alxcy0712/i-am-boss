import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import type { GameState } from "./types";

export type CourtCaseType = "company_violation" | "employee_violation";

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
  const penaltyPerSeverity =
    input.type === "company_violation"
      ? PROBABILITY_CONFIG.court.companyViolationPenaltyPerSeverity
      : PROBABILITY_CONFIG.court.employeeViolationPenaltyPerSeverity;
  const penalty = input.severity * penaltyPerSeverity;
  const reputationDelta = -input.severity * PROBABILITY_CONFIG.court.reputationLossPerSeverity;

  state.company.cash -= penalty;
  state.company.reputation += reputationDelta;
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
