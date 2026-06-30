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
  const seed = readIntegerFlag(argv, "seed", "1");
  const days = readPositiveIntegerFlag(argv, "days", "365");
  const initialChoiceId = readFlag(argv, "initialChoiceId", "technical-founder");
  const checkpointIntervalDays = readOptionalPositiveIntegerFlag(argv, "checkpointIntervalDays");

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
  if (flagIndex < 0) {
    return fallback;
  }
  const value = argv[flagIndex + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`Invalid --${name}: expected a value`);
  }

  return value;
}

function readOptionalNumberFlag(argv: string[], name: string): number | undefined {
  const flagIndex = argv.indexOf(`--${name}`);
  if (flagIndex < 0) {
    return undefined;
  }
  return readNumberFlag(argv, name, "");
}

function readNumberFlag(argv: string[], name: string, fallback: string): number {
  const flagIndex = argv.indexOf(`--${name}`);
  const rawValue = flagIndex >= 0 ? argv[flagIndex + 1] : fallback;
  if (rawValue === undefined || rawValue.startsWith("--")) {
    throw new Error(`Invalid --${name}: expected a value`);
  }
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid --${name}: expected a finite number`);
  }

  return value;
}

function readPositiveNumberFlag(argv: string[], name: string, fallback: string): number {
  const value = readNumberFlag(argv, name, fallback);
  if (value <= 0) {
    throw new Error(`Invalid --${name}: expected a positive number`);
  }

  return value;
}

function readIntegerFlag(argv: string[], name: string, fallback: string): number {
  const value = readNumberFlag(argv, name, fallback);
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid --${name}: expected an integer`);
  }

  return value;
}

function readPositiveIntegerFlag(argv: string[], name: string, fallback: string): number {
  const value = readPositiveNumberFlag(argv, name, fallback);
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid --${name}: expected a positive integer`);
  }

  return value;
}

function readOptionalPositiveIntegerFlag(argv: string[], name: string): number | undefined {
  const value = readOptionalNumberFlag(argv, name);
  if (value === undefined) {
    return undefined;
  }
  if (value <= 0) {
    throw new Error(`Invalid --${name}: expected a positive number`);
  }
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid --${name}: expected a positive integer`);
  }

  return value;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(createHarnessCliReport(process.argv), null, 2));
}
