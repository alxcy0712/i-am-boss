import {
  makeInvestment,
  sellInvestment,
  processInvestmentReturns,
  calculateInvestmentReturn,
  evaluateInvestmentRisk,
  getPortfolioValue,
  getPortfolioSummary,
} from "../src/sim/investment";
import { deserializeGameState, serializeGameState } from "../src/harness/snapshot";
import { createInitialGameState } from "../src/sim/state";

describe("makeInvestment", () => {
  it("creates an investment and deducts cash from the company", () => {
    const state = createInitialGameState({ seed: 1 });
    const cashBefore = state.company.cash;

    const result = makeInvestment(state, { type: "stocks", amount: 30_000 });

    expect(result.success).toBe(true);
    expect(result.investment).toBeDefined();
    expect(result.investment!.type).toBe("stocks");
    expect(result.investment!.amount).toBe(30_000);
    expect(result.investment!.currentValue).toBe(30_000);
    expect(state.company.cash).toBe(cashBefore - 30_000);
    expect(state.company.investments).toHaveLength(1);
  });

  it("rejects investment below minimum amount", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = makeInvestment(state, { type: "bonds", amount: 5_000 });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("below_minimum_investment");
    expect(state.company.investments).toHaveLength(0);
  });

  it("rejects non-finite investment amounts", () => {
    const state = createInitialGameState({ seed: 1 });
    const cashBefore = state.company.cash;

    const nanResult = makeInvestment(state, { type: "stocks", amount: Number.NaN });
    const infinityResult = makeInvestment(state, { type: "stocks", amount: Infinity });

    expect(nanResult).toEqual({ success: false, reason: "invalid_investment_amount" });
    expect(infinityResult).toEqual({ success: false, reason: "invalid_investment_amount" });
    expect(state.company.cash).toBe(cashBefore);
    expect(state.company.investments).toHaveLength(0);
  });

  it("rejects invalid investment types", () => {
    const state = createInitialGameState({ seed: 1 });
    const cashBefore = state.company.cash;

    const result = makeInvestment(state, { type: "invalid" as never, amount: 20_000 });

    expect(result).toEqual({ success: false, reason: "invalid_investment_type" });
    expect(state.company.cash).toBe(cashBefore);
    expect(state.company.investments).toHaveLength(0);
  });

  it("caps investment at max portfolio percentage of cash", () => {
    const state = createInitialGameState({ seed: 1 });
    const maxAllowed = state.company.cash * 0.3;

    const result = makeInvestment(state, { type: "stocks", amount: state.company.cash });

    expect(result.success).toBe(true);
    expect(result.investment!.amount).toBe(Math.round(maxAllowed));
  });

  it("rejects when cash is insufficient even for minimum", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.cash = 5_000;

    const result = makeInvestment(state, { type: "bonds", amount: 10_000 });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("insufficient_cash");
  });

  it("records investment game event", () => {
    const state = createInitialGameState({ seed: 1 });

    makeInvestment(state, { type: "real_estate", amount: 20_000 });

    const event = state.events.find((e) => e.type === "investment_made");
    expect(event).toBeDefined();
    expect(event!.category).toBe("finance");
    expect(event!.severity).toBe("positive");
  });

  it("allows multiple investments", () => {
    const state = createInitialGameState({ seed: 1 });

    makeInvestment(state, { type: "stocks", amount: 20_000 });
    makeInvestment(state, { type: "bonds", amount: 15_000 });

    expect(state.company.investments).toHaveLength(2);
    expect(state.company.investments[0].type).toBe("stocks");
    expect(state.company.investments[1].type).toBe("bonds");
  });

  it("sets expected return based on type and market sentiment", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = makeInvestment(state, { type: "stocks", amount: 20_000 });

    expect(result.investment!.expectedReturn).toBeGreaterThan(0);
    expect(result.investment!.riskLevel).toBeGreaterThan(0);
  });
});

