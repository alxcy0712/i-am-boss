import {
  purchaseCar,
  upgradeCar,
  getMarried,
  haveChild,
  processPersonalExpenses,
  calculatePersonalHappiness,
  maybeProcessDivorce,
  getPersonalLifeSummary,
} from "../src/sim/founder-life";
import { advanceFounderLifecycle } from "../src/sim/founder-lifecycle";
import { createInitialGameState } from "../src/sim/state";

describe("purchaseCar", () => {
  it("creates a car and deducts wealth", () => {
    const state = createInitialGameState({ seed: 1 });
    const wealthBefore = state.founder.wealth;

    const result = purchaseCar(state, { brand: "Toyota", value: 5000 });

    expect(result.success).toBe(true);
    expect(result.car).toBeDefined();
    expect(result.car!.brand).toBe("Toyota");
    expect(result.car!.value).toBe(5000);
    expect(state.founder.wealth).toBe(wealthBefore - 5000);
    expect(state.founder.personalLife.cars).toHaveLength(1);
  });

  it("rejects purchase with insufficient wealth", () => {
    const state = createInitialGameState({ seed: 1 });
    state.founder.wealth = 1000;

    const result = purchaseCar(state, { brand: "BMW", value: 50000 });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("insufficient_wealth");
    expect(state.founder.personalLife.cars).toHaveLength(0);
  });

  it("rejects purchase with invalid value", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = purchaseCar(state, { brand: "BMW", value: -100 });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid_value");
  });

  it("records car_purchased event", () => {
    const state = createInitialGameState({ seed: 1 });

    purchaseCar(state, { brand: "Honda", value: 3000 });

    const event = state.events.find((e) => e.type === "car_purchased");
    expect(event).toBeDefined();
    expect(event!.category).toBe("founder");
    expect(event!.severity).toBe("positive");
  });

  it("allows multiple cars", () => {
    const state = createInitialGameState({ seed: 1 });

    purchaseCar(state, { brand: "Toyota", value: 3000 });
    purchaseCar(state, { brand: "Honda", value: 4000 });

    expect(state.founder.personalLife.cars).toHaveLength(2);
  });

  it("calculates maintenance cost as 2% of value", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = purchaseCar(state, { brand: "BMW", value: 10000 });

    expect(result.car!.maintenanceCost).toBe(200);
  });
});

describe("upgradeCar", () => {
  it("upgrades existing car and deducts cost difference", () => {
    const state = createInitialGameState({ seed: 1 });
    const purchaseResult = purchaseCar(state, { brand: "Toyota", value: 5000 });
    const carId = purchaseResult.car!.id;
    const wealthBefore = state.founder.wealth;

    const result = upgradeCar(state, { carId, newValue: 8000 });

    expect(result.success).toBe(true);
    expect(result.car!.value).toBe(8000);
    expect(state.founder.wealth).toBe(wealthBefore - 3000);
  });

  it("rejects upgrade for non-existent car", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = upgradeCar(state, { carId: "nonexistent", newValue: 10000 });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("car_not_found");
  });

  it("rejects upgrade that decreases value", () => {
    const state = createInitialGameState({ seed: 1 });
    const purchaseResult = purchaseCar(state, { brand: "Toyota", value: 10000 });

    const result = upgradeCar(state, { carId: purchaseResult.car!.id, newValue: 5000 });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("upgrade_must_increase_value");
  });

  it("rejects upgrade with insufficient wealth", () => {
    const state = createInitialGameState({ seed: 1 });
    const purchaseResult = purchaseCar(state, { brand: "Toyota", value: 5000 });
    state.founder.wealth = 100;

    const result = upgradeCar(state, { carId: purchaseResult.car!.id, newValue: 20000 });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("insufficient_wealth");
  });

  it("updates maintenance cost after upgrade", () => {
    const state = createInitialGameState({ seed: 1 });
    const purchaseResult = purchaseCar(state, { brand: "Toyota", value: 5000 });

    upgradeCar(state, { carId: purchaseResult.car!.id, newValue: 10000 });

    expect(state.founder.personalLife.cars[0].maintenanceCost).toBe(200);
  });

  it("records car_upgraded event", () => {
    const state = createInitialGameState({ seed: 1 });
    const purchaseResult = purchaseCar(state, { brand: "Toyota", value: 5000 });

    upgradeCar(state, { carId: purchaseResult.car!.id, newValue: 10000 });

    const event = state.events.find((e) => e.type === "car_upgraded");
    expect(event).toBeDefined();
  });
});

