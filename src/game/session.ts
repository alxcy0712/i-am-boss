import { INITIAL_CHOICES } from "../config/initial-choices";
import type { HarnessSummary } from "../harness/sim-harness";
import { advanceGameState, summarizeGameState } from "../harness/sim-harness";
import { changeCompanyCulture } from "../sim/company-culture";
import { hireEmployee, raiseEmployeeSalary, terminateEmployee } from "../sim/employee-lifecycle";
import { applyBankLoan, prepareIpo } from "../sim/finance";
import { recordGameEvent } from "../sim/events";
import { type Candidate, negotiateHiring } from "../sim/hiring";
import { applyLaborMarketPressure } from "../sim/labor-market";
import { evaluatePolicySupport } from "../sim/policy";
import { generateCandidate, getHiringPlan, type Seniority } from "../sim/staffing";
import { createInitialGameState } from "../sim/state";
import type { CompanyCulture, GameOverReason, GameState, InitialChoice } from "../sim/types";
import type { GameViewModel } from "../ui/view-model";
import { createGameViewModel } from "../ui/view-model";

export interface GameSession {
  seed: number;
  initialChoices: InitialChoice[];
  selectedInitialChoiceId?: string;
  state?: GameState;
  summary?: HarnessSummary;
  gameOverReason?: GameOverReason;
  candidateCursor?: number;
}

export interface SessionAction {
  id:
    | "advance-30-days"
    | "recruit-candidate"
    | "request-bank-loan"
    | "request-policy-support"
    | "prepare-ipo"
    | "change-culture";
  label: string;
  enabled: boolean;
}

export type SessionActionRequest =
  | { id: "advance-30-days" }
  | { id: "recruit-candidate"; salary?: number; equityPercent?: number }
  | { id: "skip-candidate" }
  | { id: "request-bank-loan"; amount?: number }
  | { id: "request-policy-support" }
  | { id: "prepare-ipo" }
  | { id: "change-culture"; culture: CompanyCulture }
  | { id: "terminate-employee"; employeeId: string }
  | { id: "raise-employee-salary"; employeeId: string; salary?: number };

export interface SessionActionResult {
  session: GameSession;
  message: string;
}

export interface RecruitmentCandidatePreview extends Candidate {
  seed: number;
  seniority: Seniority;
  equityPercent: number;
}

export function createGameSession(input: { seed: number }): GameSession {
  return {
    seed: input.seed,
    initialChoices: INITIAL_CHOICES,
    candidateCursor: 0
  };
}

export function selectInitialChoice(session: GameSession, choiceId: string): GameSession {
  const state = createInitialGameState({
    seed: session.seed,
    initialChoiceId: choiceId
  });

  return {
    ...session,
    selectedInitialChoiceId: choiceId,
    state,
    summary: summarizeGameState(state)
  };
}

export function advanceSession(session: GameSession, days: number): GameSession {
  if (!session.selectedInitialChoiceId) {
    throw new Error("Initial choice must be selected before advancing");
  }

  const state = cloneSessionState(session);
  const result = advanceGameState(state, {
    seed: session.seed,
    days
  });

  return {
    ...session,
    state: result.state,
    summary: summarizeGameState(result.state, result.gameOverReason),
    gameOverReason: result.gameOverReason
  };
}

export function createSessionViewModel(session: GameSession): GameViewModel {
  if (!session.summary) {
    throw new Error("Session summary is required before creating a view model");
  }

  return createGameViewModel(session.summary);
}

export function getSessionActions(session: GameSession): SessionAction[] {
  const enabled = Boolean(session.selectedInitialChoiceId && session.state);
  return [
    { id: "advance-30-days", label: "Advance 30 Days", enabled },
    { id: "recruit-candidate", label: "Recruit Candidate", enabled },
    { id: "request-bank-loan", label: "Request Bank Loan", enabled },
    { id: "request-policy-support", label: "Request Policy Support", enabled },
    { id: "prepare-ipo", label: "Prepare IPO", enabled },
    { id: "change-culture", label: "Change Culture", enabled }
  ];
}

