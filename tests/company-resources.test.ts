import {
  calculateResourceCapacity,
  updateResources,
  calculateOperationalEfficiency,
  applyResourceCost,
} from "../src/sim/company-resources";
import { createInitialGameState } from "../src/sim/state";

describe("calculateResourceCapacity", () => {
  it("returns 0 for zero inputs", () => {
    expect(calculateResourceCapacity({ headcount: 0, cash: 0, reputation: 0 })).toBe(0);
  });

  it("returns higher capacity for stronger companies", () => {
    const small = calculateResourceCapacity({ headcount: 1, cash: 50_000, reputation: 2 });
    const large = calculateResourceCapacity({ headcount: 30, cash: 500_000, reputation: 10 });
    expect(large).toBeGreaterThan(small);
  });

  it("caps at 10 for maximum inputs", () => {
    const capacity = calculateResourceCapacity({
      headcount: 100,
      cash: 1_000_000,
      reputation: 10,
    });
    expect(capacity).toBeLessThanOrEqual(10);
  });

  it("weights reputation most heavily", () => {
    const highRep = calculateResourceCapacity({ headcount: 5, cash: 100_000, reputation: 10 });
    const highCash = calculateResourceCapacity({ headcount: 5, cash: 500_000, reputation: 2 });
    expect(highRep).toBeGreaterThan(highCash);
  });
});

describe("updateResources", () => {
  it("initializes with default resources of 5", () => {
    const state = createInitialGameState({ seed: 1 });
    expect(state.company.resources).toBe(5);
    expect(state.company.operationalCapability).toBe(5);
  });

  it("drifts resources toward capacity over time", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.cash = 500_000;
    state.company.reputation = 8;
    state.company.headcount = 20;

    const initialResources = state.company.resources;
    updateResources(state);

    expect(state.company.resources).toBeGreaterThanOrEqual(initialResources);
  });

  it("drifts resources down when company is weak", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.resources = 8;
    state.company.cash = 10_000;
    state.company.reputation = 1;
    state.company.headcount = 1;

    updateResources(state);

    expect(state.company.resources).toBeLessThan(8);
  });

  it("clamps resources between 0 and 10", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.resources = 0;
    state.company.cash = 0;
    state.company.reputation = 0;

    updateResources(state);
    expect(state.company.resources).toBeGreaterThanOrEqual(0);

    state.company.resources = 10;
    state.company.cash = 1_000_000;
    state.company.reputation = 10;
    state.company.headcount = 50;

    updateResources(state);
    expect(state.company.resources).toBeLessThanOrEqual(10);
  });
});

describe("calculateOperationalEfficiency", () => {
  it("returns minimum efficiency for worst inputs", () => {
    const efficiency = calculateOperationalEfficiency({
      resources: 0,
      headcount: 0,
      culture: "laissez-faire",
    });
    expect(efficiency).toBeGreaterThanOrEqual(0.5);
    expect(efficiency).toBeLessThan(1);
  });

  it("returns higher efficiency for better-resourced companies", () => {
    const low = calculateOperationalEfficiency({
      resources: 2,
      headcount: 3,
      culture: "adaptive",
    });
    const high = calculateOperationalEfficiency({
      resources: 9,
      headcount: 20,
      culture: "adaptive",
    });
    expect(high).toBeGreaterThan(low);
  });

  it("caps at maximum efficiency of 1.5", () => {
    const efficiency = calculateOperationalEfficiency({
      resources: 10,
      headcount: 50,
      culture: "adaptive",
    });
    expect(efficiency).toBeLessThanOrEqual(1.5);
  });

  it("reflects culture differences", () => {
    const adaptive = calculateOperationalEfficiency({
      resources: 5,
      headcount: 10,
      culture: "adaptive",
    });
    const laissezFaire = calculateOperationalEfficiency({
      resources: 5,
      headcount: 10,
      culture: "laissez-faire",
    });
    expect(adaptive).toBeGreaterThan(laissezFaire);
  });
});

describe("applyResourceCost", () => {
  it("deducts resources and returns true when sufficient", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.resources = 5;

    const result = applyResourceCost(state, 3);

    expect(result).toBe(true);
    expect(state.company.resources).toBe(2);
  });

  it("returns false and does not deduct when insufficient", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.resources = 2;

    const result = applyResourceCost(state, 5);

    expect(result).toBe(false);
    expect(state.company.resources).toBe(2);
  });

  it("clamps resources to 0 after deduction", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.resources = 0.3;

    const result = applyResourceCost(state, 0.5);

    expect(result).toBe(false);
    expect(state.company.resources).toBe(0.3);
  });
});
