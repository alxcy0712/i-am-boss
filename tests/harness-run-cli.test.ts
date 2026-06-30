import { createHarnessCliReport } from "../src/harness/run";

describe("createHarnessCliReport", () => {
  it("returns a final summary by default", () => {
    const report = createHarnessCliReport([
      "node",
      "run.ts",
      "--seed",
      "4",
      "--days",
      "30",
      "--initialChoiceId",
      "technical-founder",
    ]);

    expect("checkpoints" in report).toBe(false);
    if ("checkpoints" in report) {
      throw new Error("Expected summary report");
    }
    expect(report.daysPlayed).toBe(30);
    expect(report.companyValuation).toBeGreaterThan(0);
  });

  it("returns timeline checkpoints when requested", () => {
    const report = createHarnessCliReport([
      "node",
      "run.ts",
      "--seed",
      "7",
      "--days",
      "200",
      "--initialChoiceId",
      "technical-founder",
      "--checkpointIntervalDays",
      "90",
    ]);

    expect("checkpoints" in report).toBe(true);
    if (!("checkpoints" in report)) {
      throw new Error("Expected timeline report");
    }
    expect(report.checkpoints.map((checkpoint) => checkpoint.day)).toEqual([90, 180, 200]);
    expect(report.summary.daysPlayed).toBe(200);
  });

  it("rejects invalid numeric flags", () => {
    expect(() =>
      createHarnessCliReport(["node", "run.ts", "--seed", "abc", "--days", "30"]),
    ).toThrow("Invalid --seed: expected a finite number");
    expect(() =>
      createHarnessCliReport(["node", "run.ts", "--seed", "1", "--days", "abc"]),
    ).toThrow("Invalid --days: expected a finite number");
    expect(() => createHarnessCliReport(["node", "run.ts", "--seed", "1", "--days", "-1"])).toThrow(
      "Invalid --days: expected a positive number",
    );
    expect(() =>
      createHarnessCliReport([
        "node",
        "run.ts",
        "--seed",
        "1",
        "--days",
        "30",
        "--checkpointIntervalDays",
        "abc",
      ]),
    ).toThrow("Invalid --checkpointIntervalDays: expected a finite number");
    expect(() => createHarnessCliReport(["node", "run.ts", "--days"])).toThrow(
      "Invalid --days: expected a value",
    );
    expect(() => createHarnessCliReport(["node", "run.ts", "--days", "--seed", "1"])).toThrow(
      "Invalid --days: expected a value",
    );
    expect(() => createHarnessCliReport(["node", "run.ts", "--initialChoiceId"])).toThrow(
      "Invalid --initialChoiceId: expected a value",
    );
    expect(() =>
      createHarnessCliReport(["node", "run.ts", "--initialChoiceId", "--days", "30"]),
    ).toThrow("Invalid --initialChoiceId: expected a value");
    expect(() =>
      createHarnessCliReport(["node", "run.ts", "--seed", "1.5", "--days", "30"]),
    ).toThrow("Invalid --seed: expected an integer");
    expect(() =>
      createHarnessCliReport(["node", "run.ts", "--seed", "1", "--days", "1.5"]),
    ).toThrow("Invalid --days: expected a positive integer");
    expect(() =>
      createHarnessCliReport([
        "node",
        "run.ts",
        "--seed",
        "1",
        "--days",
        "30",
        "--checkpointIntervalDays",
        "7.5",
      ]),
    ).toThrow("Invalid --checkpointIntervalDays: expected a positive integer");
  });

  it("rejects unknown initial choices", () => {
    expect(() =>
      createHarnessCliReport([
        "node",
        "run.ts",
        "--seed",
        "1",
        "--days",
        "30",
        "--initialChoiceId",
        "unknown-founder",
      ]),
    ).toThrow("Invalid initial choice: unknown-founder");
  });
});
