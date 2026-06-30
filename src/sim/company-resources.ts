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
  const cashScore = clamp(readFinite(input.cash, 0) / 200_000, 0, 1) * 10;
  const reputationScore = clamp(readFinite(input.reputation, 0) / 10, 0, 1) * 10;
  const headcountScore = clamp(readFinite(input.headcount, 0) / 30, 0, 1) * 10;

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

  const currentResources = readFinite(state.company.resources, 5);
  const drift = capacity - currentResources;
  const adjustment = drift * 0.1;

  state.company.resources = clamp(Math.round((currentResources + adjustment) * 10) / 10, 0, 10);

  updateOperationalCapability(state);
}

function updateOperationalCapability(state: GameState): void {
  const resourceContribution = state.company.resources / 10;
  const headcountContribution = clamp(readFinite(state.company.headcount, 0) / 25, 0, 1);
  const cultureBonus = CULTURE_OPERATIONAL_BONUS[state.company.culture] ?? 0;

  const targetCapability =
    (resourceContribution * 0.5 + headcountContribution * 0.3 + 0.2) * 10 + cultureBonus * 10;

  const currentCapability = readFinite(state.company.operationalCapability, 5);
  const drift = clamp(targetCapability, 0, 10) - currentCapability;
  const adjustment = drift * 0.08;

  state.company.operationalCapability = clamp(
    Math.round((currentCapability + adjustment) * 10) / 10,
    0,
    10,
  );
}

export function calculateOperationalEfficiency(input: OperationalEfficiencyInput): number {
  const resourceFactor = readFinite(input.resources, 0) / 10;
  const headcountFactor = clamp(readFinite(input.headcount, 0) / 20, 0, 1);
  const cultureBonus = CULTURE_OPERATIONAL_BONUS[input.culture] ?? 0;

  const efficiency = 0.5 + resourceFactor * 0.5 + headcountFactor * 0.3 + cultureBonus;

  return clamp(
    Math.round(efficiency * 100) / 100,
    CONFIG.minOperationalEfficiency,
    CONFIG.maxOperationalEfficiency,
  );
}

export function applyResourceCost(state: GameState, cost: number): boolean {
  if (!Number.isFinite(cost) || cost < 0) {
    return false;
  }

  if (state.company.resources < cost) {
    return false;
  }

  state.company.resources = clamp(Math.round((state.company.resources - cost) * 10) / 10, 0, 10);
  return true;
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