describe("getMarried", () => {
  it("creates marriage and increases happiness", () => {
    const state = createInitialGameState({ seed: 1 });
    const happinessBefore = state.founder.personalLife.happiness;

    const result = getMarried(state, { spouseName: "Alice" });

    expect(result.success).toBe(true);
    expect(result.marriage).toBeDefined();
    expect(result.marriage!.spouseName).toBe("Alice");
    expect(state.founder.personalLife.marriage).toBeDefined();
    expect(state.founder.personalLife.happiness).toBeGreaterThan(happinessBefore);
  });

  it("rejects marriage with empty name", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = getMarried(state, { spouseName: "" });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid_name");
  });

  it("rejects marriage when already married", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });

    const result = getMarried(state, { spouseName: "Bob" });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("already_married");
  });

  it("records marriage event", () => {
    const state = createInitialGameState({ seed: 1 });

    getMarried(state, { spouseName: "Alice" });

    const event = state.events.find((e) => e.type === "marriage");
    expect(event).toBeDefined();
    expect(event!.category).toBe("founder");
    expect(event!.severity).toBe("positive");
  });
});

describe("haveChild", () => {
  it("creates child and increases happiness", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    const happinessBefore = state.founder.personalLife.happiness;

    const result = haveChild(state, { childName: "Tom" });

    expect(result.success).toBe(true);
    expect(result.child).toBeDefined();
    expect(result.child!.name).toBe("Tom");
    expect(state.founder.personalLife.children).toHaveLength(1);
    expect(state.founder.personalLife.happiness).toBeGreaterThan(happinessBefore);
  });

  it("rejects child when not married", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = haveChild(state, { childName: "Tom" });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("not_married");
  });

  it("rejects child with empty name", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });

    const result = haveChild(state, { childName: "" });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid_name");
  });

  it("records child_born event", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });

    haveChild(state, { childName: "Tom" });

    const event = state.events.find((e) => e.type === "child_born");
    expect(event).toBeDefined();
    expect(event!.category).toBe("founder");
    expect(event!.severity).toBe("positive");
  });

  it("allows multiple children", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });

    haveChild(state, { childName: "Tom" });
    haveChild(state, { childName: "Jerry" });

    expect(state.founder.personalLife.children).toHaveLength(2);
  });
});

describe("processPersonalExpenses", () => {
  it("charges car maintenance costs", () => {
    const state = createInitialGameState({ seed: 1 });
    purchaseCar(state, { brand: "Toyota", value: 10000 });
    const wealthBefore = state.founder.wealth;

    const result = processPersonalExpenses(state);

    expect(result.carMaintenance).toBe(200);
    expect(result.totalExpenses).toBe(200);
    expect(state.founder.wealth).toBe(wealthBefore - 200);
  });

  it("charges marriage expenses", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    const wealthBefore = state.founder.wealth;

    const result = processPersonalExpenses(state);

    expect(result.marriageExpense).toBeGreaterThan(0);
    expect(state.founder.wealth).toBeLessThan(wealthBefore);
  });

  it("charges child education costs", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    haveChild(state, { childName: "Tom" });
    const wealthBefore = state.founder.wealth;

    const result = processPersonalExpenses(state);

    expect(result.childEducation).toBe(5000);
    expect(state.founder.wealth).toBeLessThan(wealthBefore);
  });

  it("charges no expenses with no personal life", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = processPersonalExpenses(state);

    expect(result.totalExpenses).toBe(0);
  });

  it("does not reduce wealth below zero", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    haveChild(state, { childName: "Tom" });
    state.founder.wealth = 100;

    processPersonalExpenses(state);

    expect(state.founder.wealth).toBe(0);
  });
});

describe("calculatePersonalHappiness", () => {
  it("returns base happiness with no personal life", () => {
    const state = createInitialGameState({ seed: 1 });

    const happiness = calculatePersonalHappiness(state);

    expect(happiness).toBe(5);
  });

  it("increases happiness with marriage", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });

    const happiness = calculatePersonalHappiness(state);

    expect(happiness).toBeGreaterThan(5);
  });

  it("increases happiness with children", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    haveChild(state, { childName: "Tom" });

    const happiness = calculatePersonalHappiness(state);

    expect(happiness).toBeGreaterThan(7);
  });

  it("increases happiness with cars", () => {
    const state = createInitialGameState({ seed: 1 });
    purchaseCar(state, { brand: "Toyota", value: 5000 });

    const happiness = calculatePersonalHappiness(state);

    expect(happiness).toBeGreaterThan(5);
  });

  it("caps happiness at 10", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    haveChild(state, { childName: "Tom" });
    haveChild(state, { childName: "Jerry" });
    haveChild(state, { childName: "Spike" });
    purchaseCar(state, { brand: "BMW", value: 10000 });
    purchaseCar(state, { brand: "Mercedes", value: 20000 });

    const happiness = calculatePersonalHappiness(state);

    expect(happiness).toBeLessThanOrEqual(10);
  });
});

