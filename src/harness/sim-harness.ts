import { PROBABILITY_CONFIG } from "../config/probabilities";
import { runAIHiringCycle } from "../sim/ai-hiring";
import { resolveCourtCase } from "../sim/court";
import {
  advanceEmployeeTenure,
  hireEmployee,
  processPromotions,
  processResignations,
} from "../sim/employee-lifecycle";
import { applyBankLoan, prepareIpo } from "../sim/finance";
import { advanceFounderLifecycle } from "../sim/founder-lifecycle";
import { processInvestmentReturns, getPortfolioValue } from "../sim/investment";
import { checkGameOver } from "../sim/game-over";
import { negotiateHiring } from "../sim/hiring";
import { applyLaborMarketPressure } from "../sim/labor-market";
import { applyMacroCycle } from "../sim/macro-cycle";
import { evaluatePolicySupport } from "../sim/policy";
import { calculateResignationRisk } from "../sim/resignation";
import { createSeededRng } from "../sim/rng";
import { calculateFinalScore } from "../sim/scoring";
import { updateListedMarketValue } from "../sim/securities-market";
import { applySocietyEvent } from "../sim/society";
import { maybeApplySpecialEvent } from "../sim/special-events";
import { generateCandidate, getHiringPlan } from "../sim/staffing";
import { createInitialGameState } from "../sim/state";
import { updateResources, calculateOperationalEfficiency } from "../sim/company-resources";
import { processMonthlyGovernance, evaluateDelistingRisk } from "../sim/listed-governance";
import type {
  AbilitySet,
  CompanyCulture,
  CompanyRole,
  CompanyRoleCounts,
  GameEvent,
  GameEventSummary,
  GameOverReason,
  GameState,
} from "../sim/types";
import { createGameEventSummary, recordGameEvent } from "../sim/events";
import { calculateCompanyValuation } from "../sim/valuation";

export interface HarnessInput {
  seed: number;
  days: number;
  initialChoiceId?: string;
  aiHiringEnabled?: boolean;
}

export interface HarnessTimelineInput extends HarnessInput {
  checkpointIntervalDays: number;
}

export interface HarnessTimelineResult {
  summary: HarnessSummary;
  checkpoints: HarnessCheckpoint[];
}

export interface HarnessEmployeeSummary {
  id: string;
  role: CompanyRole;
  salary: number;
  targetSalary: number;
  personality: number;
  monthsTenure: number;
  managementLevel: GameState["company"]["employees"][number]["managementLevel"];
  resignationRisk: number;
  abilities: AbilitySet;
}

export interface HarnessSummary {
  daysPlayed: number;
  companyValuation: number;
  valuationKind: "private_estimate" | "listed_market";
  isPublic: boolean;
  listedMarketValue?: number;
  playerWealth: number;
  score: number;
  cash: number;
  headcount: number;
  debt: number;
  employeeCount: number;
  staffRoleCounts: CompanyRoleCounts;
  totalMonthlyPayroll: number;
  averageEmployeeSalary: number;
  employees: HarnessEmployeeSummary[];
  companyReputation: number;
  companyMorale: number;
  companyCulture: CompanyCulture;
  culturePressure: number;
  founderAbilities: AbilitySet;
  founderAge: number;
  founderHealth: number;
  cyclePhase: string;
  unemploymentRate: number;
  legalCaseCount: number;
  policySupportCount: number;
  specialEventCount: number;
  events: GameEvent[];
  eventSummary: GameEventSummary;
  eventLog: string[];
  gameOverReason?: GameOverReason;
  aiHiringEnabled: boolean;
  aiHires: number;
  aiHiringFailures: number;
  activeInsurancePolicies: number;
  totalMonthlyInsurancePremiums: number;
  investmentCount: number;
  portfolioValue: number;
  totalInvested: number;
  investmentGain: number;
  governanceScore?: number;
  delistingRiskLevel?: string;
}

