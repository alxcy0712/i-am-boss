import { INITIAL_CHOICES } from "../config/initial-choices";
import type { HarnessSummary } from "../harness/sim-harness";
import { advanceGameState, summarizeGameState } from "../harness/sim-harness";
import { runAIHiringCycle } from "../sim/ai-hiring";
import { changeCompanyCulture } from "../sim/company-culture";
import { hireEmployee, raiseEmployeeSalary, terminateEmployee } from "../sim/employee-lifecycle";
import { applyBankLoan, prepareIpo } from "../sim/finance";
import { purchaseCar, upgradeCar, getMarried, haveChild } from "../sim/founder-life";
import { recordGameEvent } from "../sim/events";
import { makeInvestment, sellInvestment } from "../sim/investment";
import { type Candidate, negotiateHiring } from "../sim/hiring";
import { purchaseInsurance, processInsuranceClaim } from "../sim/insurance";
import { applyLaborMarketPressure } from "../sim/labor-market";
import { evaluatePolicySupport } from "../sim/policy";
import { generateCandidate, getHiringPlan, type Seniority } from "../sim/staffing";
import { createInitialGameState } from "../sim/state";
import type {
  CompanyCulture,
  GameOverReason,
  GameState,
  InitialChoice,
  InsuranceType,
  InvestmentType,
} from "../sim/types";
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
  aiHiringEnabled?: boolean;
}

export interface SessionAction {
  id:
    | "advance-30-days"
    | "recruit-candidate"
    | "request-bank-loan"
    | "request-policy-support"
    | "prepare-ipo"
    | "change-culture"
    | "toggle-ai-hiring"
    | "run-ai-hiring-cycle"
    | "purchase-insurance"
    | "file-insurance-claim"
    | "make-investment"
    | "sell-investment"
    | "buy-car"
    | "upgrade-car"
    | "get-married"
    | "have-child";
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
  | { id: "raise-employee-salary"; employeeId: string; salary?: number }
  | { id: "toggle-ai-hiring" }
  | { id: "run-ai-hiring-cycle" }
  | { id: "purchase-insurance"; insuranceType: InsuranceType }
  | { id: "file-insurance-claim"; policyId: string; damageAmount: number }
  | { id: "make-investment"; investmentType: InvestmentType; amount: number }
  | { id: "sell-investment"; investmentId: string }
  | { id: "buy-car"; brand: string; value: number }
  | { id: "upgrade-car"; carId: string; newValue: number }
  | { id: "get-married"; spouseName: string }
  | { id: "have-child"; childName: string };

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
    candidateCursor: 0,
  };
}

export function selectInitialChoice(session: GameSession, choiceId: string): GameSession {
  const state = createInitialGameState({
    seed: session.seed,
    initialChoiceId: choiceId,
  });

  return {
    ...session,
    selectedInitialChoiceId: choiceId,
    state,
    summary: summarizeGameState(state, undefined, session.aiHiringEnabled),
  };
}

export function advanceSession(session: GameSession, days: number): GameSession {
  if (!session.selectedInitialChoiceId) {
    throw new Error("Initial choice must be selected before advancing");
  }

  const state = cloneSessionState(session);
  const result = advanceGameState(state, {
    seed: session.seed,
    days,
    aiHiringEnabled: session.aiHiringEnabled,
  });

  return {
    ...session,
    state: result.state,
    summary: summarizeGameState(result.state, result.gameOverReason, session.aiHiringEnabled),
    gameOverReason: result.gameOverReason,
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
    { id: "change-culture", label: "Change Culture", enabled },
    {
      id: "toggle-ai-hiring",
      label: session.aiHiringEnabled ? "Disable AI Hiring" : "Enable AI Hiring",
      enabled,
    },
    {
      id: "run-ai-hiring-cycle",
      label: "Run AI Hiring Cycle",
      enabled: enabled && Boolean(session.aiHiringEnabled),
    },
    { id: "purchase-insurance", label: "Purchase Insurance", enabled },
    {
      id: "file-insurance-claim",
      label: "File Insurance Claim",
      enabled: enabled && Boolean(session.state?.company.insurancePolicies.some((p) => p.active)),
    },
    { id: "make-investment", label: "Make Investment", enabled },
    {
      id: "sell-investment",
      label: "Sell Investment",
      enabled: enabled && Boolean(session.state?.company.investments.length),
    },
    { id: "buy-car", label: "Buy Car", enabled },
    {
      id: "upgrade-car",
      label: "Upgrade Car",
      enabled: enabled && Boolean(session.state?.founder.personalLife.cars.length),
    },
    {
      id: "get-married",
      label: "Get Married",
      enabled: enabled && !session.state?.founder.personalLife.marriage,
    },
    {
      id: "have-child",
      label: "Have Child",
      enabled: enabled && Boolean(session.state?.founder.personalLife.marriage),
    },
  ];
}