describe("sellInvestment", () => {
  it("sells an investment and adds proceeds to cash", () => {
    const state = createInitialGameState({ seed: 1 });
    const investResult = makeInvestment(state, { type: "stocks", amount: 20_000 });
    const investment = investResult.investment!;
    const cashAfterInvest = state.company.cash;

    const result = sellInvestment(state, { investmentId: investment.id });

    expect(result.success).toBe(true);
    expect(result.saleAmount).toBe(Math.round(investment.currentValue));
    expect(state.company.cash).toBe(cashAfterInvest + result.saleAmount!);
    expect(state.company.investments).toHaveLength(0);
  });

  it("returns gain or loss on sale", () => {
    const state = createInitialGameState({ seed: 1 });
    const investResult = makeInvestment(state, { type: "bonds", amount: 20_000 });
    investResult.investment!.currentValue = 22_000;

    const result = sellInvestment(state, { investmentId: investResult.investment!.id });

    expect(result.success).toBe(true);
    expect(result.gain).toBe(2_000);
  });

  it("rejects sale of non-existent investment", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = sellInvestment(state, { investmentId: "non-existent" });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("investment_not_found");
  });

  it("sells corrupted investments without polluting cash", () => {
    const state = createInitialGameState({ seed: 1 });
    const investResult = makeInvestment(state, { type: "stocks", amount: 20_000 });
    const investment = investResult.investment!;
    investment.currentValue = Number.NaN;
    investment.amount = Infinity;
    const cashBeforeSale = state.company.cash;

    const result = sellInvestment(state, { investmentId: investment.id });

    expect(result).toMatchObject({
      success: true,
      saleAmount: 0,
      gain: 0,
    });
    expect(state.company.cash).toBe(cashBeforeSale);
    expect(state.company.investments).toHaveLength(0);
  });

  it("removes investments with corrupted types without recording invalid events", () => {
    const state = createInitialGameState({ seed: 1 });
    const investResult = makeInvestment(state, { type: "stocks", amount: 20_000 });
    const investment = investResult.investment!;
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];
    investment.type = "invalid" as never;

    const result = sellInvestment(state, { investmentId: investment.id });

    expect(result).toMatchObject({
      success: true,
      saleAmount: 20_000,
      gain: 0,
    });
    expect(state.company.investments).toHaveLength(0);
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
    expect(() => deserializeGameState(serializeGameState(state))).not.toThrow();
  });

  it("records investment sold game event", () => {
    const state = createInitialGameState({ seed: 1 });
    const investResult = makeInvestment(state, { type: "stocks", amount: 20_000 });

    sellInvestment(state, { investmentId: investResult.investment!.id });

    const event = state.events.find((e) => e.type === "investment_sold");
    expect(event).toBeDefined();
    expect(event!.category).toBe("finance");
  });
});