export interface HarnessCheckpoint {
  day: number;
  companyValuation: number;
  valuationKind: "private_estimate" | "listed_market";
  isPublic: boolean;
  listedMarketValue?: number;
  playerWealth: number;
  score: number;
  cash: number;
  headcount: number;
  debt: number;
  employeeCount: number;
  staffRoleCounts: CompanyRoleCounts;
  totalMonthlyPayroll: number;
  averageEmployeeSalary: number;
  companyReputation: number;
  companyMorale: number;
  founderAbilities: AbilitySet;
  founderAge: number;
  founderHealth: number;
  cyclePhase: string;
  unemploymentRate: number;
  gameOverReason?: GameOverReason;
  investmentCount: number;
  portfolioValue: number;
  governanceScore?: number;
  delistingRiskLevel?: string;
}

export function runHarness(input: HarnessInput): HarnessSummary {
  const state = createInitialGameState({
    seed: input.seed,
    initialChoiceId: input.initialChoiceId,
  });
  const result = advanceGameState(state, {
    seed: input.seed,
    days: input.days,
    aiHiringEnabled: input.aiHiringEnabled,
  });

  return summarizeGameState(result.state, result.gameOverReason, input.aiHiringEnabled);
}

export function runHarnessTimeline(input: HarnessTimelineInput): HarnessTimelineResult {
  const state = createInitialGameState({
    seed: input.seed,
    initialChoiceId: input.initialChoiceId,
  });
  const checkpoints: HarnessCheckpoint[] = [];
  const result = advanceGameState(state, {
    seed: input.seed,
    days: input.days,
    checkpointIntervalDays: input.checkpointIntervalDays,
    recordCheckpoint: (checkpointState, gameOverReason) => {
      checkpoints.push(createHarnessCheckpoint(checkpointState, gameOverReason));
    },
    aiHiringEnabled: input.aiHiringEnabled,
  });
  const summary = summarizeGameState(result.state, result.gameOverReason, input.aiHiringEnabled);
  const lastCheckpoint = checkpoints[checkpoints.length - 1];

  if (!lastCheckpoint || lastCheckpoint.day !== summary.daysPlayed) {
    checkpoints.push(createHarnessCheckpoint(result.state, result.gameOverReason));
  }

  return {
    summary,
    checkpoints,
  };
}

export interface AdvanceGameStateInput {
  seed: number;
  days: number;
  checkpointIntervalDays?: number;
  recordCheckpoint?: (state: GameState, gameOverReason?: GameOverReason) => void;
  aiHiringEnabled?: boolean;
}

export interface AdvanceGameStateResult {
  state: GameState;
  gameOverReason?: GameOverReason;
}

