import { translateEvent, translateEventEntry } from "../src/web/i18n";
import type { GameEvent } from "../src/sim/types";

describe("web i18n", () => {
  it("localizes insurance and investment event type labels", () => {
    const insuranceEvent: GameEvent = {
      type: "insurance_purchased",
      day: 0,
      category: "finance",
      severity: "positive",
      insuranceType: "comprehensive",
      premium: 2_500,
      coverage: 100_000,
    };
    const investmentEvent: GameEvent = {
      type: "investment_made",
      day: 0,
      category: "finance",
      severity: "info",
      investmentType: "real_estate",
      amount: 20_000,
      expectedReturn: 0.06,
    };

    expect(translateEvent(insuranceEvent, "zh-CN")).toContain("综合保险");
    expect(translateEvent(investmentEvent, "zh-CN")).toContain("房地产");
    expect(translateEvent(insuranceEvent, "en")).toContain("Comprehensive Insurance");
    expect(translateEvent(investmentEvent, "en")).toContain("Real Estate");
  });

  it("localizes legacy insurance and investment event log entries", () => {
    expect(
      translateEventEntry(
        "Insurance purchased: comprehensive, premium 2500, coverage 100000",
        "zh-CN",
      ),
    ).toContain("综合保险");
    expect(
      translateEventEntry("Investment made: real_estate ¥20,000, expected return 6.0%", "zh-CN"),
    ).toContain("房地产");
  });

  it("localizes governance penalty and delisting warning details", () => {
    const penaltyEvent: GameEvent = {
      type: "governance_penalty",
      day: 0,
      category: "market",
      severity: "warning",
      reason: "disclosure_overdue",
      severityLevel: 0.5,
      penalty: 1_000,
    };
    const delistingEvent: GameEvent = {
      type: "delisting_warning",
      day: 0,
      category: "market",
      severity: "critical",
      riskLevel: "critical",
      reasons: [
        "Cash -200000 below threshold 0",
        "Reputation 1.0 below threshold 2",
        "Valuation 10000 below threshold 50000",
      ],
    };

    expect(translateEvent(penaltyEvent, "zh-CN")).toContain("披露逾期");
    expect(translateEvent(delistingEvent, "zh-CN")).toContain("现金 -200000 低于门槛 0");
    expect(translateEvent(delistingEvent, "zh-CN")).toContain("声誉 1.0 低于门槛 2");
    expect(translateEvent(delistingEvent, "zh-CN")).toContain("估值 10000 低于门槛 50000");
  });
});
