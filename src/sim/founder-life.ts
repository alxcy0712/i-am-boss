import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import { clamp } from "./rng";
import type { Car, Child, GameState, Marriage } from "./types";

const CONFIG = PROBABILITY_CONFIG.personalLife;

export interface CarResult {
  success: boolean;
  car?: Car;
  reason?: string;
}

export interface MarriageResult {
  success: boolean;
  marriage?: Marriage;
  reason?: string;
}

export interface ChildResult {
  success: boolean;
  child?: Child;
  reason?: string;
}

export interface ExpenseResult {
  totalExpenses: number;
  carMaintenance: number;
  marriageExpense: number;
  childEducation: number;
}

let nextId = 1;

function generateId(prefix: string): string {
  return `${prefix}-${nextId++}-${Date.now()}`;
}

export function purchaseCar(state: GameState, input: { brand: string; value: number }): CarResult {
  if (typeof input.brand !== "string" || !input.brand.trim()) {
    return { success: false, reason: "invalid_brand" };
  }

  if (!Number.isFinite(input.value)) {
    return { success: false, reason: "invalid_value" };
  }

  if (input.value <= 0) {
    return { success: false, reason: "invalid_value" };
  }

  if (state.founder.wealth < input.value) {
    return { success: false, reason: "insufficient_wealth" };
  }

  const car: Car = {
    id: generateId("car"),
    brand: input.brand,
    value: input.value,
    maintenanceCost: input.value * CONFIG.carMaintenanceRate,
    purchaseDate: state.day,
  };

  state.founder.wealth -= input.value;
  state.founder.personalLife.cars.push(car);

  recordGameEvent(state, {
    type: "car_purchased",
    carId: car.id,
    brand: car.brand,
    value: car.value,
  });

  return { success: true, car };
}

export function upgradeCar(
  state: GameState,
  input: { carId: string; newValue: number },
): CarResult {
  if (!Number.isFinite(input.newValue)) {
    return { success: false, reason: "invalid_value" };
  }

  if (input.newValue <= 0) {
    return { success: false, reason: "invalid_value" };
  }

  const car = state.founder.personalLife.cars.find((c) => c.id === input.carId);
  if (!car) {
    return { success: false, reason: "car_not_found" };
  }

  if (input.newValue <= car.value) {
    return { success: false, reason: "upgrade_must_increase_value" };
  }

  const cost = input.newValue - car.value;
  if (state.founder.wealth < cost) {
    return { success: false, reason: "insufficient_wealth" };
  }

  state.founder.wealth -= cost;
  car.value = input.newValue;
  car.maintenanceCost = input.newValue * CONFIG.carMaintenanceRate;

  if (typeof car.brand === "string" && car.brand.trim()) {
    recordGameEvent(state, {
      type: "car_upgraded",
      carId: car.id,
      brand: car.brand,
      newValue: car.value,
    });
  }

  return { success: true, car };
}

export function getMarried(state: GameState, input: { spouseName: string }): MarriageResult {
  if (typeof input.spouseName !== "string" || !input.spouseName.trim()) {
    return { success: false, reason: "invalid_name" };
  }

  if (state.founder.personalLife.marriage) {
    return { success: false, reason: "already_married" };
  }

  const marriage: Marriage = {
    spouseName: input.spouseName,
    marriageDate: state.day,
    happiness: 5,
    divorceRisk: 0,
  };

  state.founder.personalLife.marriage = marriage;
  state.founder.personalLife.happiness = clamp(
    state.founder.personalLife.happiness + CONFIG.marriageHappinessBonus,
    0,
    10,
  );

  recordGameEvent(state, {
    type: "marriage",
    spouseName: marriage.spouseName,
  });

  return { success: true, marriage };
}

export function haveChild(state: GameState, input: { childName: string }): ChildResult {
  if (typeof input.childName !== "string" || !input.childName.trim()) {
    return { success: false, reason: "invalid_name" };
  }

  if (!state.founder.personalLife.marriage) {
    return { success: false, reason: "not_married" };
  }

  const child: Child = {
    id: generateId("child"),
    name: input.childName,
    birthDate: state.day,
    educationCost: CONFIG.childEducationCost,
    happiness: 5,
  };

  state.founder.personalLife.children.push(child);
  state.founder.personalLife.happiness = clamp(
    state.founder.personalLife.happiness + CONFIG.childHappinessBonus,
    0,
    10,
  );

  recordGameEvent(state, {
    type: "child_born",
    childId: child.id,
    childName: child.name,
  });

  return { success: true, child };
}

