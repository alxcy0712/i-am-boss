import {
  purchaseInsurance,
  processInsuranceClaim,
  calculateInsurancePremium,
  evaluateRiskProfile,
} from "../src/sim/insurance";
import { createInitialGameState } from "../src/sim/state";

describe("purchaseInsurance", () => {
  it("purchases a legal insurance policy and deducts premium from cash", () => {
    const state = createInitialGameState({ seed: 1 });
    const previousCash = state.company.cash;

    const result = purchaseInsurance(state, { type: "legal" });

    expect(result.purchased).toBe(true);
    expect(result.policy).toBeDefined();
    expect(result.policy!.type).toBe("legal");
    expect(result.policy!.active).toBe(true);
    expect(result.policy!.premium).toBeGreaterThan(0);
    expect(result.policy!.coverage).toBeGreaterThan(0);
    expect(result.policy!.deductible).toBeGreaterThan(0);
    expect(state.company.cash).toBeLessThan(previousCash);
    expect(state.company.insurancePolicies).toHaveLength(1);
  });

  it("policies have deductible proportional to coverage", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = purchaseInsurance(state, { type: "operational" });

    expect(result.purchased).toBe(true);
    const policy = result.policy!;
    expect(policy.deductible).toBe(Math.round(policy.coverage * 0.1));
  });

  it("rejects purchase when cash is insufficient", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.cash = 0;

    const result = purchaseInsurance(state, { type: "comprehensive" });

    expect(result.purchased).toBe(false);
    expect(result.reason).toBe("insufficient_cash");
    expect(state.company.insurancePolicies).toHaveLength(0);
  });

  it("rejects duplicate active policy of the same type", () => {
    const state = createInitialGameState({ seed: 1 });

    purchaseInsurance(state, { type: "market" });
    const second = purchaseInsurance(state, { type: "market" });

    expect(second.purchased).toBe(false);
    expect(second.reason).toBe("policy_already_active");
    expect(state.company.insurancePolicies).toHaveLength(1);
  });

  it("allows purchasing a different insurance type", () => {
    const state = createInitialGameState({ seed: 1 });

    purchaseInsurance(state, { type: "legal" });
    const second = purchaseInsurance(state, { type: "market" });

    expect(second.purchased).toBe(true);
    expect(state.company.insurancePolicies).toHaveLength(2);
  });

  it("records insurance purchase game event", () => {
    const state = createInitialGameState({ seed: 1 });

    purchaseInsurance(state, { type: "legal" });

    const insuranceEvent = state.events.find((e) => e.type === "insurance_purchased");
    expect(insuranceEvent).toBeDefined();
    expect(insuranceEvent!.category).toBe("finance");
    expect(insuranceEvent!.severity).toBe("positive");
  });

  it("comprehensive insurance costs more than single-risk policies", () => {
    const state = createInitialGameState({ seed: 1 });

    const comprehensive = calculateInsurancePremium({
      type: "comprehensive",
      companySize: state.company.headcount,
      riskScore: 3,
    });
    const legal = calculateInsurancePremium({
      type: "legal",
      companySize: state.company.headcount,
      riskScore: 3,
    });

    expect(comprehensive).toBeGreaterThan(legal);
  });
});

