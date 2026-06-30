import { resolveCourtCase } from "../src/sim/court";
import { createInitialGameState } from "../src/sim/state";

describe("resolveCourtCase", () => {
  it("applies company violation penalties through the court system", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;
    const previousReputation = state.company.reputation;

    const result = resolveCourtCase(state, {
      type: "company_violation",
      severity: 3,
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
      severity: 2,
    });

    expect(result.abstractSummary).toContain("employee_violation");
    expect(state.company.cash).toBeLessThan(previousCash);
  });

  it("rejects non-finite severity without changing state", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;
    const previousReputation = state.company.reputation;
    const previousCaseCount = state.society.legalCaseCount;

    const result = resolveCourtCase(state, {
      type: "company_violation",
      severity: Number.NaN,
    });

    expect(result.penalty).toBe(0);
    expect(result.reputationDelta).toBe(0);
    expect(result.abstractSummary).toBe("invalid court case severity");
    expect(state.company.cash).toBe(previousCash);
    expect(state.company.reputation).toBe(previousReputation);
    expect(state.society.legalCaseCount).toBe(previousCaseCount);
  });

  it("rejects invalid court case types without changing state or events", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;
    const previousReputation = state.company.reputation;
    const previousCaseCount = state.society.legalCaseCount;
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];

    const result = resolveCourtCase(state, {
      type: "bad" as never,
      severity: 2,
    });

    expect(result.penalty).toBe(0);
    expect(result.reputationDelta).toBe(0);
    expect(result.abstractSummary).toBe("invalid court case type");
    expect(state.company.cash).toBe(previousCash);
    expect(state.company.reputation).toBe(previousReputation);
    expect(state.society.legalCaseCount).toBe(previousCaseCount);
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
  });

  it("keeps resolved court cases finite for corrupted state", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.cash = Number.NaN;
    state.company.reputation = Infinity;
    state.society.legalCaseCount = Infinity;

    const result = resolveCourtCase(state, {
      type: "company_violation",
      severity: 3,
    });

    expect(Number.isFinite(result.penalty)).toBe(true);
    expect(Number.isFinite(result.reputationDelta)).toBe(true);
    expect(Number.isFinite(state.company.cash)).toBe(true);
    expect(Number.isFinite(state.company.reputation)).toBe(true);
    expect(Number.isFinite(state.society.legalCaseCount)).toBe(true);
    expect(state.company.cash).toBe(-result.penalty);
    expect(state.company.reputation).toBe(0);
    expect(state.society.legalCaseCount).toBe(1);
  });

  it("normalizes corrupted state when rejecting invalid severity", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.cash = Number.NaN;
    state.company.reputation = Number.NaN;
    state.society.legalCaseCount = Infinity;

    const result = resolveCourtCase(state, {
      type: "company_violation",
      severity: Number.NaN,
    });

    expect(result.penalty).toBe(0);
    expect(Number.isFinite(state.company.cash)).toBe(true);
    expect(Number.isFinite(state.company.reputation)).toBe(true);
    expect(Number.isFinite(state.society.legalCaseCount)).toBe(true);
    expect(state.company.cash).toBe(0);
    expect(state.company.reputation).toBe(0);
    expect(state.society.legalCaseCount).toBe(0);
  });
});