describe("maybeProcessDivorce", () => {
  it("does not divorce when happiness is high", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });

    const divorced = maybeProcessDivorce(state);

    expect(divorced).toBe(false);
    expect(state.founder.personalLife.marriage).toBeDefined();
  });

  it("increases divorce risk when happiness is low", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    state.founder.personalLife.happiness = 0;

    maybeProcessDivorce(state);

    expect(state.founder.personalLife.marriage!.divorceRisk).toBeGreaterThan(0);
  });

  it("processes divorce after risk reaches threshold", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    state.founder.personalLife.happiness = 0;
    state.founder.personalLife.marriage!.divorceRisk = 0.9;

    const divorced = maybeProcessDivorce(state);

    expect(divorced).toBe(true);
    expect(state.founder.personalLife.marriage).toBeUndefined();
  });

  it("deducts wealth on divorce", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    state.founder.personalLife.happiness = 0;
    state.founder.personalLife.marriage!.divorceRisk = 0.9;
    const wealthBefore = state.founder.wealth;

    maybeProcessDivorce(state);

    expect(state.founder.wealth).toBeLessThan(wealthBefore);
  });

  it("records divorce event", () => {
    const state = createInitialGameState({ seed: 1 });
    getMarried(state, { spouseName: "Alice" });
    state.founder.personalLife.happiness = 0;
    state.founder.personalLife.marriage!.divorceRisk = 0.9;

    maybeProcessDivorce(state);

    const event = state.events.find((e) => e.type === "divorce");
    expect(event).toBeDefined();
    expect(event!.category).toBe("founder");
    expect(event!.severity).toBe("warning");
  });

  it("does nothing when not married", () => {
    const state = createInitialGameState({ seed: 1 });

    const divorced = maybeProcessDivorce(state);

    expect(divorced).toBe(false);
  });
});

describe("getPersonalLifeSummary", () => {
  it("returns summary with no personal life", () => {
    const state = createInitialGameState({ seed: 1 });

    const summary = getPersonalLifeSummary(state);

    expect(summary.carCount).toBe(0);
    expect(summary.totalCarValue).toBe(0);
    expect(summary.isMarried).toBe(false);
    expect(summary.childCount).toBe(0);
    expect(summary.monthlyExpenses).toBe(0);
    expect(summary.happiness).toBe(5);
  });

  it("returns summary with full personal life", () => {
    const state = createInitialGameState({ seed: 1 });
    purchaseCar(state, { brand: "Toyota", value: 10000 });
    getMarried(state, { spouseName: "Alice" });
    haveChild(state, { childName: "Tom" });

    const summary = getPersonalLifeSummary(state);

    expect(summary.carCount).toBe(1);
    expect(summary.totalCarValue).toBe(10000);
    expect(summary.isMarried).toBe(true);
    expect(summary.childCount).toBe(1);
    expect(summary.monthlyExpenses).toBeGreaterThan(0);
    expect(summary.happiness).toBeGreaterThan(5);
  });
});

describe("personal life integration with founder lifecycle", () => {
  it("processes personal expenses during lifecycle advancement", () => {
    const state = createInitialGameState({ seed: 1 });
    purchaseCar(state, { brand: "Toyota", value: 10000 });
    const wealthBefore = state.founder.wealth;

    advanceFounderLifecycle(state, { daysElapsed: 30 });

    expect(state.founder.wealth).toBeLessThan(wealthBefore);
  });

  it("personal happiness affects health loss", () => {
    const happy = createInitialGameState({ seed: 1 });
    const unhappy = createInitialGameState({ seed: 1 });
    getMarried(happy, { spouseName: "Alice" });
    haveChild(happy, { childName: "Tom" });

    happy.company.culturePressure = 8;
    unhappy.company.culturePressure = 8;
    happy.company.morale = 3;
    unhappy.company.morale = 3;

    advanceFounderLifecycle(happy, { daysElapsed: 30 });
    advanceFounderLifecycle(unhappy, { daysElapsed: 30 });

    expect(happy.founder.health).toBeGreaterThan(unhappy.founder.health);
  });
});