describe("processInsuranceClaim", () => {
  it("pays out when damage exceeds deductible", () => {
    const state = createInitialGameState({ seed: 1 });
    const purchase = purchaseInsurance(state, { type: "legal" });
    const policy = purchase.policy!;
    const smallDamage = policy.deductible + 100;
    const previousCash = state.company.cash;
    const maxPayout = Math.round(policy.coverage * 0.8);
    const expectedPayout = Math.min(smallDamage - policy.deductible, maxPayout);

    const result = processInsuranceClaim(state, {
      policyId: policy.id,
      damageAmount: smallDamage,
    });

    expect(result.approved).toBe(true);
    expect(result.payout).toBe(expectedPayout);
    expect(state.company.cash).toBe(previousCash + result.payout);
  });

  it("caps payout at maxPayoutRate of coverage", () => {
    const state = createInitialGameState({ seed: 1 });
    const purchase = purchaseInsurance(state, { type: "operational" });
    const policy = purchase.policy!;
    const veryLargeDamage = policy.coverage * 2;

    const result = processInsuranceClaim(state, {
      policyId: policy.id,
      damageAmount: veryLargeDamage,
    });

    expect(result.approved).toBe(true);
    const maxPayout = Math.round(policy.coverage * 0.8);
    expect(result.payout).toBe(maxPayout);
  });

  it("rejects claim when damage is below deductible", () => {
    const state = createInitialGameState({ seed: 1 });
    const purchase = purchaseInsurance(state, { type: "market" });
    const policy = purchase.policy!;

    const result = processInsuranceClaim(state, {
      policyId: policy.id,
      damageAmount: policy.deductible - 1,
    });

    expect(result.approved).toBe(false);
    expect(result.payout).toBe(0);
    expect(result.reason).toBe("damage_below_deductible");
  });

  it("rejects claim for non-existent policy", () => {
    const state = createInitialGameState({ seed: 1 });

    const result = processInsuranceClaim(state, {
      policyId: "non-existent",
      damageAmount: 50_000,
    });

    expect(result.approved).toBe(false);
    expect(result.reason).toBe("policy_not_found");
  });

  it("records insurance claim game event", () => {
    const state = createInitialGameState({ seed: 1 });
    const purchase = purchaseInsurance(state, { type: "legal" });
    const policy = purchase.policy!;

    processInsuranceClaim(state, {
      policyId: policy.id,
      damageAmount: policy.deductible + 5_000,
    });

    const claimEvent = state.events.find((e) => e.type === "insurance_claim_paid");
    expect(claimEvent).toBeDefined();
    expect(claimEvent!.category).toBe("finance");
    expect(claimEvent!.severity).toBe("warning");
  });
});

describe("calculateInsurancePremium", () => {
  it("increases premium with company size", () => {
    const smallCompany = calculateInsurancePremium({
      type: "legal",
      companySize: 5,
      riskScore: 3,
    });
    const largeCompany = calculateInsurancePremium({
      type: "legal",
      companySize: 50,
      riskScore: 3,
    });

    expect(largeCompany).toBeGreaterThan(smallCompany);
  });

  it("increases premium with risk score", () => {
    const lowRisk = calculateInsurancePremium({
      type: "legal",
      companySize: 10,
      riskScore: 1,
    });
    const highRisk = calculateInsurancePremium({
      type: "legal",
      companySize: 10,
      riskScore: 8,
    });

    expect(highRisk).toBeGreaterThan(lowRisk);
  });

  it("returns a positive premium for any valid input", () => {
    const premium = calculateInsurancePremium({
      type: "comprehensive",
      companySize: 1,
      riskScore: 0,
    });

    expect(premium).toBeGreaterThan(0);
  });
});

describe("evaluateRiskProfile", () => {
  it("returns higher legal risk with more legal cases", () => {
    const state = createInitialGameState({ seed: 1 });
    state.society.legalCaseCount = 5;

    const profile = evaluateRiskProfile(state);

    expect(profile.factors.legalRisk).toBe(10);
    expect(profile.riskScore).toBeGreaterThan(3);
  });

  it("returns higher operational risk with lower capability", () => {
    const state = createInitialGameState({ seed: 1 });
    state.company.operationalCapability = 2;

    const profile = evaluateRiskProfile(state);

    expect(profile.factors.operationalRisk).toBe(8);
  });

  it("returns low risk for a healthy company", () => {
    const state = createInitialGameState({ seed: 1 });
    state.society.legalCaseCount = 0;
    state.company.operationalCapability = 9;
    state.marketSentiment = 1.2;

    const profile = evaluateRiskProfile(state);

    expect(profile.riskScore).toBeLessThan(3);
    expect(profile.recommendations).toHaveLength(0);
  });

  it("includes recommendations for high-risk factors", () => {
    const state = createInitialGameState({ seed: 1 });
    state.society.legalCaseCount = 4;
    state.company.operationalCapability = 2;
    state.marketSentiment = 0.5;

    const profile = evaluateRiskProfile(state);

    expect(profile.recommendations.length).toBeGreaterThan(0);
    expect(profile.recommendations.some((r) => r.includes("legal"))).toBe(true);
    expect(profile.recommendations.some((r) => r.includes("operational"))).toBe(true);
  });
});
