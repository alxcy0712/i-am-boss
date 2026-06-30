import {
  advanceEmployeeTenure,
  calculateSeverance,
  hireEmployee,
  processResignations,
  raiseEmployeeSalary,
  runMonthlyPayroll,
  terminateEmployee,
} from "../src/sim/employee-lifecycle";
import { deserializeGameState, serializeGameState } from "../src/harness/snapshot";
import { generateCandidate } from "../src/sim/staffing";
import { createInitialGameState } from "../src/sim/state";

describe("employee lifecycle", () => {
  it("hires a candidate into the employee roster and updates payroll load", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const previousBurn = state.company.monthlyBurn;

    const employee = hireEmployee(state, {
      candidate,
      salary: candidate.targetSalary,
      equityPercent: 0.2,
    });

    expect(state.company.employees).toHaveLength(1);
    expect(state.company.headcount).toBe(2);
    expect(state.company.monthlyBurn).toBe(previousBurn + candidate.targetSalary);
    expect(employee.role).toBe("engineer");
  });

  it("rejects non-positive hiring salaries", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });

    expect(() => hireEmployee(state, { candidate, salary: -1, equityPercent: 0 })).toThrow(
      "Invalid salary: expected a positive amount",
    );
    expect(state.company.employees).toHaveLength(0);
    expect(state.company.headcount).toBe(1);
    expect(state.company.monthlyBurn).toBe(9000);
  });

  it("rejects non-finite hiring salaries", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });

    expect(() => hireEmployee(state, { candidate, salary: Number.NaN, equityPercent: 0 })).toThrow(
      "Invalid salary: expected a finite amount",
    );
    expect(() => hireEmployee(state, { candidate, salary: Infinity, equityPercent: 0 })).toThrow(
      "Invalid salary: expected a finite amount",
    );
    expect(state.company.employees).toHaveLength(0);
    expect(state.company.monthlyBurn).toBe(9000);
  });

  it("rejects hiring equity outside the supported range", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });

    expect(() =>
      hireEmployee(state, { candidate, salary: 10_000, equityPercent: Number.NaN }),
    ).toThrow("Invalid equity: expected a percentage between 0 and 1");
    expect(() => hireEmployee(state, { candidate, salary: 10_000, equityPercent: -0.01 })).toThrow(
      "Invalid equity: expected a percentage between 0 and 1",
    );
    expect(() => hireEmployee(state, { candidate, salary: 10_000, equityPercent: 1.01 })).toThrow(
      "Invalid equity: expected a percentage between 0 and 1",
    );
    expect(state.company.employees).toHaveLength(0);
    expect(state.company.headcount).toBe(1);
    expect(state.company.monthlyBurn).toBe(9000);
  });

  it("keeps payroll load finite when hiring into invalid current burn", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    state.company.monthlyBurn = Number.NaN;

    hireEmployee(state, { candidate, salary: 10_000, equityPercent: 0 });

    expect(state.company.monthlyBurn).toBe(10_000);
  });

  it("deducts monthly payroll and advances employee tenure", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    hireEmployee(state, { candidate, salary: 10_000, equityPercent: 0 });
    const previousCash = state.company.cash;

    runMonthlyPayroll(state);

    expect(state.company.cash).toBe(previousCash - 10_000);
    expect(state.company.employees[0]?.monthsTenure).toBe(1);
  });

  it("keeps payroll finite when an employee salary is invalid", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 10_000, equityPercent: 0 });
    employee.salary = Number.NaN;
    const previousCash = state.company.cash;

    const payroll = runMonthlyPayroll(state);

    expect(payroll).toBe(0);
    expect(state.company.cash).toBe(previousCash);
    expect(employee.monthsTenure).toBe(1);
  });

  it("keeps employee tenure finite during payroll", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 10_000, equityPercent: 0 });
    employee.monthsTenure = Number.NaN;

    runMonthlyPayroll(state);

    expect(employee.monthsTenure).toBe(1);
  });

  it("rejects negative tenure advances", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 10_000, equityPercent: 0 });

    expect(() => advanceEmployeeTenure(state, { months: -1 })).toThrow(
      "Invalid tenure advance: expected a non-negative month count",
    );
    expect(employee.monthsTenure).toBe(0);
  });

  it("rejects non-finite tenure advances", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 10_000, equityPercent: 0 });

    expect(() => advanceEmployeeTenure(state, { months: Number.NaN })).toThrow(
      "Invalid tenure advance: expected a finite month count",
    );
    expect(() => advanceEmployeeTenure(state, { months: Infinity })).toThrow(
      "Invalid tenure advance: expected a finite month count",
    );
    expect(employee.monthsTenure).toBe(0);
  });

  it("pays severance when the company terminates an employee", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 12_000, equityPercent: 0 });
    employee.monthsTenure = 14;
    const previousCash = state.company.cash;

    const severance = terminateEmployee(state, employee.id);

    expect(severance).toBe(calculateSeverance({ salary: 12_000, monthsTenure: 14 }));
    expect(state.company.cash).toBe(previousCash - severance);
    expect(state.company.employees).toHaveLength(0);
    expect(state.company.headcount).toBe(1);
  });

  it("returns finite severance for invalid salary and tenure values", () => {
    expect(calculateSeverance({ salary: Number.NaN, monthsTenure: 12 })).toBe(0);
    expect(calculateSeverance({ salary: 12_000, monthsTenure: Number.NaN })).toBe(12_000);
  });

  it("keeps company finances finite when terminating an employee with invalid payroll fields", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 12_000, equityPercent: 0 });
    employee.salary = Number.NaN;
    employee.monthsTenure = Number.NaN;

    const severance = terminateEmployee(state, employee.id);

    expect(severance).toBe(0);
    expect(Number.isFinite(state.company.cash)).toBe(true);
    expect(Number.isFinite(state.company.monthlyBurn)).toBe(true);
    expect(state.company.employees).toHaveLength(0);
    expect(state.company.headcount).toBe(1);
  });

  it("terminates employees with corrupted roles without recording invalid events", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 12_000, equityPercent: 0 });
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];
    employee.role = "invalid" as never;

    const severance = terminateEmployee(state, employee.id);

    expect(severance).toBe(12_000);
    expect(state.company.employees).toHaveLength(0);
    expect(state.company.headcount).toBe(1);
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
    expect(() => deserializeGameState(serializeGameState(state))).not.toThrow();
  });

  it("rejects non-finite salary raises without changing payroll", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 12_000, equityPercent: 0 });
    const previousBurn = state.company.monthlyBurn;

    const result = raiseEmployeeSalary(state, {
      employeeId: employee.id,
      salary: Number.NaN,
    });

    expect(result).toBeUndefined();
    expect(employee.salary).toBe(12_000);
    expect(state.company.monthlyBurn).toBe(previousBurn);
  });

  it("rejects default salary raises when current salary is invalid", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 12_000, equityPercent: 0 });
    employee.salary = Number.NaN;
    const previousBurn = state.company.monthlyBurn;

    const result = raiseEmployeeSalary(state, {
      employeeId: employee.id,
    });

    expect(result).toBeUndefined();
    expect(Number.isFinite(state.company.monthlyBurn)).toBe(true);
    expect(state.company.monthlyBurn).toBe(previousBurn);
  });

  it("raises salaries for employees with corrupted roles without recording invalid events", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 12_000, equityPercent: 0 });
    const previousBurn = state.company.monthlyBurn;
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];
    employee.role = "invalid" as never;

    const result = raiseEmployeeSalary(state, {
      employeeId: employee.id,
      salary: 13_000,
    });

    expect(result).toMatchObject({
      previousSalary: 12_000,
      salary: 13_000,
      delta: 1_000,
    });
    expect(employee.salary).toBe(13_000);
    expect(state.company.monthlyBurn).toBe(previousBurn + 1_000);
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
  });

  it("removes employees whose resignation risk exceeds a seeded roll", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 8, role: "engineer", seniority: "junior" });
    hireEmployee(state, { candidate, salary: candidate.minimumSalary, equityPercent: 0 });
    state.company.culturePressure = 10;
    state.company.morale = 1;

    const resigned = processResignations(state, { seed: 2 });

    expect(resigned).toHaveLength(1);
    expect(state.company.employees).toHaveLength(0);
  });

  it("keeps payroll finite when an employee with invalid salary resigns", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 12_000, equityPercent: 0 });
    employee.salary = Number.NaN;

    const resigned = processResignations(state, { seed: 7 });

    expect(resigned).toHaveLength(1);
    expect(Number.isFinite(state.company.monthlyBurn)).toBe(true);
    expect(state.company.employees).toHaveLength(0);
  });

  it("returns finite employee payroll fields for resigned employees", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, { candidate, salary: 12_000, equityPercent: 0 });
    employee.salary = Number.NaN;
    employee.targetSalary = Infinity;

    const resigned = processResignations(state, { seed: 7 });

    expect(resigned).toHaveLength(1);
    expect(Number.isFinite(resigned[0]?.salary)).toBe(true);
    expect(Number.isFinite(resigned[0]?.targetSalary)).toBe(true);
  });
});
