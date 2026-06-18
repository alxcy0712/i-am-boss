import { PROBABILITY_CONFIG } from "../config/probabilities";
import { hireEmployee } from "./employee-lifecycle";
import { recordGameEvent } from "./events";
import type { Candidate } from "./hiring";
import { negotiateHiring } from "./hiring";
import { applyLaborMarketPressure } from "./labor-market";
import { createSeededRng, clamp } from "./rng";
import { generateCandidate, getAIHiringDecision, getHiringPlan, type Seniority } from "./staffing";
import type { CompanyRole, GameState } from "./types";

export interface HiringNeed {
  role: CompanyRole;
  priority: number;
  seniority: Seniority;
}

export interface HiringAttempt {
  role: CompanyRole;
  candidate: Candidate;
  offeredSalary: number;
  equityPercent: number;
  accepted: boolean;
  acceptanceProbability: number;
  reason?: string;
}

export interface HiringCycleResult {
  attempts: HiringAttempt[];
  hires: number;
  failures: number;
}

export function evaluateHiringNeeds(state: GameState): HiringNeed[] {
  const config = PROBABILITY_CONFIG.aiHiring;
  const { headcount, annualRevenue, resources, cash, monthlyBurn } = state.company;
  const plannedRoles = getHiringPlan({
    headcount,
    annualRevenue,
    resources,
  });

  const needs: HiringNeed[] = [];
  const roleCounts = countRoles(state);

  for (const role of plannedRoles) {
    const currentCount = roleCounts[role] ?? 0;
    const expectedCount = Math.ceil(headcount / plannedRoles.length);
    const deficit = expectedCount - currentCount;

    if (deficit > 0 && cash > monthlyBurn * 3) {
      const seniority: Seniority = headcount > 15 ? "mid" : "junior";
      needs.push({
        role,
        priority: deficit + (role === "engineer" ? 0.5 : 0),
        seniority,
      });
    }
  }

  needs.sort((a, b) => b.priority - a.priority);
  return needs.slice(0, config.maxHiresPerMonth);
}

export function initiateAIHiring(
  state: GameState,
  input: { seed: number; role: CompanyRole; seniority: Seniority },
): HiringAttempt {
  const candidate = applyLaborMarketPressure(
    generateCandidate({
      seed: input.seed,
      role: input.role,
      seniority: input.seniority,
      companyReputation: state.company.reputation,
    }),
    { unemploymentRate: state.society.unemploymentRate },
  );

  const marketRate = candidate.targetSalary;
  const decision = getAIHiringDecision({
    role: input.role,
    companyCash: state.company.cash,
    marketRate,
  });

  const offeredSalary = clamp(
    Math.round(marketRate * (0.96 + (decision.strategy === "aggressive" ? 0.04 : 0))),
    decision.targetSalaryMin,
    decision.targetSalaryMax,
  );

  const equityPercent = decision.equityPercent;
  const negotiation = negotiateHiring({
    seed: input.seed,
    companyReputation: state.company.reputation,
    companyCulture: state.company.culture,
    offer: { salary: offeredSalary, equityPercent },
    candidate,
  });

  return {
    role: input.role,
    candidate,
    offeredSalary,
    equityPercent,
    accepted: negotiation.accepted,
    acceptanceProbability: negotiation.acceptanceProbability,
    reason: negotiation.reason,
  };
}

export function runAIHiringCycle(state: GameState, input: { seed: number }): HiringCycleResult {
  const config = PROBABILITY_CONFIG.aiHiring;
  const rng = createSeededRng(input.seed);
  const roll = rng.next();

  if (roll > config.monthlyHiringChance) {
    return { attempts: [], hires: 0, failures: 0 };
  }

  const needs = evaluateHiringNeeds(state);
  const attempts: HiringAttempt[] = [];
  let hires = 0;
  let failures = 0;

  for (let i = 0; i < needs.length; i++) {
    const need = needs[i];
    const attemptSeed = input.seed + state.day + i;
    const attempt = initiateAIHiring(state, {
      seed: attemptSeed,
      role: need.role,
      seniority: need.seniority,
    });

    if (attempt.accepted) {
      hireEmployee(state, {
        candidate: attempt.candidate,
        salary: attempt.offeredSalary,
        equityPercent: attempt.equityPercent,
      });
      recordGameEvent(state, {
        type: "ai_hire_succeeded",
        role: attempt.role,
        salary: attempt.offeredSalary,
      });
      hires += 1;
    } else {
      recordGameEvent(state, {
        type: "ai_hire_failed",
        role: attempt.role,
        reason: attempt.reason,
      });
      failures += 1;
    }

    attempts.push(attempt);
  }

  return { attempts, hires, failures };
}

function countRoles(state: GameState): Record<CompanyRole, number> {
  const counts: Record<CompanyRole, number> = {
    engineer: 0,
    product: 0,
    sales: 0,
    finance: 0,
    hr: 0,
  };

  for (const employee of state.company.employees) {
    counts[employee.role] += 1;
  }

  return counts;
}
