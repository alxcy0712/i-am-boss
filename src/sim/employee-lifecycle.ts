import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import type { Candidate } from "./hiring";
import { calculateResignationRisk } from "./resignation";
import { clamp, createSeededRng } from "./rng";
import type { CompanyRole, EmployeeState, GameState, ManagementLevel } from "./types";

const COMPANY_ROLES = new Set<CompanyRole>(["engineer", "product", "sales", "finance", "hr"]);

export interface HireEmployeeInput {
  candidate: Candidate;
  salary: number;
  equityPercent: number;
}

export function hireEmployee(state: GameState, input: HireEmployeeInput): EmployeeState {
  if (!Number.isFinite(input.salary)) {
    throw new Error("Invalid salary: expected a finite amount");
  }
  if (input.salary <= 0) {
    throw new Error("Invalid salary: expected a positive amount");
  }
  if (!Number.isFinite(input.equityPercent) || input.equityPercent < 0 || input.equityPercent > 1) {
    throw new Error("Invalid equity: expected a percentage between 0 and 1");
  }

  const employee: EmployeeState = {
    id: `${input.candidate.role}-${state.day}-${state.company.employees.length + 1}`,
    role: input.candidate.role,
    salary: input.salary,
    targetSalary: input.candidate.targetSalary,
    equityPercent: input.equityPercent,
    background: input.candidate.background,
    technical: input.candidate.technical,
    experience: input.candidate.experienceYears,
    stressTolerance: input.candidate.stressTolerance,
    communication: input.candidate.communication,
    eq: input.candidate.eq,
    iq: input.candidate.iq,
    personality: input.candidate.personality,
    monthsTenure: 0,
    managementLevel: "individual",
  };

  state.company.employees.push(employee);
  state.company.headcount += 1;
  state.company.monthlyBurn = readNonNegativeFinite(state.company.monthlyBurn, 0) + input.salary;
  recordGameEvent(state, {
    type: "employee_hired",
    role: employee.role,
    salary: input.salary,
  });
  return employee;
}

export function runMonthlyPayroll(state: GameState): number {
  const payroll = state.company.employees.reduce((total, employee) => {
    employee.monthsTenure = readNonNegativeFinite(employee.monthsTenure, 0) + 1;
    return total + readNonNegativeFinite(employee.salary, 0);
  }, 0);

  state.company.cash -= payroll;
  recordGameEvent(state, {
    type: "payroll_paid",
    amount: payroll,
  });
  return payroll;
}

export function advanceEmployeeTenure(state: GameState, input: { months: number }): void {
  if (!Number.isFinite(input.months)) {
    throw new Error("Invalid tenure advance: expected a finite month count");
  }
  if (input.months < 0) {
    throw new Error("Invalid tenure advance: expected a non-negative month count");
  }

  for (const employee of state.company.employees) {
    employee.monthsTenure += input.months;
  }
}

export function processPromotions(state: GameState): EmployeeState[] {
  const promoted: EmployeeState[] = [];

  for (const employee of state.company.employees) {
    if (!Number.isFinite(employee.salary)) {
      continue;
    }

    const nextLevel = getNextManagementLevel(state, employee);
    if (!nextLevel) {
      continue;
    }

    promoteEmployee(state, employee, nextLevel);
    promoted.push(employee);
  }

  return promoted;
}

export function calculateSeverance(input: { salary: number; monthsTenure: number }): number {
  const salary = readNonNegativeFinite(input.salary, 0);
  const monthsTenure = readNonNegativeFinite(input.monthsTenure, 0);
  const serviceYears = Math.ceil(monthsTenure / 12);
  const severanceMonths = Math.max(
    PROBABILITY_CONFIG.employeeLifecycle.minimumSeveranceMonths,
    serviceYears * PROBABILITY_CONFIG.employeeLifecycle.severanceMonthsPerServiceYear,
  );
  return salary * severanceMonths;
}

export function terminateEmployee(state: GameState, employeeId: string): number {
  const employee = state.company.employees.find((item) => item.id === employeeId);
  if (!employee) {
    return 0;
  }

  const severance = calculateSeverance({
    salary: employee.salary,
    monthsTenure: employee.monthsTenure,
  });
  const salary = readNonNegativeFinite(employee.salary, 0);
  state.company.employees = state.company.employees.filter((item) => item.id !== employeeId);
  state.company.headcount -= 1;
  state.company.monthlyBurn -= salary;
  state.company.cash -= severance;
  if (COMPANY_ROLES.has(employee.role)) {
    recordGameEvent(state, {
      type: "employee_terminated",
      role: employee.role,
      severance,
    });
  }
  return severance;
}

export interface SalaryAdjustmentResult {
  employee: EmployeeState;
  previousSalary: number;
  salary: number;
  delta: number;
}