export function advanceGameState(
  state: GameState,
  input: AdvanceGameStateInput,
): AdvanceGameStateResult {
  if (!Number.isInteger(input.days) || input.days <= 0) {
    throw new Error("Invalid advance days: expected a positive integer day count");
  }
  if (
    input.checkpointIntervalDays !== undefined &&
    (!Number.isInteger(input.checkpointIntervalDays) || input.checkpointIntervalDays <= 0)
  ) {
    throw new Error("Invalid checkpoint interval: expected a positive integer day count");
  }

  const rng = createSeededRng(input.seed + state.day);
  let gameOverReason: GameOverReason | undefined;

  for (let i = 0; i < input.days; i += 1) {
    state.day += 1;
    advanceFounderLifecycle(state, { daysElapsed: 1 });
    applyMacroCycle(state, state.day);

    const marketRoll = rng.next();
    if (marketRoll < PROBABILITY_CONFIG.society.dailyMarketShockChance) {
      applySocietyEvent(state, {
        type: "market_shock",
        cashDelta: 0,
        reputationDelta: 0,
        marketSentimentDelta: -0.03,
      });
    } else if (
      marketRoll <
      PROBABILITY_CONFIG.society.dailyMarketShockChance +
        PROBABILITY_CONFIG.society.supportivePolicyChance
    ) {
      applySocietyEvent(state, {
        type: "policy_support",
        cashDelta: 5000,
        reputationDelta: 1,
        marketSentimentDelta: 0.03,
      });
    }

    const operationalEfficiency = calculateOperationalEfficiency({
      resources: state.company.resources,
      headcount: state.company.headcount,
      culture: state.company.culture,
    });
    const dailyRevenue =
      (state.company.annualRevenue / 365) * state.marketSentiment * operationalEfficiency;
    const dailyBurn = state.company.monthlyBurn / 30;
    state.company.cash += dailyRevenue - dailyBurn;

    if (rng.next() < PROBABILITY_CONFIG.society.legalIncidentChance) {
      applySocietyEvent(state, {
        type: "legal_incident",
        cashDelta: -2500,
        reputationDelta: -1,
      });
    }

    if (state.day % 30 === 0) {
      advanceEmployeeTenure(state, { months: 1 });
      maybeApplySpecialEvent(state, {
        triggerRoll: rng.next(),
        typeRoll: rng.next(),
      });
      updateResources(state);

      if (input.aiHiringEnabled) {
        runAIHiringCycle(state, { seed: input.seed + state.day });
      }

      for (const policy of state.company.insurancePolicies) {
        if (policy.active) {
          state.company.cash -= policy.premium;
        }
      }

      processInvestmentReturns(state, { seed: input.seed + state.day });

      if (state.company.isPublic) {
        processMonthlyGovernance(state, { seed: input.seed + state.day });
      }

      const growth = 0.01 + state.company.reputation * 0.001 + rng.next() * 0.01;
      state.company.annualRevenue *= 1 + growth;
    }

    if (state.day % 90 === 0) {
      const plannedRoles = getHiringPlan({
        headcount: state.company.headcount,
        annualRevenue: state.company.annualRevenue,
        resources: state.company.resources,
      });
      const role = plannedRoles[state.company.headcount % plannedRoles.length];
      const candidate = generateCandidate({
        seed: input.seed + state.day,
        role,
        seniority: state.company.headcount > 10 ? "mid" : "junior",
        companyReputation: state.company.reputation,
      });
      const marketAdjustedCandidate = applyLaborMarketPressure(candidate, {
        unemploymentRate: state.society.unemploymentRate,
      });
      const offer = {
        salary: Math.round(marketAdjustedCandidate.targetSalary * 0.96),
        equityPercent: state.company.headcount < 5 ? 0.2 : 0.05,
      };
      const negotiation = negotiateHiring({
        seed: input.seed + state.day,
        companyReputation: state.company.reputation,
        companyCulture: state.company.culture,
        offer,
        candidate: marketAdjustedCandidate,
      });

      if (negotiation.accepted) {
        hireEmployee(state, {
          candidate: marketAdjustedCandidate,
          salary: offer.salary,
          equityPercent: offer.equityPercent,
        });
        state.company.morale = Math.min(10, state.company.morale + 0.2);
      } else {
        recordGameEvent(state, {
          type: "hiring_failed",
          role: candidate.role,
        });
      }
    }

    if (state.day % 120 === 0) {
      processResignations(state, { seed: input.seed + state.day });
    }

    if (state.day % 180 === 0) {
      processPromotions(state);
    }

    if (state.day % 180 === 0 && state.company.cash < state.company.monthlyBurn * 4) {
      applyBankLoan(state, { requestedAmount: 80_000 });
    }

    if (state.day % 210 === 0) {
      evaluatePolicySupport(state, {
        priorityIndustries: ["technology", "advanced-manufacturing"],
        minimumReputation: 5,
      });
    }

    if (state.day % 240 === 0 && rng.next() < 0.25) {
      resolveCourtCase(state, {
        type: rng.next() > 0.5 ? "company_violation" : "employee_violation",
        severity: 1 + Math.floor(rng.next() * 3),
      });
    }

    if (!state.company.isPublic && state.day % 365 === 0) {
      prepareIpo(state, { marketSentiment: state.marketSentiment });
    }

    if (state.company.isPublic) {
      updateListedMarketValue(state, { seed: input.seed + state.day });
    }

    const valuation = calculateCompanyValuation({
      isPublic: state.company.isPublic,
      annualRevenue: state.company.annualRevenue,
      profitMargin: 0.18,
      reputation: state.company.reputation,
      marketSentiment: state.marketSentiment,
      listedMarketValue: state.company.listedMarketValue,
      operationalCapability: state.company.operationalCapability,
    });
    state.company.valuation = valuation.value;
    state.founder.wealth = 20000 + state.company.valuation * 0.7;

    const gameOver = checkGameOver(state);
    if (gameOver.isGameOver) {
      gameOverReason = gameOver.reason;
      if (gameOverReason) {
        recordGameEvent(state, {
          type: "game_over",
          reason: gameOverReason,
        });
      }
      input.recordCheckpoint?.(state, gameOverReason);
      break;
    }

    if (input.checkpointIntervalDays && state.day % input.checkpointIntervalDays === 0) {
      input.recordCheckpoint?.(state);
    }
  }

  return { state, gameOverReason };
}

