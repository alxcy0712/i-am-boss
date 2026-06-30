import { applyBankLoan, prepareIpo } from "../src/sim/finance";
import { createInitialGameState } from "../src/sim/state";

describe("applyBankLoan", () => {
  it("adds cash and debt based on reputation and cash flow", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    const previousCash = state.company.cash;

    const result = applyBankLoan(state, { requestedAmount: 80_000 });

    expect(result.approved).toBe(true);
    expect(state.company.cash).toBeGreaterThan(previousCash);
    expect(state.company.debt).toBe(80_000);
  });

  it("rejects non-positive loan amounts", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    const previousCash = state.company.cash;

    const result = applyBankLoan(state, { requestedAmount: -50_000 });

    expect(result).toEqual({ approved: false, reason: "invalid_loan_amount" });
    expect(state.company.cash).toBe(previousCash);
    expect(state.company.debt).toBe(0);
  });

  it("rejects non-finite loan amounts", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    const previousCash = state.company.cash;

    const nanResult = applyBankLoan(state, { requestedAmount: Number.NaN });
    const infinityResult = applyBankLoan(state, { requestedAmount: Infinity });

    expect(nanResult).toEqual({ approved: false, reason: "invalid_loan_amount" });
    expect(infinityResult).toEqual({ approved: false, reason: "invalid_loan_amount" });
    expect(state.company.cash).toBe(previousCash);
    expect(state.company.debt).toBe(0);
  });

  it("approves loans with lower reputation when resources are high", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.reputation = 3;
    state.company.resources = 8;
    state.company.annualRevenue = 200_000;
    state.company.monthlyBurn = 5_000;

    const result = applyBankLoan(state, { requestedAmount: 50_000 });

    expect(result.approved).toBe(true);
  });

  it("keeps approved loans finite when cash and debt are corrupted", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    state.company.cash = Number.NaN;
    state.company.debt = Infinity;

    const result = applyBankLoan(state, { requestedAmount: 80_000 });

    expect(result.approved).toBe(true);
    expect(state.company.cash).toBe(80_000);
    expect(state.company.debt).toBe(80_000);
  });

  it("rejects loans when reputation and resources are both low", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.reputation = 2;
    state.company.resources = 2;
    state.company.annualRevenue = 200_000;
    state.company.monthlyBurn = 5_000;

    const result = applyBankLoan(state, { requestedAmount: 50_000 });

    expect(result.approved).toBe(false);
  });

  it("rejects loans when cash-flow inputs are non-finite", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    const previous = {
      cash: state.company.cash,
      debt: state.company.debt,
    };
    state.company.annualRevenue = Infinity;

    const result = applyBankLoan(state, { requestedAmount: 80_000 });

    expect(result).toEqual({ approved: false, reason: "credit_requirements_not_met" });
    expect(state.company.cash).toBe(previous.cash);
    expect(state.company.debt).toBe(previous.debt);
  });
});

describe("prepareIpo", () => {
  it("switches mature companies to listed market valuation", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.annualRevenue = 2_000_000;
    state.company.reputation = 8;
    state.company.headcount = 35;
    state.company.operationalCapability = 7;

    const result = prepareIpo(state, { marketSentiment: 1.1 });

    expect(result.approved).toBe(true);
    expect(state.company.isPublic).toBe(true);
    expect(state.company.listedMarketValue).toBeGreaterThan(0);
  });

  it("rejects repeated IPO preparation after a company is already public", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.annualRevenue = 2_000_000;
    state.company.reputation = 8;
    state.company.headcount = 35;
    state.company.operationalCapability = 7;

    const first = prepareIpo(state, { marketSentiment: 1.1 });
    const listedMarketValue = state.company.listedMarketValue;
    const eventCount = state.events.filter((event) => event.type === "ipo_prepared").length;
    const second = prepareIpo(state, { marketSentiment: 1.1 });

    expect(first.approved).toBe(true);
    expect(second.approved).toBe(false);
    expect(second.reason).toBe("ipo_requirements_not_met");
    expect(state.company.isPublic).toBe(true);
    expect(state.company.listedMarketValue).toBe(listedMarketValue);
    expect(state.events.filter((event) => event.type === "ipo_prepared")).toHaveLength(eventCount);
  });

  it("rejects IPO when operational capability is too low", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.annualRevenue = 2_000_000;
    state.company.reputation = 8;
    state.company.headcount = 35;
    state.company.operationalCapability = 4;

    const result = prepareIpo(state, { marketSentiment: 1.1 });

    expect(result.approved).toBe(false);
    expect(result.reason).toBe("ipo_requirements_not_met");
  });

  it("rejects IPO when market sentiment is non-finite", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.annualRevenue = 2_000_000;
    state.company.reputation = 8;
    state.company.headcount = 35;
    state.company.operationalCapability = 7;

    const result = prepareIpo(state, { marketSentiment: Number.NaN });

    expect(result.approved).toBe(false);
    expect(result.reason).toBe("ipo_requirements_not_met");
    expect(state.company.isPublic).toBe(false);
    expect(state.company.listedMarketValue).toBeUndefined();
  });
});