export function performSessionAction(
  session: GameSession,
  action: SessionActionRequest
): SessionActionResult {
  if (action.id === "advance-30-days") {
    return {
      session: advanceSession(session, 30),
      message: "Advanced 30 days"
    };
  }

  const state = cloneSessionState(session);

  if (action.id === "request-bank-loan") {
    const result = applyBankLoan(state, { requestedAmount: action.amount ?? 80_000 });
    return actionResult(session, state, result.approved ? "Bank loan approved" : "Bank loan denied");
  }

  if (action.id === "request-policy-support") {
    const result = evaluatePolicySupport(state, {
      priorityIndustries: ["technology", "advanced-manufacturing"],
      minimumReputation: 5
    });
    return actionResult(
      session,
      state,
      result.granted ? "Policy support granted" : "Policy support ineligible"
    );
  }

  if (action.id === "prepare-ipo") {
    const result = prepareIpo(state, { marketSentiment: state.marketSentiment });
    return actionResult(session, state, result.approved ? "IPO prepared" : "IPO unavailable");
  }

  if (action.id === "change-culture") {
    changeCompanyCulture(state, { culture: action.culture });
    return actionResult(session, state, `Culture changed: ${action.culture}`);
  }

  if (action.id === "terminate-employee") {
    const employee = state.company.employees.find((item) => item.id === action.employeeId);
    const severance = terminateEmployee(state, action.employeeId);
    const role = employee?.role ?? "employee";
    const message =
      severance > 0
        ? `Terminated ${role} with ¥${severance.toLocaleString("en-US")} severance`
        : "Employee unavailable";

    return actionResult(session, state, message);
  }

  if (action.id === "raise-employee-salary") {
    const result = raiseEmployeeSalary(state, {
      employeeId: action.employeeId,
      salary: action.salary
    });
    const message = result
      ? `Raised ${result.employee.role} salary to ¥${result.salary.toLocaleString("en-US")}`
      : "Employee unavailable";

    return actionResult(session, state, message);
  }

  if (action.id === "skip-candidate") {
    const preview = previewRecruitmentCandidateForState(session, state);
    recordGameEvent(state, {
      type: "candidate_skipped",
      role: preview.role
    });
    return actionResult(
      {
        ...session,
        candidateCursor: (session.candidateCursor ?? 0) + 1
      },
      state,
      `Skipped candidate: ${preview.role}`
    );
  }

  return recruitCandidate(session, state, action);
}

export function previewRecruitmentCandidate(session: GameSession): RecruitmentCandidatePreview {
  return previewRecruitmentCandidateForState(session, cloneSessionState(session));
}

function recruitCandidate(
  session: GameSession,
  state: GameState,
  action: Extract<SessionActionRequest, { id: "recruit-candidate" }>
): SessionActionResult {
  const preview = previewRecruitmentCandidateForState(session, state);
  const offer = {
    salary: action.salary ?? Math.round(preview.targetSalary * 0.96),
    equityPercent: action.equityPercent ?? preview.equityPercent
  };
  const negotiation = negotiateHiring({
    seed: preview.seed,
    companyReputation: state.company.reputation,
    companyCulture: state.company.culture,
    offer,
    candidate: preview
  });

  if (negotiation.accepted) {
    hireEmployee(state, {
      candidate: preview,
      salary: offer.salary,
      equityPercent: offer.equityPercent
    });
    return actionResult(
      { ...session, candidateCursor: 0 },
      state,
      `Hired ${preview.role} for ¥${offer.salary.toLocaleString("en-US")}`
    );
  }

  const reason =
    negotiation.reason === "salary_below_minimum"
      ? "salary below minimum"
      : "candidate declined";
  recordGameEvent(state, {
    type: "hiring_failed",
    role: preview.role,
    reason
  });
  return actionResult(session, state, `Recruitment failed: ${preview.role} (${reason})`);
}

function previewRecruitmentCandidateForState(
  session: GameSession,
  state: GameState
): RecruitmentCandidatePreview {
  const plannedRoles = getHiringPlan({
    headcount: state.company.headcount,
    annualRevenue: state.company.annualRevenue
  });
  const candidateCursor = session.candidateCursor ?? 0;
  const role = plannedRoles[(state.company.headcount + candidateCursor) % plannedRoles.length];
  const seniority = state.company.headcount > 10 ? "mid" : "junior";
  const seed = session.seed + state.day + state.company.headcount + candidateCursor;
  const candidate = applyLaborMarketPressure(
    generateCandidate({
      seed,
      role,
      seniority,
      companyReputation: state.company.reputation
    }),
    { unemploymentRate: state.society.unemploymentRate }
  );

  return {
    ...candidate,
    seed,
    seniority,
    equityPercent: state.company.headcount < 5 ? 0.2 : 0.05
  };
}

function actionResult(
  session: GameSession,
  state: GameState,
  message: string
): SessionActionResult {
  return {
    session: {
      ...session,
      state,
      summary: summarizeGameState(state, session.gameOverReason)
    },
    message
  };
}

function cloneSessionState(session: GameSession): GameState {
  if (!session.state) {
    throw new Error("Initial choice must be selected before using session actions");
  }

  return structuredClone(session.state);
}
