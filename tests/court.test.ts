import { resolveCourtCase } from "../src/sim/court";
import { createInitialGameState } from "../src/sim/state";

describe("resolveCourtCase", () => {
  it("applies company violation penalties through the court system", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;
    const previousReputation = state.company.reputation;

    const result = resolveCourtCase(state, {
      type: "company_violation",
      severity: 3
    });

    expect(result.penalty).toBeGreaterThan(0);
    expect(state.company.cash).toBe(previousCash - result.penalty);
    expect(state.company.reputation).toBeLessThan(previousReputation);
  });

  it("applies employee violation losses without graphic details", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;

    const result = resolveCourtCase(state, {
      type: "employee_violation",
      severity: 2
    });

    expect(result.abstractSummary).toContain("employee_violation");
    expect(state.company.cash).toBeLessThan(previousCash);
  });
});