describe("processInvestmentReturns", () => {
  it("updates investment values based on market conditions", () => {
    const state = createInitialGameState({ seed: 1 });
    state.day = 30;
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    const initialValue = state.company.investments[0].currentValue;

    processInvestmentReturns(state, { seed: 42 });

    expect(state.company.investments[0].currentValue).not.toBe(initialValue);
  });

  it("returns zero for empty portfolio", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = processInvestmentReturns(state, { seed: 42 });

    expect(result.totalGain).toBe(0);
    expect(result.investmentsProcessed).toBe(0);
  });

  it("produces deterministic results for the same seed", () => {
    const state1 = createInitialGameState({ seed: 1 });
    state1.day = 30;
    makeInvestment(state1, { type: "stocks", amount: 20_000 });

    const state2 = createInitialGameState({ seed: 1 });
    state2.day = 30;
    makeInvestment(state2, { type: "stocks", amount: 20_000 });

    processInvestmentReturns(state1, { seed: 42 });
    processInvestmentReturns(state2, { seed: 42 });

    expect(state1.company.investments[0].currentValue).toBe(
      state2.company.investments[0].currentValue,
    );
  });

  it("never allows investment value to go below zero", () => {
    const state = createInitialGameState({ seed: 1 });
    state.day = 30;
    state.marketSentiment = 0.3;
    makeInvestment(state, { type: "crypto", amount: 10_000 });

    for (let i = 0; i < 100; i++) {
      state.day += 30;
      processInvestmentReturns(state, { seed: i });
    }

    expect(state.company.investments[0].currentValue).toBeGreaterThanOrEqual(0);
  });

  it("processes multiple investments independently", () => {
    const state = createInitialGameState({ seed: 1 });
    state.day = 30;
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    makeInvestment(state, { type: "bonds", amount: 15_000 });

    const result = processInvestmentReturns(state, { seed: 42 });

    expect(result.investmentsProcessed).toBe(2);
  });

  it("keeps corrupted investment returns finite", () => {
    const state = createInitialGameState({ seed: 1 });
    state.day = 30;
    state.marketSentiment = Number.NaN;
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    state.company.investments[0].currentValue = Number.NaN;

    const result = processInvestmentReturns(state, { seed: 42 });

    expect(Number.isFinite(result.totalGain)).toBe(true);
    expect(result.totalGain).toBe(0);
    expect(Number.isFinite(state.company.investments[0].currentValue)).toBe(true);
  });

  it("skips investments with invalid types without polluting returns", () => {
    const state = createInitialGameState({ seed: 1 });
    state.day = 30;
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    state.company.investments[0].type = "invalid" as never;

    const result = processInvestmentReturns(state, { seed: 42 });

    expect(result.totalGain).toBe(0);
    expect(result.investmentsProcessed).toBe(0);
    expect(Number.isFinite(state.company.investments[0].currentValue)).toBe(true);
  });

  it("higher market sentiment tends to produce better returns", () => {
    const state1 = createInitialGameState({ seed: 1 });
    state1.day = 30;
    state1.marketSentiment = 1.5;
    makeInvestment(state1, { type: "stocks", amount: 50_000 });

    const state2 = createInitialGameState({ seed: 1 });
    state2.day = 30;
    state2.marketSentiment = 0.5;
    makeInvestment(state2, { type: "stocks", amount: 50_000 });

    const gain1 = processInvestmentReturns(state1, { seed: 42 }).totalGain;
    const gain2 = processInvestmentReturns(state2, { seed: 42 }).totalGain;

    expect(gain1).toBeGreaterThan(gain2);
  });
});

describe("calculateInvestmentReturn", () => {
  it("returns higher expected return for stocks than bonds", () => {
    const stocksReturn = calculateInvestmentReturn({
      type: "stocks",
      marketSentiment: 1,
      riskLevel: 0.6,
    });
    const bondsReturn = calculateInvestmentReturn({
      type: "bonds",
      marketSentiment: 1,
      riskLevel: 0.2,
    });

    expect(stocksReturn).toBeGreaterThan(bondsReturn);
  });

  it("increases expected return with higher market sentiment", () => {
    const lowSentiment = calculateInvestmentReturn({
      type: "stocks",
      marketSentiment: 0.5,
      riskLevel: 0.6,
    });
    const highSentiment = calculateInvestmentReturn({
      type: "stocks",
      marketSentiment: 1.5,
      riskLevel: 0.6,
    });

    expect(highSentiment).toBeGreaterThan(lowSentiment);
  });

  it("returns the base rate at neutral market sentiment", () => {
    const result = calculateInvestmentReturn({
      type: "bonds",
      marketSentiment: 1,
      riskLevel: 0.2,
    });

    expect(result).toBeCloseTo(0.04);
  });

  it("returns a finite expected return for non-finite market sentiment", () => {
    const result = calculateInvestmentReturn({
      type: "stocks",
      marketSentiment: Number.NaN,
      riskLevel: 0.6,
    });

    expect(Number.isFinite(result)).toBe(true);
  });
});

