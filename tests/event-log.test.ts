import { summarizeGameState } from "../src/harness/sim-harness";
import { createGameEventSummary, recordGameEvent } from "../src/sim/events";
import { applyBankLoan } from "../src/sim/finance";
import { createInitialGameState } from "../src/sim/state";
import type { GameEvent } from "../src/sim/types";

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

  it("keeps event summaries finite when event categories are corrupted", () => {
    const summary = createGameEventSummary([
      {
        type: "initial_choice",
        choiceId: "network-founder",
        choiceLabel: "Network Founder",
        day: 0,
        category: "bad",
        severity: "also-bad",
      } as never as GameEvent,
    ]);

    expect(summary.total).toBe(1);
    expect(Object.keys(summary.byCategory).sort()).toEqual([
      "finance",
      "founder",
      "legal",
      "market",
      "operations",
      "people",
      "society",
    ]);
    expect(Object.keys(summary.bySeverity).sort()).toEqual([
      "critical",
      "info",
      "positive",
      "warning",
    ]);
    expect(Object.values(summary.byCategory).every((value) => Number.isFinite(value))).toBe(true);
    expect(Object.values(summary.bySeverity).every((value) => Number.isFinite(value))).toBe(true);
  });

  it("rejects unknown runtime event payloads without mutating logs", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];

    expect(() => recordGameEvent(state, { type: "bad" } as never)).toThrow(
      "Invalid game event payload: bad",
    );
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
  });

  it("rejects malformed runtime event payloads with a stable error", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];

    expect(() =>
      recordGameEvent(state, {
        type: "investment_made",
        investmentType: "stocks",
        amount: undefined,
        expectedReturn: 0.1,
      } as never),
    ).toThrow("Invalid game event payload: investment_made");
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
  });

  it("rejects non-finite runtime event numbers before formatting logs", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];

    expect(() =>
      recordGameEvent(state, {
        type: "investment_made",
        investmentType: "stocks",
        amount: Number.NaN,
        expectedReturn: Infinity,
      }),
    ).toThrow("Invalid game event payload: investment_made");
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
  });

  it("rejects blank runtime event strings before formatting logs", () => {
    const state = createInitialGameState({ seed: 1, initialChoiceId: "network-founder" });
    const eventCount = state.events.length;
    const eventLog = [...state.eventLog];

    expect(() =>
      recordGameEvent(state, {
        type: "initial_choice",
        choiceId: " ",
        choiceLabel: "Network Founder",
      }),
    ).toThrow("Invalid game event payload: initial_choice");
    expect(state.events).toHaveLength(eventCount);
    expect(state.eventLog).toEqual(eventLog);
  });
});