export function performSessionAction(
  session: GameSession,
  action: SessionActionRequest,
): SessionActionResult {
  if (action.id === "advance-30-days") {
    return {
      session: advanceSession(session, 30),
      message: "Advanced 30 days",
    };
  }

  const state = cloneSessionState(session);

  if (action.id === "request-bank-loan") {
    const result = applyBankLoan(state, { requestedAmount: action.amount ?? 80_000 });
    return actionResult(
      session,
      state,
      result.approved ? "Bank loan approved" : "Bank loan denied",
    );
  }

  if (action.id === "request-policy-support") {
    const result = evaluatePolicySupport(state, {
      priorityIndustries: ["technology", "advanced-manufacturing"],
      minimumReputation: 5,
    });
    return actionResult(
      session,
      state,
      result.granted ? "Policy support granted" : "Policy support ineligible",
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
      salary: action.salary,
    });
    const message = result
      ? `Raised ${result.employee.role} salary to ¥${result.salary.toLocaleString("en-US")}`
      : "Employee unavailable";

    return actionResult(session, state, message);
  }

  if (action.id === "toggle-ai-hiring") {
    const newEnabled = !session.aiHiringEnabled;
    return {
      session: {
        ...session,
        aiHiringEnabled: newEnabled,
        summary: summarizeGameState(state, session.gameOverReason, newEnabled),
      },
      message: newEnabled ? "AI hiring enabled" : "AI hiring disabled",
    };
  }

  if (action.id === "run-ai-hiring-cycle") {
    const result = runAIHiringCycle(state, { seed: session.seed + state.day });
    return actionResult(
      session,
      state,
      `AI hiring cycle: ${result.hires} hired, ${result.failures} failed`,
    );
  }

  if (action.id === "purchase-insurance") {
    const result = purchaseInsurance(state, { type: action.insuranceType });
    return actionResult(
      session,
      state,
      result.purchased
        ? `Insurance purchased: ${action.insuranceType}`
        : `Insurance purchase failed: ${result.reason}`,
    );
  }

  if (action.id === "file-insurance-claim") {
    const result = processInsuranceClaim(state, {
      policyId: action.policyId,
      damageAmount: action.damageAmount,
    });
    return actionResult(
      session,
      state,
      result.approved
        ? `Insurance claim approved: ¥${result.payout.toLocaleString("en-US")}`
        : `Insurance claim denied: ${result.reason}`,
    );
  }

  if (action.id === "make-investment") {
    const result = makeInvestment(state, {
      type: action.investmentType,
      amount: action.amount,
    });
    return actionResult(
      session,
      state,
      result.success
        ? `Invested ¥${result.investment!.amount.toLocaleString("en-US")} in ${action.investmentType}`
        : `Investment failed: ${result.reason}`,
    );
  }

  if (action.id === "sell-investment") {
    const result = sellInvestment(state, { investmentId: action.investmentId });
    return actionResult(
      session,
      state,
      result.success
        ? `Sold investment for ¥${result.saleAmount!.toLocaleString("en-US")} (gain: ¥${result.gain!.toLocaleString("en-US")})`
        : `Sale failed: ${result.reason}`,
    );
  }

  if (action.id === "buy-car") {
    const result = purchaseCar(state, { brand: action.brand, value: action.value });
    return actionResult(
      session,
      state,
      result.success
        ? `Purchased ${action.brand} for ¥${action.value.toLocaleString("en-US")}`
        : `Purchase failed: ${result.reason}`,
    );
  }

  if (action.id === "upgrade-car") {
    const result = upgradeCar(state, { carId: action.carId, newValue: action.newValue });
    return actionResult(
      session,
      state,
      result.success
        ? `Upgraded car to ¥${action.newValue.toLocaleString("en-US")}`
        : `Upgrade failed: ${result.reason}`,
    );
  }

  if (action.id === "get-married") {
    const result = getMarried(state, { spouseName: action.spouseName });
    return actionResult(
      session,
      state,
      result.success ? `Married: ${action.spouseName}` : `Marriage failed: ${result.reason}`,
    );
  }

  if (action.id === "have-child") {
    const result = haveChild(state, { childName: action.childName });
    return actionResult(
      session,
      state,
      result.success ? `Child born: ${action.childName}` : `Failed: ${result.reason}`,
    );
  }

  if (action.id === "skip-candidate") {
    const preview = previewRecruitmentCandidateForState(session, state);
    recordGameEvent(state, {
      type: "candidate_skipped",
      role: preview.role,
    });
    return actionResult(
      {
        ...session,
        candidateCursor: (session.candidateCursor ?? 0) + 1,
      },
      state,
      `Skipped candidate: ${preview.role}`,
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
  action: Extract<SessionActionRequest, { id: "recruit-candidate" }>,
): SessionActionResult {
  const preview = previewRecruitmentCandidateForState(session, state);
  const offer = {
    salary: action.salary ?? Math.round(preview.targetSalary * 0.96),
    equityPercent: action.equityPercent ?? preview.equityPercent,
  };
  const negotiation = negotiateHiring({
    seed: preview.seed,
    companyReputation: state.company.reputation,
    companyCulture: state.company.culture,
    offer,
    candidate: preview,
  });

  if (negotiation.accepted) {
    hireEmployee(state, {
      candidate: preview,
      salary: offer.salary,
      equityPercent: offer.equityPercent,
    });
    return actionResult(
      { ...session, candidateCursor: 0 },
      state,
      `Hired ${preview.role} for ¥${offer.salary.toLocaleString("en-US")}`,
    );
  }

  const reason =
    negotiation.reason === "salary_below_minimum" ? "salary below minimum" : "candidate declined";
  recordGameEvent(state, {
    type: "hiring_failed",
    role: preview.role,
    reason,
  });
  return actionResult(session, state, `Recruitment failed: ${preview.role} (${reason})`);
}

function previewRecruitmentCandidateForState(
  session: GameSession,
  state: GameState,
): RecruitmentCandidatePreview {
  const plannedRoles = getHiringPlan({
    headcount: state.company.headcount,
    annualRevenue: state.company.annualRevenue,
    resources: state.company.resources,
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
      companyReputation: state.company.reputation,
    }),
    { unemploymentRate: state.society.unemploymentRate },
  );

  return {
    ...candidate,
    seed,
    seniority,
    equityPercent: state.company.headcount < 5 ? 0.2 : 0.05,
  };
}

function actionResult(
  session: GameSession,
  state: GameState,
  message: string,
): SessionActionResult {
  return {
    session: {
      ...session,
      state,
      summary: summarizeGameState(state, session.gameOverReason, session.aiHiringEnabled),
    },
    message,
  };
}

function cloneSessionState(session: GameSession): GameState {
  if (!session.state) {
    throw new Error("Initial choice must be selected before using session actions");
  }

  return structuredClone(session.state);
}
