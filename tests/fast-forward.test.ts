import { runFastForward } from "../src/harness/fast-forward";

describe("runFastForward", () => {
  it("keeps deterministic output while capping event log growth", () => {
    const first = runFastForward({
      seed: 5,
      days: 3650,
      initialChoiceId: "technical-founder",
      maxEventLogEntries: 12,
    });
    const second = runFastForward({
      seed: 5,
      days: 3650,
      initialChoiceId: "technical-founder",
      maxEventLogEntries: 12,
    });

    expect(second.summary).toEqual(first.summary);
    expect(first.summary.eventLog.length).toBeLessThanOrEqual(12);
    expect(first.summary.events.length).toBeLessThanOrEqual(12);
    expect(first.eventLogTruncated).toBe(true);
    expect(first.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it("allows capping event logs to zero entries", () => {
    const result = runFastForward({
      seed: 5,
      days: 365,
      initialChoiceId: "technical-founder",
      maxEventLogEntries: 0,
    });

    expect(result.summary.eventLog).toHaveLength(0);
    expect(result.summary.events).toHaveLength(0);
    expect(result.eventLogTruncated).toBe(true);
  });

  it("treats invalid event log caps as zero entries", () => {
    const negative = runFastForward({
      seed: 5,
      days: 365,
      initialChoiceId: "technical-founder",
      maxEventLogEntries: -1,
    });
    const nonFinite = runFastForward({
      seed: 5,
      days: 365,
      initialChoiceId: "technical-founder",
      maxEventLogEntries: Number.NaN,
    });

    expect(negative.summary.eventLog).toHaveLength(0);
    expect(nonFinite.summary.eventLog).toHaveLength(0);
  });
});