export function processPersonalExpenses(state: GameState): ExpenseResult {
  const personalLife = state.founder.personalLife;

  const carMaintenance = personalLife.cars.reduce(
    (sum, car) => sum + readNonNegativeFinite(car.maintenanceCost, 0),
    0,
  );

  const marriageExpense = personalLife.marriage
    ? readNonNegativeFinite(state.founder.wealth, 0) * CONFIG.marriageExpenseRate
    : 0;

  const childEducation = personalLife.children.reduce(
    (sum, child) => sum + readNonNegativeFinite(child.educationCost, 0),
    0,
  );

  const totalExpenses = carMaintenance + marriageExpense + childEducation;

  if (totalExpenses > 0) {
    state.founder.wealth = Math.max(0, state.founder.wealth - totalExpenses);
  }

  return { totalExpenses, carMaintenance, marriageExpense, childEducation };
}

export function calculatePersonalHappiness(state: GameState): number {
  const personalLife = state.founder.personalLife;
  let happiness = personalLife.happiness;

  if (personalLife.marriage) {
    happiness += CONFIG.marriageHappinessBonus;
  }

  happiness += personalLife.children.length * CONFIG.childHappinessBonus;

  if (personalLife.cars.length > 0) {
    happiness += Math.min(personalLife.cars.length * 0.5, 2);
  }

  return clamp(happiness, 0, 10);
}

export function maybeProcessDivorce(state: GameState): boolean {
  const marriage = state.founder.personalLife.marriage;
  if (!marriage) {
    return false;
  }

  const happiness = calculatePersonalHappiness(state);
  if (happiness >= CONFIG.divorceHappinessThreshold) {
    marriage.divorceRisk = 0;
    return false;
  }

  marriage.divorceRisk = clamp(marriage.divorceRisk + 0.1, 0, 1);

  if (marriage.divorceRisk < 1) {
    return false;
  }

  const wealthLoss = Math.round(state.founder.wealth * CONFIG.divorceWealthLossRate);
  state.founder.wealth = Math.max(0, state.founder.wealth - wealthLoss);
  state.founder.personalLife.marriage = undefined;
  state.founder.personalLife.happiness = clamp(state.founder.personalLife.happiness - 3, 0, 10);

  if (typeof marriage.spouseName === "string" && marriage.spouseName.trim()) {
    recordGameEvent(state, {
      type: "divorce",
      spouseName: marriage.spouseName,
      wealthLoss,
    });
  }

  return true;
}

export function getPersonalLifeSummary(state: GameState): {
  carCount: number;
  totalCarValue: number;
  isMarried: boolean;
  childCount: number;
  monthlyExpenses: number;
  happiness: number;
} {
  const personalLife = state.founder.personalLife;
  const carCount = personalLife.cars.length;
  const totalCarValue = personalLife.cars.reduce(
    (sum, car) => sum + readNonNegativeFinite(car.value, 0),
    0,
  );
  const isMarried = Boolean(personalLife.marriage);
  const childCount = personalLife.children.length;

  const carMaintenance = personalLife.cars.reduce(
    (sum, car) => sum + readNonNegativeFinite(car.maintenanceCost, 0),
    0,
  );
  const marriageExpense = isMarried
    ? readNonNegativeFinite(state.founder.wealth, 0) * CONFIG.marriageExpenseRate
    : 0;
  const childEducation = personalLife.children.reduce(
    (sum, child) => sum + readNonNegativeFinite(child.educationCost, 0),
    0,
  );
  const monthlyExpenses = carMaintenance + marriageExpense + childEducation;

  return {
    carCount,
    totalCarValue,
    isMarried,
    childCount,
    monthlyExpenses,
    happiness: calculatePersonalHappiness(state),
  };
}

function readNonNegativeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
