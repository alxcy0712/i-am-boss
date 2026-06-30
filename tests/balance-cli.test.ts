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

  it("rejects invalid numeric flags", () => {
    expect(() => createBalanceCliReport(["node", "balance.ts", "--seedStart", "abc"])).toThrow(
      "Invalid --seedStart: expected a finite number",
    );
    expect(() => createBalanceCliReport(["node", "balance.ts", "--runs", "0"])).toThrow(
      "Invalid --runs: expected a positive number",
    );
    expect(() => createBalanceCliReport(["node", "balance.ts", "--days", "abc"])).toThrow(
      "Invalid --days: expected a finite number",
    );
    expect(() =>
      createBalanceCliReport(["node", "balance.ts", "--maxEventLogEntries", "abc"]),
    ).toThrow("Invalid --maxEventLogEntries: expected a finite number");
    expect(() =>
      createBalanceCliReport(["node", "balance.ts", "--maxEventLogEntries", "-1"]),
    ).toThrow("Invalid --maxEventLogEntries: expected a non-negative integer");
    expect(() =>
      createBalanceCliReport(["node", "balance.ts", "--maxEventLogEntries", "1.5"]),
    ).toThrow("Invalid --maxEventLogEntries: expected a non-negative integer");
    expect(() =>
      createBalanceCliReport(["node", "balance.ts", "--checkpointIntervalDays", "-1"]),
    ).toThrow("Invalid --checkpointIntervalDays: expected a positive number");
    expect(() => createBalanceCliReport(["node", "balance.ts", "--runs"])).toThrow(
      "Invalid --runs: expected a value",
    );
    expect(() =>
      createBalanceCliReport(["node", "balance.ts", "--runs", "--seedStart", "1"]),
    ).toThrow("Invalid --runs: expected a value");
    expect(() => createBalanceCliReport(["node", "balance.ts", "--initialChoiceId"])).toThrow(
      "Invalid --initialChoiceId: expected a value",
    );
    expect(() =>
      createBalanceCliReport(["node", "balance.ts", "--initialChoiceId", "--days", "30"]),
    ).toThrow("Invalid --initialChoiceId: expected a value");
    expect(() => createBalanceCliReport(["node", "balance.ts", "--seedStart", "1.5"])).toThrow(
      "Invalid --seedStart: expected an integer",
    );
    expect(() => createBalanceCliReport(["node", "balance.ts", "--runs", "1.5"])).toThrow(
      "Invalid --runs: expected a positive integer",
    );
    expect(() => createBalanceCliReport(["node", "balance.ts", "--days", "1.5"])).toThrow(
      "Invalid --days: expected a positive integer",
    );
    expect(() =>
      createBalanceCliReport(["node", "balance.ts", "--checkpointIntervalDays", "7.5"]),
    ).toThrow("Invalid --checkpointIntervalDays: expected a positive integer");
  });
});
