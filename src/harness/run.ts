import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runHarness,
  runHarnessTimeline,
  type HarnessSummary,
  type HarnessTimelineResult,
} from "./sim-harness";

export type HarnessCliReport = HarnessSummary | HarnessTimelineResult;

export function createHarnessCliReport(argv: string[] = process.argv): HarnessCliReport {
  const seed = Number(readFlag(argv, "seed", "1"));
  const days = Number(readFlag(argv, "days", "365"));
  const initialChoiceId = readFlag(argv, "initialChoiceId", "technical-founder");
  const checkpointIntervalDays = readOptionalNumberFlag(argv, "checkpointIntervalDays");

  if (checkpointIntervalDays && checkpointIntervalDays > 0) {
    return runHarnessTimeline({
      seed,
      days,
      initialChoiceId,
      checkpointIntervalDays,
    });
  }

  return runHarness({ seed, days, initialChoiceId });
}

function readFlag(argv: string[], name: string, fallback: string): string {
  const flagIndex = argv.indexOf(`--${name}`);
  return flagIndex >= 0 ? (argv[flagIndex + 1] ?? fallback) : fallback;
}

function readOptionalNumberFlag(argv: string[], name: string): number | undefined {
  const flagIndex = argv.indexOf(`--${name}`);
  if (flagIndex < 0) {
    return undefined;
  }
  return Number(argv[flagIndex + 1]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(createHarnessCliReport(process.argv), null, 2));
}