export function raiseEmployeeSalary(
  state: GameState,
  input: { employeeId: string; salary?: number },
): SalaryAdjustmentResult | undefined {
  const employee = state.company.employees.find((item) => item.id === input.employeeId);
  if (!employee) {
    return undefined;
  }

  if (input.salary !== undefined && !Number.isFinite(input.salary)) {
    return undefined;
  }

  const previousSalary = employee.salary;
  if (!Number.isFinite(previousSalary)) {
    return undefined;
  }

  const defaultSalary = Math.round(
    previousSalary * (1 + PROBABILITY_CONFIG.employeeLifecycle.salaryRaiseRate),
  );
  const salary = Math.max(previousSalary, Math.round(input.salary ?? defaultSalary));
  const delta = salary - previousSalary;

  if (delta === 0) {
    return {
      employee,
      previousSalary,
      salary,
      delta,
    };
  }

  employee.salary = salary;
  state.company.monthlyBurn += delta;
  if (COMPANY_ROLES.has(employee.role)) {
    recordGameEvent(state, {
      type: "employee_salary_adjusted",
      role: employee.role,
      previousSalary,
      salary,
    });
  }

  return {
    employee,
    previousSalary,
    salary,
    delta,
  };
}

export function processResignations(state: GameState, input: { seed: number }): EmployeeState[] {
  const rng = createSeededRng(input.seed);
  const resigned: EmployeeState[] = [];

  for (const employee of state.company.employees) {
    const risk = calculateResignationRisk({
      salary: employee.salary,
      targetSalary: employee.targetSalary,
      stressTolerance: employee.stressTolerance,
      culturePressure: state.company.culturePressure,
      morale: state.company.morale,
      culture: state.company.culture,
      personality: employee.personality,
    });

    if (risk > rng.next()) {
      resigned.push(createFinitePayrollEmployee(employee));
    }
  }

  if (resigned.length > 0) {
    const resignedIds = new Set(resigned.map((employee) => employee.id));
    state.company.employees = state.company.employees.filter(
      (employee) => !resignedIds.has(employee.id),
    );
    state.company.headcount -= resigned.length;
    state.company.monthlyBurn -= resigned.reduce(
      (total, employee) => total + readNonNegativeFinite(employee.salary, 0),
      0,
    );
    recordGameEvent(state, {
      type: "employees_resigned",
      count: resigned.length,
    });
  }

  return resigned;
}

function getNextManagementLevel(
  state: GameState,
  employee: EmployeeState,
): ManagementLevel | undefined {
  const config = PROBABILITY_CONFIG.promotion;
  const score = calculatePromotionScore(employee);

  if (
    employee.managementLevel === "individual" &&
    state.company.headcount >= config.middleManagementMinimumHeadcount &&
    employee.monthsTenure >= config.middleManagementMinimumTenureMonths &&
    score >= config.middleManagementScoreThreshold
  ) {
    return "middle";
  }

  if (
    employee.managementLevel === "middle" &&
    state.company.headcount >= config.executiveMinimumHeadcount &&
    employee.monthsTenure >= config.executiveMinimumTenureMonths &&
    score >= config.executiveScoreThreshold
  ) {
    return "executive";
  }

  return undefined;
}

function calculatePromotionScore(employee: EmployeeState): number {
  const config = PROBABILITY_CONFIG.promotion;
  const experienceScore = clamp(employee.experience, 0, 10);
  const tenureScore = clamp(employee.monthsTenure / config.executiveMinimumTenureMonths, 0, 1) * 10;

  return (
    employee.communication * config.communicationWeight +
    employee.eq * config.eqWeight +
    employee.stressTolerance * config.stressToleranceWeight +
    experienceScore * config.experienceWeight +
    tenureScore * config.tenureWeight
  );
}

function promoteEmployee(
  state: GameState,
  employee: EmployeeState,
  nextLevel: ManagementLevel,
): void {
  if (!Number.isFinite(employee.salary)) {
    return;
  }

  const raise = Math.round(employee.salary * PROBABILITY_CONFIG.promotion.salaryRaiseRate);
  employee.salary += raise;
  employee.managementLevel = nextLevel;
  state.company.monthlyBurn += raise;
  state.company.morale = Math.min(
    10,
    state.company.morale + PROBABILITY_CONFIG.promotion.moraleGain,
  );
  if (COMPANY_ROLES.has(employee.role)) {
    recordGameEvent(state, {
      type: "employee_promoted",
      role: employee.role,
      managementLevel: nextLevel,
    });
  }
}

function readNonNegativeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function createFinitePayrollEmployee(employee: EmployeeState): EmployeeState {
  const salary = readNonNegativeFinite(employee.salary, 0);
  return {
    ...employee,
    salary,
    targetSalary: readNonNegativeFinite(employee.targetSalary, salary),
    monthsTenure: readNonNegativeFinite(employee.monthsTenure, 0),
  };
}
