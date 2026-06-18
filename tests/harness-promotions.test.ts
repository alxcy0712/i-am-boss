import { advanceGameState } from "../src/harness/sim-harness";
import { hireEmployee } from "../src/sim/employee-lifecycle";
import type { Candidate } from "../src/sim/hiring";
import { createInitialGameState } from "../src/sim/state";

const promotableCandidate: Candidate = {
  role: "product",
  targetSalary: 24_000,
  minimumSalary: 20_000,
  technical: 7,
  experienceYears: 9,
  stressTolerance: 9,
  communication: 10,
  eq: 9,
  iq: 8,
  background: {
    educationTier: "strong",
    major: "business",
    industryExperienceYears: 7,
  },
  personality: 5,
};

describe("harness promotions", () => {
  it("advances tenure monthly and processes promotions on the half-year cadence", () => {
    const state = createInitialGameState({ seed: 21, initialChoiceId: "network-founder" });
    state.day = 179;
    state.company.cash = 5_000_000;
    state.company.annualRevenue = 1_500_000;
    state.company.monthlyBurn = 1_000;
    state.company.headcount = 12;
    const employee = hireEmployee(state, {
      candidate: promotableCandidate,
      salary: 24_000,
      equityPercent: 0.1,
    });
    employee.monthsTenure = 11;

    const result = advanceGameState(state, { seed: 21, days: 1 });

    expect(result.state.company.employees[0]?.monthsTenure).toBe(12);
    expect(result.state.company.employees[0]?.managementLevel).toBe("middle");
    expect(
      result.state.eventLog.some((entry) => entry === "Promoted product to middle management"),
    ).toBe(true);
  });
});
