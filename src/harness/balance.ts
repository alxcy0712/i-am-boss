import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runBalanceReport, type BalanceReport } from "./balance-report";

export function createBalanceCliReport(argv: string[] = process.argv): BalanceReport {
  return runBalanceReport({
    seedStart: readIntegerFlag(argv, "seedStart", "1"),
    runs: readPositiveIntegerFlag(argv, "runs", "10"),
    days: readPositiveIntegerFlag(argv, "days", "365"),
    initialChoiceId: readFlag(argv, "initialChoiceId", "network-founder"),
    maxEventLogEntries: readNonNegativeIntegerFlag(argv, "maxEventLogEntries", "8"),
    checkpointIntervalDays: readOptionalPositiveIntegerFlag(argv, "checkpointIntervalDays"),
    includeResults: !hasFlag(argv, "summaryOnly"),
  });
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

function readNonNegativeIntegerFlag(argv: string[], name: string, fallback: string): number {
  const value = readNumberFlag(argv, name, fallback);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid --${name}: expected a non-negative integer`);
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

function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(`--${name}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(createBalanceCliReport(process.argv), null, 2));
}