export function summarizeGameState(
  state: GameState,
  gameOverReason?: GameOverReason,
  aiHiringEnabled?: boolean,
): HarnessSummary {
  const daysPlayed = readNonNegativeFinite(state.day, 0);
  const companyValuation = readNonNegativeFinite(state.company.valuation, 0);
  const playerWealth = readNonNegativeFinite(state.founder.wealth, 0);
  const staffRoleCounts = createStaffRoleCounts(state);
  const totalMonthlyPayroll = state.company.employees.reduce(
    (total, employee) => total + readNonNegativeFinite(employee.salary, 0),
    0,
  );
  const averageEmployeeSalary =
    state.company.employees.length > 0
      ? Math.round(totalMonthlyPayroll / state.company.employees.length)
      : 0;

  const aiHires = state.events.filter((e) => e.type === "ai_hire_succeeded").length;
  const aiHiringFailures = state.events.filter((e) => e.type === "ai_hire_failed").length;

  const activeInsurancePolicies = state.company.insurancePolicies.filter((p) => p.active).length;
  const totalMonthlyInsurancePremiums = state.company.insurancePolicies
    .filter((p) => p.active)
    .reduce((sum, p) => sum + readNonNegativeFinite(p.premium, 0), 0);

  const investmentCount = state.company.investments.length;
  const portfolioValue = readNonNegativeFinite(getPortfolioValue(state), 0);
  const totalInvested = state.company.investments.reduce(
    (sum, inv) => sum + readNonNegativeFinite(inv.amount, 0),
    0,
  );
  const investmentGain = portfolioValue - totalInvested;

  return {
    daysPlayed,
    companyValuation,
    valuationKind: state.company.isPublic ? "listed_market" : "private_estimate",
    isPublic: state.company.isPublic,
    listedMarketValue:
      state.company.listedMarketValue === undefined
        ? undefined
        : readNonNegativeFinite(state.company.listedMarketValue, 0),
    playerWealth,
    score: calculateFinalScore({
      daysPlayed,
      companyValuation,
      playerWealth,
    }),
    cash: readFinite(state.company.cash, 0),
    headcount: readNonNegativeFinite(state.company.headcount, 0),
    debt: readNonNegativeFinite(state.company.debt, 0),
    employeeCount: state.company.employees.length,
    staffRoleCounts,
    totalMonthlyPayroll,
    averageEmployeeSalary,
    employees: state.company.employees.map((employee) => {
      const salary = readNonNegativeFinite(employee.salary, 0);
      const targetSalary = readNonNegativeFinite(employee.targetSalary, salary);
      const stressTolerance = readFinite(employee.stressTolerance, 0);
      const personality = readFinite(employee.personality, 0);

      return {
        id: employee.id,
        role: employee.role,
        salary,
        targetSalary,
        personality,
        monthsTenure: readNonNegativeFinite(employee.monthsTenure, 0),
        managementLevel: employee.managementLevel,
        resignationRisk: calculateResignationRisk({
          salary,
          targetSalary,
          stressTolerance,
          culturePressure: readFinite(state.company.culturePressure, 0),
          morale: readFinite(state.company.morale, 0),
          culture: state.company.culture,
          personality,
        }),
        abilities: {
          technical: readFinite(employee.technical, 0),
          experience: readFinite(employee.experience, 0),
          stressTolerance,
          communication: readFinite(employee.communication, 0),
          eq: readFinite(employee.eq, 0),
          iq: readFinite(employee.iq, 0),
        },
      };
    }),
    companyReputation: readFinite(state.company.reputation, 0),
    companyMorale: readFinite(state.company.morale, 0),
    companyCulture: state.company.culture,
    culturePressure: readFinite(state.company.culturePressure, 0),
    founderAbilities: state.founder.abilities,
    founderAge: readNonNegativeFinite(state.founder.age, 0),
    founderHealth: readFinite(state.founder.health, 0),
    cyclePhase: state.society.cyclePhase,
    unemploymentRate: readFinite(state.society.unemploymentRate, 0),
    legalCaseCount: readNonNegativeFinite(state.society.legalCaseCount, 0),
    policySupportCount: readNonNegativeFinite(state.society.policySupportCount, 0),
    specialEventCount: readNonNegativeFinite(state.society.specialEventCount, 0),
    events: state.events,
    eventSummary: createGameEventSummary(state.events),
    eventLog: state.eventLog,
    gameOverReason,
    aiHiringEnabled: aiHiringEnabled ?? false,
    aiHires,
    aiHiringFailures,
    activeInsurancePolicies,
    totalMonthlyInsurancePremiums,
    investmentCount,
    portfolioValue,
    totalInvested,
    investmentGain,
    governanceScore:
      state.company.governanceMetrics?.overallScore === undefined
        ? undefined
        : readFinite(state.company.governanceMetrics.overallScore, 0),
    delistingRiskLevel: state.company.isPublic ? evaluateDelistingRisk(state).riskLevel : undefined,
  };
}

