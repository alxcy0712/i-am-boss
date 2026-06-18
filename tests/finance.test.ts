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

  it("approves loans with lower reputation when resources are high", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.reputation = 3;
    state.company.resources = 8;
    state.company.annualRevenue = 200_000;
    state.company.monthlyBurn = 5_000;

    const result = applyBankLoan(state, { requestedAmount: 50_000 });

    expect(result.approved).toBe(true);
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
});
