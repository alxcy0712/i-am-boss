import { createGameViewModel } from "../src/ui/view-model";
import { runHarness, summarizeGameState } from "../src/harness/sim-harness";
import { hireEmployee } from "../src/sim/employee-lifecycle";
import { generateCandidate } from "../src/sim/staffing";
import { createInitialGameState } from "../src/sim/state";

describe("createGameViewModel", () => {
  it("maps harness output into browser HUD and city map data", () => {
    const summary = runHarness({
      seed: 1,
      days: 120,
      initialChoiceId: "network-founder",
    });
    const viewModel = createGameViewModel(summary);

    expect(viewModel.title).toBe("我是老板 / I am boss");
    expect(viewModel.hud.cash.label).toBe("Cash");
    expect(viewModel.hud.cash.value).toMatch(/^¥/);
    expect(viewModel.hud.score.value).toMatch(/^\d/);
    expect(viewModel.hud.culture.label).toBe("Culture");
    expect(viewModel.hud.morale.value).toMatch(/\/10$/);
    expect(viewModel.hud.reputation.value).toMatch(/\/10$/);
    expect(viewModel.hud.pressure.value).toMatch(/\/10$/);
    expect(viewModel.mapLocations.map((location) => location.id)).toEqual([
      "company",
      "bank",
      "exchange",
      "labor-market",
      "court",
      "policy-office",
    ]);
    expect(viewModel.eventFeed.length).toBeLessThanOrEqual(8);
    expect(viewModel.events.length).toBeLessThanOrEqual(8);
    expect(viewModel.events.every((event) => event.category)).toBe(true);
    expect(viewModel.events.every((event) => event.severity)).toBe(true);
  });

  it("keeps summary and HUD values finite for polluted numeric state", () => {
    const state = createInitialGameState({ seed: 1 });
    const candidate = generateCandidate({ seed: 5, role: "engineer", seniority: "junior" });
    const employee = hireEmployee(state, {
      candidate,
      salary: 10_000,
      equityPercent: 0,
    });
    employee.salary = Number.NaN;
    employee.targetSalary = Infinity;
    employee.monthsTenure = Number.NaN;
    state.company.cash = Number.NaN;
    state.company.valuation = Infinity;
    state.founder.wealth = Number.NaN;

    const summary = summarizeGameState(state);
    const viewModel = createGameViewModel(summary);

    expect(Number.isFinite(summary.cash)).toBe(true);
    expect(Number.isFinite(summary.companyValuation)).toBe(true);
    expect(Number.isFinite(summary.playerWealth)).toBe(true);
    expect(Number.isFinite(summary.totalMonthlyPayroll)).toBe(true);
    expect(Number.isFinite(summary.averageEmployeeSalary)).toBe(true);
    expect(summary.employees.every((item) => Number.isFinite(item.salary))).toBe(true);
    expect(summary.employees.every((item) => Number.isFinite(item.targetSalary))).toBe(true);
    expect(summary.employees.every((item) => Number.isFinite(item.monthsTenure))).toBe(true);
    expect(Object.values(viewModel.hud).every((metric) => !metric.value.includes("NaN"))).toBe(
      true,
    );
    expect(Object.values(viewModel.hud).every((metric) => !metric.value.includes("∞"))).toBe(true);
  });

  it("keeps HUD display values readable when summary metrics are polluted directly", () => {
    const summary = runHarness({
      seed: 1,
      days: 30,
      initialChoiceId: "network-founder",
    });
    summary.cash = Number.NaN;
    summary.companyValuation = Infinity;
    summary.score = Number.NaN;
    summary.companyMorale = Infinity;
    summary.companyReputation = Number.NaN;
    summary.culturePressure = Infinity;

    const viewModel = createGameViewModel(summary);

    expect(Object.values(viewModel.hud).every((metric) => !metric.value.includes("NaN"))).toBe(
      true,
    );
    expect(Object.values(viewModel.hud).every((metric) => !metric.value.includes("∞"))).toBe(true);
    expect(Object.values(viewModel.hud).every((metric) => !metric.value.includes("Infinity"))).toBe(
      true,
    );
  });
});
