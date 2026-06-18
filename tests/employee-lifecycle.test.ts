import {
  calculateSeverance,
  hireEmployee,
  processResignations,
  runMonthlyPayroll,
  terminateEmployee,
} from "../src/sim/employee-lifecycle";
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

  it("deducts monthly payroll and advances employee tenure", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    hireEmployee(state, { candidate, salary: 10_000, equityPercent: 0 });
    const previousCash = state.company.cash;

    runMonthlyPayroll(state);

    expect(state.company.cash).toBe(previousCash - 10_000);
    expect(state.company.employees[0]?.monthsTenure).toBe(1);
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
});
