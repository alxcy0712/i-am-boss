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
});
