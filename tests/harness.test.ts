import { runHarness, runHarnessTimeline, summarizeGameState } from "../src/harness/sim-harness";
import { calculateFinalScore } from "../src/sim/scoring";
import { hireEmployee } from "../src/sim/employee-lifecycle";
import { purchaseInsurance } from "../src/sim/insurance";
import { makeInvestment } from "../src/sim/investment";
import { calculateResignationRisk } from "../src/sim/resignation";
import { createInitialGameState } from "../src/sim/state";

describe("runHarness", () => {
  it("returns deterministic summaries for the same seed and day count", () => {
    const first = runHarness({ seed: 42, days: 365, initialChoiceId: "technical-founder" });
    const second = runHarness({ seed: 42, days: 365, initialChoiceId: "technical-founder" });

    expect(second).toEqual(first);
    expect(first.daysPlayed).toBeGreaterThan(0);
    expect(first.companyValuation).toBeGreaterThan(0);
    expect(first.score).toBeCloseTo(calculateFinalScore(first));
    expect(first.headcount).toBeGreaterThanOrEqual(1);
    expect(first.debt).toBeGreaterThanOrEqual(0);
    expect(first.employeeCount).toBeGreaterThanOrEqual(0);
    expect(first.companyReputation).toBeGreaterThanOrEqual(0);
    expect(first.companyMorale).toBeGreaterThanOrEqual(0);
    expect(first.companyCulture).toBeTruthy();
    expect(first.culturePressure).toBeGreaterThanOrEqual(0);
    expect(first.cyclePhase).toBeTruthy();
    expect(first.founderAbilities).toMatchObject({
      technical: 7,
      experience: 1,
      stressTolerance: 5,
      communication: 5,
      eq: 5,
      iq: 6,
    });
    expect(first.founderAge).toBeGreaterThanOrEqual(25);
    expect(first.founderHealth).toBeGreaterThanOrEqual(0);
    expect(first.unemploymentRate).toBeGreaterThanOrEqual(0);
    expect(first.legalCaseCount).toBeGreaterThanOrEqual(0);
    expect(first.policySupportCount).toBeGreaterThanOrEqual(0);
    expect(first.specialEventCount).toBeGreaterThanOrEqual(0);
    expect(first.eventLog.length).toBeGreaterThan(0);
    expect(first.aiHiringEnabled).toBe(false);
    expect(first.aiHires).toBe(0);
    expect(first.aiHiringFailures).toBe(0);
  });

  it("surfaces seeded special events in long simulations", () => {
    const summary = runHarness({ seed: 2, days: 3650, initialChoiceId: "resilient-founder" });

    expect(summary.specialEventCount).toBeGreaterThan(0);
    expect(summary.eventLog.some((entry) => entry.startsWith("Special event:"))).toBe(true);
  });

  it("surfaces public market valuation state for listed companies", () => {
    const state = createInitialGameState({ seed: 3, initialChoiceId: "network-founder" });
    state.company.isPublic = true;
    state.company.listedMarketValue = 650_000;
    state.company.valuation = 650_000;

    const summary = summarizeGameState(state);

    expect(summary.isPublic).toBe(true);
    expect(summary.valuationKind).toBe("listed_market");
    expect(summary.listedMarketValue).toBe(650_000);
  });

  it("summarizes staff role mix and payroll after hiring employees", () => {
    const state = createInitialGameState({ seed: 4, initialChoiceId: "network-founder" });

    hireEmployee(state, {
      salary: 12_000,
      equityPercent: 0.2,
      candidate: {
        role: "engineer",
        targetSalary: 12_000,
        minimumSalary: 10_000,
        technical: 7,
        experienceYears: 3,
        stressTolerance: 6,
        communication: 5,
        eq: 5,
        iq: 7,
        background: {
          educationTier: "strong",
          major: "computer-science",
          industryExperienceYears: 2,
        },
        personality: 5,
      },
    });
    hireEmployee(state, {
      salary: 9_000,
      equityPercent: 0.1,
      candidate: {
        role: "sales",
        targetSalary: 9_000,
        minimumSalary: 8_000,
        technical: 4,
        experienceYears: 2,
        stressTolerance: 5,
        communication: 7,
        eq: 7,
        iq: 5,
        background: {
          educationTier: "standard",
          major: "business",
          industryExperienceYears: 1,
        },
        personality: 5,
      },
    });

    const summary = summarizeGameState(state);
    const expectedRisk = calculateResignationRisk({
      salary: 12_000,
      targetSalary: 12_000,
      stressTolerance: 6,
      culturePressure: state.company.culturePressure,
      morale: state.company.morale,
      culture: state.company.culture,
      personality: 5,
    });

    expect(summary.staffRoleCounts).toEqual({
      engineer: 1,
      product: 0,
      sales: 1,
      finance: 0,
      hr: 0,
    });
    expect(summary.totalMonthlyPayroll).toBe(21_000);
    expect(summary.averageEmployeeSalary).toBe(10_500);
    expect(summary.employees[0].resignationRisk).toBe(expectedRisk);
  });

  it("records deterministic lightweight timeline checkpoints", () => {
    const input = {
      seed: 7,
      days: 200,
      initialChoiceId: "technical-founder",
      checkpointIntervalDays: 90,
    };
    const timeline = runHarnessTimeline(input);
    const repeat = runHarnessTimeline(input);
    const finalSummary = runHarness(input);

    expect(timeline).toEqual(repeat);
    expect(timeline.summary).toEqual(finalSummary);
    expect(timeline.checkpoints.map((checkpoint) => checkpoint.day)).toEqual([90, 180, 200]);
    expect(timeline.checkpoints[0]).toMatchObject({
      day: 90,
      valuationKind: "private_estimate",
      isPublic: false,
    });
    expect(timeline.checkpoints[0].cash).toBeGreaterThanOrEqual(0);
    expect(timeline.checkpoints[0].companyValuation).toBeGreaterThan(0);
    expect(timeline.checkpoints[0].score).toBeGreaterThan(0);
  });

  it("includes AI hiring stats when aiHiringEnabled is true", () => {
    const summary = runHarness({
      seed: 42,
      days: 365,
      initialChoiceId: "technical-founder",
      aiHiringEnabled: true,
    });

    expect(summary.aiHiringEnabled).toBe(true);
    expect(summary.aiHires).toBeGreaterThanOrEqual(0);
    expect(summary.aiHiringFailures).toBeGreaterThanOrEqual(0);
  });

  it("produces deterministic results with AI hiring enabled", () => {
    const input = {
      seed: 42,
      days: 365,
      initialChoiceId: "technical-founder",
      aiHiringEnabled: true,
    };
    const first = runHarness(input);
    const second = runHarness(input);

    expect(second).toEqual(first);
  });

  it("may hire more employees with AI hiring enabled", () => {
    const withoutAI = runHarness({
      seed: 42,
      days: 365,
      initialChoiceId: "technical-founder",
      aiHiringEnabled: false,
    });
    const withAI = runHarness({
      seed: 42,
      days: 365,
      initialChoiceId: "technical-founder",
      aiHiringEnabled: true,
    });

    expect(withAI.aiHiringEnabled).toBe(true);
    expect(withoutAI.aiHiringEnabled).toBe(false);
  });

  it("defaults to zero active insurance policies", () => {
    const summary = runHarness({ seed: 42, days: 365, initialChoiceId: "technical-founder" });

    expect(summary.activeInsurancePolicies).toBe(0);
    expect(summary.totalMonthlyInsurancePremiums).toBe(0);
    expect(summary.investmentCount).toBe(0);
    expect(summary.portfolioValue).toBe(0);
    expect(summary.totalInvested).toBe(0);
    expect(summary.investmentGain).toBe(0);
  });

  it("tracks insurance premiums in summary when policies are active", () => {
    const state = createInitialGameState({ seed: 5, initialChoiceId: "network-founder" });
    purchaseInsurance(state, { type: "legal" });

    const summary = summarizeGameState(state);

    expect(summary.activeInsurancePolicies).toBe(1);
    expect(summary.totalMonthlyInsurancePremiums).toBeGreaterThan(0);
  });

  it("tracks investment stats in summary when investments exist", () => {
    const state = createInitialGameState({ seed: 5, initialChoiceId: "network-founder" });
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    makeInvestment(state, { type: "bonds", amount: 15_000 });

    const summary = summarizeGameState(state);

    expect(summary.investmentCount).toBe(2);
    expect(summary.portfolioValue).toBe(35_000);
    expect(summary.totalInvested).toBe(35_000);
    expect(summary.investmentGain).toBe(0);
  });

  it("includes investment fields in timeline checkpoints", () => {
    const state = createInitialGameState({ seed: 6, initialChoiceId: "network-founder" });
    makeInvestment(state, { type: "stocks", amount: 20_000 });

    const summary = summarizeGameState(state);

    expect(summary.investmentCount).toBe(1);
    expect(summary.portfolioValue).toBeGreaterThan(0);
  });
});
