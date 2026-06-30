import { performance } from "node:perf_hooks";
import type { HarnessInput, HarnessSummary } from "./sim-harness";
import { runHarness } from "./sim-harness";

export interface FastForwardInput extends HarnessInput {
  maxEventLogEntries?: number;
}

export interface FastForwardResult {
  summary: HarnessSummary;
  elapsedMs: number;
  eventLogTruncated: boolean;
}

export function runFastForward(input: FastForwardInput): FastForwardResult {
  const startedAt = performance.now();
  const summary = runHarness(input);
  const maxEventLogEntries = normalizeEventLogCap(
    input.maxEventLogEntries,
    summary.eventLog.length,
  );
  const eventLogTruncated = summary.eventLog.length > maxEventLogEntries;
  const cappedEventLog = eventLogTruncated
    ? sliceLast(summary.eventLog, maxEventLogEntries)
    : summary.eventLog;
  const cappedEvents = eventLogTruncated
    ? sliceLast(summary.events, maxEventLogEntries)
    : summary.events;

  return {
    summary: {
      ...summary,
      events: cappedEvents,
      eventLog: cappedEventLog,
    },
    elapsedMs: performance.now() - startedAt,
    eventLogTruncated,
  };
}

function normalizeEventLogCap(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.floor(value);
}

function sliceLast<T>(items: T[], count: number): T[] {
  return count === 0 ? [] : items.slice(-count);
}
