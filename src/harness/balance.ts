import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runBalanceReport, type BalanceReport } from "./balance-report";

export function createBalanceCliReport(argv: string[] = process.argv): BalanceReport {
  return runBalanceReport({
    seedStart: Number(readFlag(argv, "seedStart", "1")),
    runs: Number(readFlag(argv, "runs", "10")),
    days: Number(readFlag(argv, "days", "365")),
    initialChoiceId: readFlag(argv, "initialChoiceId", "network-founder"),
    maxEventLogEntries: Number(readFlag(argv, "maxEventLogEntries", "8")),
    checkpointIntervalDays: readOptionalNumberFlag(argv, "checkpointIntervalDays"),
    includeResults: !hasFlag(argv, "summaryOnly"),
  });
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

function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(`--${name}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(createBalanceCliReport(process.argv), null, 2));
}
