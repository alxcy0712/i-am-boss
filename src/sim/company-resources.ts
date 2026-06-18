import { PROBABILITY_CONFIG } from "../config/probabilities";
import type { CompanyCulture, GameState } from "./types";
import { clamp } from "./rng";

const CONFIG = PROBABILITY_CONFIG.companyResources;

export interface ResourceCapacityInput {
  headcount: number;
  cash: number;
  reputation: number;
}

export interface OperationalEfficiencyInput {
  resources: number;
  headcount: number;
  culture: CompanyCulture;
}

const CULTURE_OPERATIONAL_BONUS: Record<CompanyCulture, number> = {
  wolf: -0.05,
  "laissez-faire": -0.1,
  adaptive: 0.1,
  striver: 0.05,
};

export function calculateResourceCapacity(input: ResourceCapacityInput): number {
  const cashScore = clamp(input.cash / 200_000, 0, 1) * 10;
  const reputationScore = clamp(input.reputation / 10, 0, 1) * 10;
  const headcountScore = clamp(input.headcount / 30, 0, 1) * 10;

  const weighted =
    cashScore * CONFIG.cashResourceWeight +
    reputationScore * CONFIG.reputationResourceWeight +
    headcountScore * CONFIG.headcountResourceWeight;

  return clamp(Math.round(weighted * 10) / 10, 0, 10);
}

export function updateResources(state: GameState): void {
  const capacity = calculateResourceCapacity({
    headcount: state.company.headcount,
    cash: state.company.cash,
    reputation: state.company.reputation,
  });

  const drift = capacity - state.company.resources;
  const adjustment = drift * 0.1;

  state.company.resources = clamp(
    Math.round((state.company.resources + adjustment) * 10) / 10,
    0,
    10,
  );

  updateOperationalCapability(state);
}

function updateOperationalCapability(state: GameState): void {
  const resourceContribution = state.company.resources / 10;
  const headcountContribution = clamp(state.company.headcount / 25, 0, 1);
  const cultureBonus = CULTURE_OPERATIONAL_BONUS[state.company.culture];

  const targetCapability =
    (resourceContribution * 0.5 + headcountContribution * 0.3 + 0.2) * 10 + cultureBonus * 10;

  const drift = clamp(targetCapability, 0, 10) - state.company.operationalCapability;
  const adjustment = drift * 0.08;

  state.company.operationalCapability = clamp(
    Math.round((state.company.operationalCapability + adjustment) * 10) / 10,
    0,
    10,
  );
}

export function calculateOperationalEfficiency(input: OperationalEfficiencyInput): number {
  const resourceFactor = input.resources / 10;
  const headcountFactor = clamp(input.headcount / 20, 0, 1);
  const cultureBonus = CULTURE_OPERATIONAL_BONUS[input.culture];

  const efficiency = 0.5 + resourceFactor * 0.5 + headcountFactor * 0.3 + cultureBonus;

  return clamp(
    Math.round(efficiency * 100) / 100,
    CONFIG.minOperationalEfficiency,
    CONFIG.maxOperationalEfficiency,
  );
}

export function applyResourceCost(state: GameState, cost: number): boolean {
  if (state.company.resources < cost) {
    return false;
  }

  state.company.resources = clamp(Math.round((state.company.resources - cost) * 10) / 10, 0, 10);
  return true;
}