describe("evaluateInvestmentRisk", () => {
  it("returns low risk for bonds", () => {
    const risk = evaluateInvestmentRisk({ type: "bonds", marketSentiment: 1 });

    expect(risk.riskCategory).toBe("low");
    expect(risk.riskLevel).toBeLessThan(0.3);
    expect(risk.volatility).toBe(0.05);
  });

  it("returns very high risk for crypto", () => {
    const risk = evaluateInvestmentRisk({ type: "crypto", marketSentiment: 1 });

    expect(risk.riskCategory).toBe("very_high");
    expect(risk.riskLevel).toBeGreaterThanOrEqual(0.75);
    expect(risk.volatility).toBe(0.4);
  });

  it("increases risk in low market sentiment", () => {
    const normalRisk = evaluateInvestmentRisk({ type: "stocks", marketSentiment: 1 });
    const lowRisk = evaluateInvestmentRisk({ type: "stocks", marketSentiment: 0.5 });

    expect(lowRisk.riskLevel).toBeGreaterThan(normalRisk.riskLevel);
  });

  it("categorizes stocks as high risk", () => {
    const risk = evaluateInvestmentRisk({ type: "stocks", marketSentiment: 1 });

    expect(risk.riskCategory).toBe("high");
  });
});

describe("getPortfolioValue", () => {
  it("returns zero for empty portfolio", () => {
    const state = createInitialGameState({ seed: 1 });

    expect(getPortfolioValue(state)).toBe(0);
  });

  it("sums current values of all investments", () => {
    const state = createInitialGameState({ seed: 1 });
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    makeInvestment(state, { type: "bonds", amount: 15_000 });

    expect(getPortfolioValue(state)).toBe(35_000);
  });

  it("returns finite value for corrupted investments", () => {
    const state = createInitialGameState({ seed: 1 });
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    state.company.investments[0].currentValue = Number.NaN;

    expect(getPortfolioValue(state)).toBe(0);
  });

  it("skips investments with invalid types in portfolio value", () => {
    const state = createInitialGameState({ seed: 1 });
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    state.company.investments[0].type = "invalid" as never;

    expect(getPortfolioValue(state)).toBe(0);
  });
});

describe("getPortfolioSummary", () => {
  it("breaks down investments by type", () => {
    const state = createInitialGameState({ seed: 1 });
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    makeInvestment(state, { type: "stocks", amount: 10_000 });
    makeInvestment(state, { type: "bonds", amount: 15_000 });

    const summary = getPortfolioSummary(state);

    expect(summary.byType.stocks.count).toBe(2);
    expect(summary.byType.stocks.value).toBe(30_000);
    expect(summary.byType.bonds.count).toBe(1);
    expect(summary.byType.bonds.value).toBe(15_000);
    expect(summary.totalValue).toBe(45_000);
    expect(summary.totalInvested).toBe(45_000);
    expect(summary.totalGain).toBe(0);
  });

  it("tracks gains after returns are processed", () => {
    const state = createInitialGameState({ seed: 1 });
    state.day = 30;
    makeInvestment(state, { type: "stocks", amount: 50_000 });
    processInvestmentReturns(state, { seed: 42 });

    const summary = getPortfolioSummary(state);

    expect(summary.totalValue).not.toBe(summary.totalInvested);
  });

  it("keeps portfolio summary finite for corrupted investments", () => {
    const state = createInitialGameState({ seed: 1 });
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    state.company.investments[0].amount = Infinity;
    state.company.investments[0].currentValue = Number.NaN;

    const summary = getPortfolioSummary(state);

    expect(Number.isFinite(summary.totalValue)).toBe(true);
    expect(Number.isFinite(summary.totalInvested)).toBe(true);
    expect(Number.isFinite(summary.totalGain)).toBe(true);
    expect(Number.isFinite(summary.byType.stocks.value)).toBe(true);
  });

  it("skips investments with invalid types in portfolio summary", () => {
    const state = createInitialGameState({ seed: 1 });
    makeInvestment(state, { type: "stocks", amount: 20_000 });
    state.company.investments[0].type = "invalid" as never;

    const summary = getPortfolioSummary(state);

    expect(summary.totalValue).toBe(0);
    expect(summary.totalInvested).toBe(0);
    expect(summary.totalGain).toBe(0);
    expect(summary.byType.stocks.count).toBe(0);
  });
});
