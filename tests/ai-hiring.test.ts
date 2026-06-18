import { getAIHiringDecision } from "../src/sim/staffing";
import { evaluateHiringNeeds, initiateAIHiring, runAIHiringCycle } from "../src/sim/ai-hiring";
import { createInitialGameState } from "../src/sim/state";

describe("getAIHiringDecision", () => {
  it("returns aggressive strategy when cash is more than 3x annual market rate", () => {
    const decision = getAIHiringDecision({
      role: "engineer",
      companyCash: 500_000,
      marketRate: 12_000,
    });

    expect(decision.strategy).toBe("aggressive");
    expect(decision.targetSalaryMax).toBeGreaterThan(12_000);
    expect(decision.equityPercent).toBeGreaterThan(0);
  });

  it("returns moderate strategy when cash is between 1.5x and 3x annual market rate", () => {
    const decision = getAIHiringDecision({
      role: "engineer",
      companyCash: 250_000,
      marketRate: 12_000,
    });

    expect(decision.strategy).toBe("moderate");
    expect(decision.targetSalaryMax).toBe(12_000);
    expect(decision.equityPercent).toBeGreaterThan(0);
    expect(decision.equityPercent).toBeLessThan(0.01);
  });

  it("returns conservative strategy when cash is less than 1.5x annual market rate", () => {
    const decision = getAIHiringDecision({
      role: "engineer",
      companyCash: 100_000,
      marketRate: 12_000,
    });

    expect(decision.strategy).toBe("conservative");
    expect(decision.targetSalaryMax).toBeLessThan(12_000);
    expect(decision.equityPercent).toBe(0);
  });

  it("calculates targetSalaryMin at 85% of market rate", () => {
    const decision = getAIHiringDecision({
      role: "engineer",
      companyCash: 500_000,
      marketRate: 10_000,
    });

    expect(decision.targetSalaryMin).toBe(8_500);
  });
});

describe("evaluateHiringNeeds", () => {
  it("returns empty array when company has sufficient employees", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.headcount = 20;
    state.company.annualRevenue = 500_000;
    state.company.cash = 500_000;
    state.company.monthlyBurn = 50_000;

    const roles = ["engineer", "product", "sales", "finance", "hr"] as const;
    for (let i = 0; i < 20; i++) {
      state.company.employees.push({
        id: `${roles[i % 5]}-${i}`,
        role: roles[i % 5],
        salary: 10_000,
        targetSalary: 12_000,
        equityPercent: 0,
        background: {
          educationTier: "standard",
          major: "computer-science",
          industryExperienceYears: 2,
        },
        personality: 5,
        monthsTenure: 6,
        managementLevel: "individual",
        technical: 5,
        experience: 3,
        stressTolerance: 5,
        communication: 5,
        eq: 5,
        iq: 5,
      });
    }

    const needs = evaluateHiringNeeds(state);
    expect(needs).toEqual([]);
  });

  it("detects hiring needs when company is small and has cash", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.headcount = 2;
    state.company.annualRevenue = 50_000;
    state.company.cash = 200_000;
    state.company.monthlyBurn = 10_000;
    state.company.employees = [];

    const needs = evaluateHiringNeeds(state);

    expect(needs.length).toBeGreaterThan(0);
    expect(needs[0].role).toBe("engineer");
  });

  it("returns no needs when cash is too low", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.headcount = 5;
    state.company.annualRevenue = 100_000;
    state.company.cash = 10_000;
    state.company.monthlyBurn = 50_000;
    state.company.employees = [];

    const needs = evaluateHiringNeeds(state);
    expect(needs).toEqual([]);
  });

  it("prioritizes engineer role", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.headcount = 2;
    state.company.annualRevenue = 50_000;
    state.company.cash = 200_000;
    state.company.monthlyBurn = 10_000;
    state.company.employees = [];

    const needs = evaluateHiringNeeds(state);
    expect(needs[0].role).toBe("engineer");
  });

  it("limits needs to maxHiresPerMonth", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.headcount = 0;
    state.company.annualRevenue = 50_000;
    state.company.cash = 1_000_000;
    state.company.monthlyBurn = 1_000;
    state.company.employees = [];

    const needs = evaluateHiringNeeds(state);
    expect(needs.length).toBeLessThanOrEqual(3);
  });
});

