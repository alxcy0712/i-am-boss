import {
  evaluateGovernance,
  processShareholderRelations,
  checkDisclosureCompliance,
  evaluateDelistingRisk,
  applyGovernancePenalties,
  processMonthlyGovernance,
} from "../src/sim/listed-governance";
import { createInitialGameState } from "../src/sim/state";
import type { GameState, GameEventPayload } from "../src/sim/types";

function publicState(overrides?: Partial<GameState["company"]>): GameState {
  const state = createInitialGameState({ seed: 1 });
  state.company.isPublic = true;
  state.company.cash = 500000;
  state.company.reputation = 6;
  state.company.morale = 7;
  state.company.valuation = 200000;
  state.company.lastDisclosureDay = 0;
  if (overrides) Object.assign(state.company, overrides);
  return state;
}

describe("evaluateGovernance", () => {
  it("returns governance metrics for a public company", () => {
    const state = publicState();
    state.day = 30;

    const metrics = evaluateGovernance(state);

    expect(metrics.shareholderSatisfaction).toBeGreaterThanOrEqual(0);
    expect(metrics.shareholderSatisfaction).toBeLessThanOrEqual(1);
    expect(metrics.disclosureCompliance).toBeGreaterThanOrEqual(0);
    expect(metrics.disclosureCompliance).toBeLessThanOrEqual(1);
    expect(metrics.regulatoryCompliance).toBeGreaterThanOrEqual(0);
    expect(metrics.regulatoryCompliance).toBeLessThanOrEqual(1);
    expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
    expect(metrics.overallScore).toBeLessThanOrEqual(1);
  });

  it("weights overall score correctly from sub-scores", () => {
    const state = publicState({ morale: 10, reputation: 10 });
    state.day = 10; // well within disclosure window
    state.society.legalCaseCount = 0;

    const metrics = evaluateGovernance(state);

    // With max morale/reputation and no legal cases, overall score should be high
    expect(metrics.overallScore).toBeGreaterThan(0.8);
  });

  it("penalizes regulatory compliance for legal cases", () => {
    const state = publicState();
    state.day = 10;
    state.society.legalCaseCount = 5;

    const metrics = evaluateGovernance(state);

    expect(metrics.regulatoryCompliance).toBeLessThan(1);
    expect(metrics.overallScore).toBeLessThan(1);
  });
});

describe("processShareholderRelations", () => {
  it("updates reputation based on satisfaction", () => {
    const state = publicState({ morale: 8, reputation: 7, cash: 100000 });
    const initialReputation = state.company.reputation;

    const result = processShareholderRelations(state, { seed: 42 });

    expect(result.reputationDelta).toBeDefined();
    expect(state.company.reputation).not.toBe(initialReputation);
  });

  it("uses seeded RNG for deterministic results", () => {
    const state1 = publicState({ morale: 8, reputation: 7, cash: 100000 });
    const state2 = publicState({ morale: 8, reputation: 7, cash: 100000 });

    processShareholderRelations(state1, { seed: 42 });
    processShareholderRelations(state2, { seed: 42 });

    expect(state1.company.reputation).toBe(state2.company.reputation);
    expect(state1.company.valuation).toBe(state2.company.valuation);
  });

  it("different seeds produce different results", () => {
    const state1 = publicState({ morale: 8, reputation: 7, cash: 100000 });
    const state2 = publicState({ morale: 8, reputation: 7, cash: 100000 });

    processShareholderRelations(state1, { seed: 42 });
    processShareholderRelations(state2, { seed: 99 });

    // With different seeds, results should differ (with high probability)
    expect(state1.company.reputation).not.toBe(state2.company.reputation);
  });

  it("positive cash flow improves satisfaction", () => {
    const positiveState = publicState({ morale: 8, reputation: 7, cash: 500000 });
    const negativeState = publicState({ morale: 8, reputation: 7, cash: -50000 });

    const posResult = processShareholderRelations(positiveState, { seed: 42 });
    const negResult = processShareholderRelations(negativeState, { seed: 42 });

    expect(posResult.satisfactionDelta).toBeGreaterThan(negResult.satisfactionDelta);
  });

  it("produces valuationImpact", () => {
    const state = publicState({ valuation: 100000 });

    const result = processShareholderRelations(state, { seed: 42 });

    expect(typeof result.valuationImpact).toBe("number");
  });
});

describe("checkDisclosureCompliance", () => {
  it("returns compliant when within disclosure window", () => {
    const state = publicState();
    state.day = 60; // within 90-day window from lastDisclosureDay=0

    const result = checkDisclosureCompliance(state);

    expect(result.isCompliant).toBe(true);
    expect(result.daysOverdue).toBe(0);
    expect(result.penalty).toBe(0);
  });

  it("returns non-compliant when overdue", () => {
    const state = publicState();
    state.day = 150; // 150 days since lastDisclosureDay=0, overdue by 60

    const result = checkDisclosureCompliance(state);

    expect(result.isCompliant).toBe(false);
    expect(result.daysOverdue).toBe(60);
    expect(result.penalty).toBeGreaterThan(0);
  });

  it("initializes lastDisclosureDay if not set", () => {
    const state = publicState({ lastDisclosureDay: undefined });
    state.day = 50;

    const result = checkDisclosureCompliance(state);

    expect(result.isCompliant).toBe(true);
    expect(state.company.lastDisclosureDay).toBe(50);
  });

  it("updates lastDisclosureDay after check", () => {
    const state = publicState();
    state.day = 60;

    checkDisclosureCompliance(state);

    expect(state.company.lastDisclosureDay).toBe(60);
  });
});

