import {
  advanceEmployeeTenure,
  hireEmployee,
  processPromotions
} from "../src/sim/employee-lifecycle";
import type { Candidate } from "../src/sim/hiring";
import { createInitialGameState } from "../src/sim/state";

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    role: "engineer",
    targetSalary: 20_000,
    minimumSalary: 16_000,
    technical: 7,
    experienceYears: 8,
    stressTolerance: 8,
    communication: 9,
    eq: 8,
    iq: 8,
    background: {
      educationTier: "strong",
      major: "computer-science",
      industryExperienceYears: 6
    },
    personality: "steady",
    ...overrides
  };
}

describe("employee promotions", () => {
  it("hires employees as individual contributors", () => {
    const state = createInitialGameState({ seed: 1 });
    const employee = hireEmployee(state, {
      candidate: candidate(),
      salary: 20_000,
      equityPercent: 0
    });

    expect(employee.managementLevel).toBe("individual");
  });

  it("promotes high-communication employees into middle management", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.headcount = 12;
    const employee = hireEmployee(state, {
      candidate: candidate(),
      salary: 20_000,
      equityPercent: 0
    });
    employee.monthsTenure = 12;
    const previousBurn = state.company.monthlyBurn;

    const promoted = processPromotions(state);

    expect(promoted.map((item) => item.managementLevel)).toEqual(["middle"]);
    expect(employee.managementLevel).toBe("middle");
    expect(employee.salary).toBeGreaterThan(20_000);
    expect(state.company.monthlyBurn).toBeGreaterThan(previousBurn);
    expect(state.eventLog.at(-1)).toBe("Promoted engineer to middle management");
  });

  it("promotes proven middle managers into executive management", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.headcount = 35;
    const employee = hireEmployee(state, {
      candidate: candidate({ communication: 10, eq: 9, stressTolerance: 9 }),
      salary: 28_000,
      equityPercent: 0.1
    });
    employee.managementLevel = "middle";
    employee.monthsTenure = 36;

    const promoted = processPromotions(state);

    expect(promoted.map((item) => item.managementLevel)).toEqual(["executive"]);
    expect(employee.managementLevel).toBe("executive");
    expect(state.eventLog.at(-1)).toBe("Promoted engineer to executive management");
  });

  it("advances tenure without charging payroll twice", () => {
    const state = createInitialGameState({ seed: 1 });
    hireEmployee(state, {
      candidate: candidate(),
      salary: 20_000,
      equityPercent: 0
    });
    const previousCash = state.company.cash;

    advanceEmployeeTenure(state, { months: 2 });

    expect(state.company.employees[0]?.monthsTenure).toBe(2);
    expect(state.company.cash).toBe(previousCash);
  });
});
