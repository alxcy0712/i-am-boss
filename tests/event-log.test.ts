import { summarizeGameState } from "../src/harness/sim-harness";
import { applyBankLoan } from "../src/sim/finance";
import { createInitialGameState } from "../src/sim/state";

describe("structured game events", () => {
  it("records typed events beside compatible log strings", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });

    expect(
      (
        state as {
          events?: Array<{
            type: string;
            day: number;
            choiceId?: string;
            category?: string;
            severity?: string;
          }>;
        }
      ).events?.[0],
    ).toMatchObject({
      type: "initial_choice",
      day: 0,
      choiceId: "network-founder",
      category: "founder",
      severity: "info",
    });
    expect(state.eventLog[0]).toBe("Initial choice: Network Founder");

    applyBankLoan(state, { requestedAmount: 80_000 });

    expect(
      (
        state as {
          events?: Array<{
            type: string;
            day: number;
            amount?: number;
            category?: string;
            severity?: string;
          }>;
        }
      ).events?.at(-1),
    ).toMatchObject({
      type: "bank_loan_approved",
      day: 0,
      amount: 80_000,
      category: "finance",
      severity: "positive",
    });
    expect(state.eventLog.at(-1)).toBe("Bank loan approved: 80000");
  });

  it("includes structured events in harness summaries", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    applyBankLoan(state, { requestedAmount: 80_000 });

    const summary = summarizeGameState(state);

    expect(
      (summary as { events?: Array<{ type: string; amount?: number }> }).events?.at(-1),
    ).toMatchObject({
      type: "bank_loan_approved",
      amount: 80_000,
    });
    expect(
      (
        summary as {
          eventSummary?: {
            total: number;
            byCategory: Record<string, number>;
            bySeverity: Record<string, number>;
          };
        }
      ).eventSummary,
    ).toMatchObject({
      total: 2,
      byCategory: {
        founder: 1,
        finance: 1,
      },
      bySeverity: {
        info: 1,
        positive: 1,
      },
    });
    expect(summary.eventLog.at(-1)).toBe("Bank loan approved: 80000");
  });
});
