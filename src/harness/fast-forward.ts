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
  const maxEventLogEntries = input.maxEventLogEntries ?? summary.eventLog.length;
  const eventLogTruncated = summary.eventLog.length > maxEventLogEntries;
  const cappedEventLog = eventLogTruncated
    ? summary.eventLog.slice(-maxEventLogEntries)
    : summary.eventLog;
  const cappedEvents = eventLogTruncated
    ? summary.events.slice(-maxEventLogEntries)
    : summary.events;

  return {
    summary: {
      ...summary,
      events: cappedEvents,
      eventLog: cappedEventLog
    },
    elapsedMs: performance.now() - startedAt,
    eventLogTruncated
  };
}