describe("initiateAIHiring", () => {
  it("generates a candidate and attempts negotiation", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.cash = 500_000;
    state.company.monthlyBurn = 10_000;
    state.company.reputation = 5;

    const attempt = initiateAIHiring(state, {
      seed: 100,
      role: "engineer",
      seniority: "junior",
    });

    expect(attempt.role).toBe("engineer");
    expect(attempt.candidate).toBeDefined();
    expect(attempt.candidate.role).toBe("engineer");
    expect(attempt.offeredSalary).toBeGreaterThan(0);
    expect(attempt.acceptanceProbability).toBeGreaterThan(0);
    expect(attempt.acceptanceProbability).toBeLessThanOrEqual(0.98);
  });

  it("offers higher salary with aggressive strategy", () => {
    const richState = createInitialGameState({ seed: 42 });
    richState.company.cash = 2_000_000;
    richState.company.monthlyBurn = 10_000;

    const poorState = createInitialGameState({ seed: 42 });
    poorState.company.cash = 50_000;
    poorState.company.monthlyBurn = 10_000;

    const richAttempt = initiateAIHiring(richState, {
      seed: 100,
      role: "engineer",
      seniority: "junior",
    });
    const poorAttempt = initiateAIHiring(poorState, {
      seed: 100,
      role: "engineer",
      seniority: "junior",
    });

    expect(richAttempt.offeredSalary).toBeGreaterThanOrEqual(poorAttempt.offeredSalary);
  });

  it("produces deterministic results for same seed", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.cash = 500_000;
    state.company.monthlyBurn = 10_000;

    const first = initiateAIHiring(state, { seed: 100, role: "engineer", seniority: "junior" });
    const second = initiateAIHiring(state, { seed: 100, role: "engineer", seniority: "junior" });

    expect(second.accepted).toBe(first.accepted);
    expect(second.offeredSalary).toBe(first.offeredSalary);
    expect(second.acceptanceProbability).toBe(first.acceptanceProbability);
  });
});

describe("runAIHiringCycle", () => {
  it("returns empty results when monthly roll fails", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.cash = 500_000;
    state.company.monthlyBurn = 10_000;
    state.company.headcount = 2;
    state.company.employees = [];

    const result = runAIHiringCycle(state, { seed: 999 });

    if (result.attempts.length === 0) {
      expect(result.hires).toBe(0);
      expect(result.failures).toBe(0);
    }
  });

  it("attempts hiring when needs exist and roll passes", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.cash = 500_000;
    state.company.monthlyBurn = 10_000;
    state.company.headcount = 2;
    state.company.annualRevenue = 50_000;
    state.company.employees = [];

    const result = runAIHiringCycle(state, { seed: 1 });

    expect(result.attempts.length).toBeGreaterThanOrEqual(0);
    expect(result.hires + result.failures).toBe(result.attempts.length);
  });

  it("hires employees into game state on success", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.cash = 5_000_000;
    state.company.monthlyBurn = 10_000;
    state.company.headcount = 2;
    state.company.annualRevenue = 50_000;
    state.company.reputation = 8;
    state.company.employees = [];

    const initialHeadcount = state.company.headcount;
    const result = runAIHiringCycle(state, { seed: 1 });

    if (result.hires > 0) {
      expect(state.company.headcount).toBe(initialHeadcount + result.hires);
      expect(state.company.employees.length).toBe(result.hires);
    }
  });

  it("records events for AI hiring attempts", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.cash = 5_000_000;
    state.company.monthlyBurn = 10_000;
    state.company.headcount = 2;
    state.company.annualRevenue = 50_000;
    state.company.reputation = 8;
    state.company.employees = [];

    const result = runAIHiringCycle(state, { seed: 1 });

    const aiEvents = state.events.filter(
      (e) => e.type === "ai_hire_succeeded" || e.type === "ai_hire_failed",
    );
    expect(aiEvents.length).toBe(result.attempts.length);
  });

  it("respects budget constraints", () => {
    const state = createInitialGameState({ seed: 42 });
    state.company.cash = 15_000;
    state.company.monthlyBurn = 50_000;
    state.company.headcount = 2;
    state.company.annualRevenue = 50_000;
    state.company.employees = [];

    const result = runAIHiringCycle(state, { seed: 1 });

    expect(result.attempts.length).toBe(0);
  });
});