function createHarnessCheckpoint(
  state: GameState,
  gameOverReason?: GameOverReason,
): HarnessCheckpoint {
  const summary = summarizeGameState(state, gameOverReason);
  return {
    day: summary.daysPlayed,
    companyValuation: summary.companyValuation,
    valuationKind: summary.valuationKind,
    isPublic: summary.isPublic,
    listedMarketValue: summary.listedMarketValue,
    playerWealth: summary.playerWealth,
    score: summary.score,
    cash: summary.cash,
    headcount: summary.headcount,
    debt: summary.debt,
    employeeCount: summary.employeeCount,
    staffRoleCounts: summary.staffRoleCounts,
    totalMonthlyPayroll: summary.totalMonthlyPayroll,
    averageEmployeeSalary: summary.averageEmployeeSalary,
    companyReputation: summary.companyReputation,
    companyMorale: summary.companyMorale,
    founderAbilities: summary.founderAbilities,
    founderAge: summary.founderAge,
    founderHealth: summary.founderHealth,
    cyclePhase: summary.cyclePhase,
    unemploymentRate: summary.unemploymentRate,
    gameOverReason: summary.gameOverReason,
    investmentCount: summary.investmentCount,
    portfolioValue: summary.portfolioValue,
    governanceScore: summary.governanceScore,
    delistingRiskLevel: summary.delistingRiskLevel,
  };
}

function createStaffRoleCounts(state: GameState): CompanyRoleCounts {
  const counts = createEmptyRoleCounts();

  for (const employee of state.company.employees) {
    counts[employee.role] += 1;
  }

  return counts;
}

function createEmptyRoleCounts(): CompanyRoleCounts {
  const roles: CompanyRole[] = ["engineer", "product", "sales", "finance", "hr"];

  return roles.reduce(
    (counts, role) => ({
      ...counts,
      [role]: 0,
    }),
    {} as CompanyRoleCounts,
  );
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function readNonNegativeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