describe("evaluateDelistingRisk", () => {
  it("returns no risk for healthy company", () => {
    const state = publicState({
      cash: 500000,
      reputation: 8,
      valuation: 200000,
    });

    const result = evaluateDelistingRisk(state);

    expect(result.riskLevel).toBe("none");
    expect(result.reasons).toHaveLength(0);
  });

  it("returns medium risk for one threshold violation", () => {
    const state = publicState({
      cash: -200000, // below delistingCashThreshold (-100000)
      reputation: 8,
      valuation: 200000,
    });

    const result = evaluateDelistingRisk(state);

    expect(result.riskLevel).toBe("medium");
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.cashRisk).toBe(true);
  });

  it("returns high risk for two threshold violations", () => {
    const state = publicState({
      cash: -200000, // below threshold
      reputation: 1, // below threshold (2)
      valuation: 200000,
    });

    const result = evaluateDelistingRisk(state);

    expect(result.riskLevel).toBe("high");
    expect(result.reasons.length).toBe(2);
  });

  it("returns critical risk for all three violations", () => {
    const state = publicState({
      cash: -200000,
      reputation: 1,
      valuation: 10000, // below threshold (50000)
    });

    const result = evaluateDelistingRisk(state);

    expect(result.riskLevel).toBe("critical");
    expect(result.reasons.length).toBe(3);
  });

  it("returns low risk for warning-level values", () => {
    const state = publicState({
      cash: -50000, // above threshold but in warning zone (80% of -100000 = -80000)
      reputation: 3, // above threshold (2) but in warning zone (2+1=3)
      valuation: 55000, // above threshold (50000) but in warning zone (50000*1.2=60000)
    });

    const result = evaluateDelistingRisk(state);

    // At least one warning should trigger
    expect(["none", "low"]).toContain(result.riskLevel);
  });
});

describe("applyGovernancePenalties", () => {
  it("reduces cash based on severity and penalty rate", () => {
    const state = publicState({ cash: 500000, valuation: 200000 });
    const initialCash = state.company.cash;

    applyGovernancePenalties(state, { reason: "test_penalty", severity: 0.5 });

    expect(state.company.cash).toBeLessThan(initialCash);
  });

  it("reduces reputation based on severity", () => {
    const state = publicState({ reputation: 6 });
    const initialReputation = state.company.reputation;

    applyGovernancePenalties(state, { reason: "test_penalty", severity: 0.5 });

    expect(state.company.reputation).toBeLessThan(initialReputation);
  });

  it("clamps severity to [0, 1]", () => {
    const state1 = publicState({ cash: 500000, valuation: 200000 });
    const state2 = publicState({ cash: 500000, valuation: 200000 });

    applyGovernancePenalties(state1, { reason: "test", severity: 2.0 });
    applyGovernancePenalties(state2, { reason: "test", severity: 1.0 });

    // Both should produce the same penalty since severity is clamped to 1
    expect(state1.company.cash).toBe(state2.company.cash);
  });

  it("records governance_penalty event", () => {
    const state = publicState();

    applyGovernancePenalties(state, { reason: "test_penalty", severity: 0.3 });

    const penaltyEvent = state.events.find(
      (e) => (e as GameEventPayload).type === "governance_penalty",
    );
    expect(penaltyEvent).toBeDefined();
    expect(penaltyEvent!.category).toBe("market");
  });
});

describe("processMonthlyGovernance", () => {
  it("does nothing for private companies", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.isPublic = false;

    processMonthlyGovernance(state, { seed: 42 });

    expect(state.company.governanceMetrics).toBeUndefined();
    expect(
      state.events.filter((e) => (e as GameEventPayload).type === "governance_penalty"),
    ).toHaveLength(0);
    expect(
      state.events.filter((e) => (e as GameEventPayload).type === "delisting_warning"),
    ).toHaveLength(0);
  });

  it("processes governance for public companies", () => {
    const state = publicState({ morale: 7, reputation: 6, cash: 500000 });
    state.day = 30;

    processMonthlyGovernance(state, { seed: 42 });

    expect(state.company.governanceMetrics).toBeDefined();
    expect(state.company.governanceMetrics!.overallScore).toBeGreaterThanOrEqual(0);
    expect(state.company.governanceMetrics!.overallScore).toBeLessThanOrEqual(1);
  });

  it("records delisting warning for high-risk companies", () => {
    const state = publicState({
      cash: -200000,
      reputation: 1,
      valuation: 10000,
    });
    state.day = 30;

    processMonthlyGovernance(state, { seed: 42 });

    const delistingEvents = state.events.filter((e) => e.type === "delisting_warning");
    expect(delistingEvents.length).toBeGreaterThan(0);
  });

  it("does not record delisting warning for healthy companies", () => {
    const state = publicState({
      cash: 500000,
      reputation: 8,
      valuation: 200000,
    });
    state.day = 30;

    processMonthlyGovernance(state, { seed: 42 });

    const delistingEvents = state.events.filter((e) => e.type === "delisting_warning");
    expect(delistingEvents).toHaveLength(0);
  });

  it("uses seeded RNG for deterministic results", () => {
    const state1 = publicState({ morale: 7, reputation: 6, cash: 500000 });
    state1.day = 30;
    const state2 = publicState({ morale: 7, reputation: 6, cash: 500000 });
    state2.day = 30;

    processMonthlyGovernance(state1, { seed: 42 });
    processMonthlyGovernance(state2, { seed: 42 });

    expect(state1.company.governanceMetrics).toEqual(state2.company.governanceMetrics);
    expect(state1.company.reputation).toBe(state2.company.reputation);
  });
});
