import { runFastForward } from "../src/harness/fast-forward";

describe("runFastForward", () => {
  it("keeps deterministic output while capping event log growth", () => {
    const first = runFastForward({
      seed: 5,
      days: 3650,
      initialChoiceId: "technical-founder",
      maxEventLogEntries: 12
    });
    const second = runFastForward({
      seed: 5,
      days: 3650,
      initialChoiceId: "technical-founder",
      maxEventLogEntries: 12
    });

    expect(second.summary).toEqual(first.summary);
    expect(first.summary.eventLog.length).toBeLessThanOrEqual(12);
    expect(first.summary.events.length).toBeLessThanOrEqual(12);
    expect(first.eventLogTruncated).toBe(true);
    expect(first.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
