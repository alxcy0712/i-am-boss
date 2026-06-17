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
});

describe("prepareIpo", () => {
  it("switches mature companies to listed market valuation", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.annualRevenue = 2_000_000;
    state.company.reputation = 8;
    state.company.headcount = 35;

    const result = prepareIpo(state, { marketSentiment: 1.1 });

    expect(result.approved).toBe(true);
    expect(state.company.isPublic).toBe(true);
    expect(state.company.listedMarketValue).toBeGreaterThan(0);
  });
});
