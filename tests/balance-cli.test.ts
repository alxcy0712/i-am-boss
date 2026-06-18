import { createBalanceCliReport } from "../src/harness/balance";

describe("createBalanceCliReport", () => {
  it("returns a final balance report by default", () => {
    const report = createBalanceCliReport([
      "node",
      "balance.ts",
      "--seedStart",
      "1",
      "--runs",
      "2",
      "--days",
      "30",
      "--maxEventLogEntries",
      "2",
    ]);

    expect(report.runs).toBe(2);
    expect(report.days).toBe(30);
    expect(report.checkpointSummaries).toBeUndefined();
  });

  it("returns checkpoint summaries when requested", () => {
    const report = createBalanceCliReport([
      "node",
      "balance.ts",
      "--seedStart",
      "1",
      "--runs",
      "2",
      "--days",
      "200",
      "--maxEventLogEntries",
      "2",
      "--checkpointIntervalDays",
      "90",
    ]);

    expect(report.checkpointSummaries?.map((checkpoint) => checkpoint.day)).toContain(90);
    expect(report.checkpointSummaries?.map((checkpoint) => checkpoint.day)).toContain(180);
    expect(report.results?.every((result) => result.summary.eventLog.length <= 2)).toBe(true);
  });

  it("returns compact output when summaryOnly is set", () => {
    const report = createBalanceCliReport([
      "node",
      "balance.ts",
      "--seedStart",
      "1",
      "--runs",
      "2",
      "--days",
      "30",
      "--summaryOnly",
    ]);

    expect(report.results).toBeUndefined();
    expect(report.runs).toBe(2);
  });
});
