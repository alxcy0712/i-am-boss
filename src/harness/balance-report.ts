import { performance } from "node:perf_hooks";
import type { FastForwardResult } from "./fast-forward";
import { runFastForward } from "./fast-forward";
import type { HarnessCheckpoint, HarnessSummary } from "./sim-harness";
import { runHarnessTimeline } from "./sim-harness";
import type { GameEventSummary, GameOverReason } from "../sim/types";

export interface BalanceReportInput {
  seedStart: number;
  runs: number;
  days: number;
  initialChoiceId: string;
  maxEventLogEntries?: number;
  checkpointIntervalDays?: number;
  includeResults?: boolean;
}

export interface BalanceReport {
  seedStart: number;
  runs: number;
  days: number;
  initialChoiceId: string;
  averageScore: number;
  averageDaysPlayed: number;
  bankruptcyCount: number;
  retirementCount: number;
  deathCount: number;
  operatingCount: number;
  endingDistribution: EndingDistribution;
  publicMarket: BalancePublicMarket;
  eventSummary: GameEventSummary;
  checkpointSummaries?: BalanceCheckpointSummary[];
  performance: BalancePerformance;
  eventLogTruncatedCount: number;
  results?: FastForwardResult[];
}

export interface BalancePublicMarket {
  publicCompanyCount: number;
  publicCompanyRate: number;
  averageListedMarketValue: number;
  minimumListedMarketValue: number;
  maximumListedMarketValue: number;
}

export interface BalanceCheckpointSummary {
  day: number;
  sampleCount: number;
  averageCash: number;
  averageCompanyValuation: number;
  averageHeadcount: number;
  averageDebt: number;
  negativeCashCount: number;
  negativeCashRate: number;
  publicCompanyCount: number;
  publicCompanyRate: number;
  averageListedMarketValue: number;
  averageCompanyReputation: number;
  averageCompanyMorale: number;
  gameOverCount: number;
  bankruptcyCount: number;
}

export interface BalancePerformance {
  totalElapsedMs: number;
  averageElapsedMs: number;
  simulatedDaysPerMs: number;
}

export interface EndingDistributionEntry {
  count: number;
  rate: number;
}

export type EndingDistribution = Record<GameOverReason | "operating", EndingDistributionEntry>;

export function runBalanceReport(input: BalanceReportInput): BalanceReport {
  if (input.checkpointIntervalDays && input.checkpointIntervalDays > 0) {
    const timelineRuns = Array.from({ length: input.runs }, (_, index) =>
      runBalanceTimeline({
        seed: input.seedStart + index,
        days: input.days,
        initialChoiceId: input.initialChoiceId,
        maxEventLogEntries: input.maxEventLogEntries,
        checkpointIntervalDays: input.checkpointIntervalDays ?? input.days,
      }),
    );

    return aggregateBalanceResults(
      input,
      timelineRuns.map((timelineRun) => timelineRun.result),
      timelineRuns.map((timelineRun) => timelineRun.checkpoints),
    );
  }

  const results = Array.from({ length: input.runs }, (_, index) =>
    runFastForward({
      seed: input.seedStart + index,
      days: input.days,
      initialChoiceId: input.initialChoiceId,
      maxEventLogEntries: input.maxEventLogEntries,
    }),
  );

  return aggregateBalanceResults(input, results);
}

export function aggregateBalanceResults(
  input: BalanceReportInput,
  results: FastForwardResult[],
  checkpointRuns: HarnessCheckpoint[][] = [],
): BalanceReport {
  const totalScore = results.reduce((total, result) => total + result.summary.score, 0);
  const totalDays = results.reduce((total, result) => total + result.summary.daysPlayed, 0);
  const bankruptcyCount = countReason(results, "bankruptcy");
  const retirementCount = countReason(results, "retirement");
  const deathCount = countReason(results, "death");
  const operatingCount = results.filter((result) => !result.summary.gameOverReason).length;
  const endingDistribution = createEndingDistribution({
    runs: input.runs,
    bankruptcyCount,
    retirementCount,
    deathCount,
    operatingCount,
  });
  const publicMarket = createPublicMarketSummary({
    runs: input.runs,
    results,
  });
  const eventSummary = createBalanceEventSummary(results);
  const performance = createBalancePerformance({
    runs: input.runs,
    totalDays,
    results,
  });
  const checkpointSummaries = createCheckpointSummaries(checkpointRuns);

  const report: BalanceReport = {
    seedStart: input.seedStart,
    runs: input.runs,
    days: input.days,
    initialChoiceId: input.initialChoiceId,
    averageScore: totalScore / input.runs,
    averageDaysPlayed: totalDays / input.runs,
    bankruptcyCount,
    retirementCount,
    deathCount,
    operatingCount,
    endingDistribution,
    publicMarket,
    eventSummary,
    performance,
    eventLogTruncatedCount: results.filter((result) => result.eventLogTruncated).length,
  };

  if (input.includeResults ?? true) {
    report.results = results;
  }

  if (checkpointSummaries.length > 0) {
    report.checkpointSummaries = checkpointSummaries;
  }

  return report;
}

function runBalanceTimeline(input: {
  seed: number;
  days: number;
  initialChoiceId: string;
  maxEventLogEntries?: number;
  checkpointIntervalDays: number;
}): { result: FastForwardResult; checkpoints: HarnessCheckpoint[] } {
  const startedAt = performance.now();
  const timeline = runHarnessTimeline(input);
  const maxEventLogEntries = input.maxEventLogEntries ?? timeline.summary.eventLog.length;
  const eventLogTruncated = timeline.summary.eventLog.length > maxEventLogEntries;
  const cappedSummary = capSummaryEventLog({
    summary: timeline.summary,
    maxEventLogEntries,
    eventLogTruncated,
  });

  return {
    result: {
      summary: cappedSummary,
      elapsedMs: performance.now() - startedAt,
      eventLogTruncated,
    },
    checkpoints: timeline.checkpoints,
  };
}

function capSummaryEventLog(input: {
  summary: HarnessSummary;
  maxEventLogEntries: number;
  eventLogTruncated: boolean;
}): HarnessSummary {
  return {
    ...input.summary,
    events: input.eventLogTruncated
      ? input.summary.events.slice(-input.maxEventLogEntries)
      : input.summary.events,
    eventLog: input.eventLogTruncated
      ? input.summary.eventLog.slice(-input.maxEventLogEntries)
      : input.summary.eventLog,
  };
}

function createBalanceEventSummary(results: FastForwardResult[]): GameEventSummary {
  const summary: GameEventSummary = {
    total: 0,
    byCategory: {
      founder: 0,
      people: 0,
      finance: 0,
      market: 0,
      society: 0,
      legal: 0,
      operations: 0,
    },
    bySeverity: {
      info: 0,
      positive: 0,
      warning: 0,
      critical: 0,
    },
  };

  for (const result of results) {
    summary.total += result.summary.eventSummary.total;

    for (const category of Object.keys(summary.byCategory) as Array<
      keyof GameEventSummary["byCategory"]
    >) {
      summary.byCategory[category] += result.summary.eventSummary.byCategory[category];
    }

    for (const severity of Object.keys(summary.bySeverity) as Array<
      keyof GameEventSummary["bySeverity"]
    >) {
      summary.bySeverity[severity] += result.summary.eventSummary.bySeverity[severity];
    }
  }

  return summary;
}

function countReason(results: FastForwardResult[], reason: GameOverReason): number {
  return results.filter((result) => result.summary.gameOverReason === reason).length;
}

function createEndingDistribution(input: {
  runs: number;
  bankruptcyCount: number;
  retirementCount: number;
  deathCount: number;
  operatingCount: number;
}): EndingDistribution {
  return {
    bankruptcy: entry(input.bankruptcyCount, input.runs),
    retirement: entry(input.retirementCount, input.runs),
    death: entry(input.deathCount, input.runs),
    operating: entry(input.operatingCount, input.runs),
  };
}

function createPublicMarketSummary(input: {
  runs: number;
  results: FastForwardResult[];
}): BalancePublicMarket {
  const publicCompanyCount = input.results.filter((result) => result.summary.isPublic).length;
  const listedMarketValues = input.results
    .map((result) => result.summary.listedMarketValue)
    .filter((value): value is number => typeof value === "number");
  const totalListedMarketValue = listedMarketValues.reduce((total, value) => total + value, 0);

  return {
    publicCompanyCount,
    publicCompanyRate: input.runs === 0 ? 0 : publicCompanyCount / input.runs,
    averageListedMarketValue:
      listedMarketValues.length === 0 ? 0 : totalListedMarketValue / listedMarketValues.length,
    minimumListedMarketValue: listedMarketValues.length === 0 ? 0 : Math.min(...listedMarketValues),
    maximumListedMarketValue: listedMarketValues.length === 0 ? 0 : Math.max(...listedMarketValues),
  };
}

function createCheckpointSummaries(
  checkpointRuns: HarnessCheckpoint[][],
): BalanceCheckpointSummary[] {
  const checkpointsByDay = new Map<number, HarnessCheckpoint[]>();

  for (const checkpoints of checkpointRuns) {
    for (const checkpoint of checkpoints) {
      const dayCheckpoints = checkpointsByDay.get(checkpoint.day) ?? [];
      dayCheckpoints.push(checkpoint);
      checkpointsByDay.set(checkpoint.day, dayCheckpoints);
    }
  }

  return [...checkpointsByDay.entries()]
    .sort(([leftDay], [rightDay]) => leftDay - rightDay)
    .map(([day, checkpoints]) => {
      const totalCash = checkpoints.reduce((total, checkpoint) => total + checkpoint.cash, 0);
      const totalCompanyValuation = checkpoints.reduce(
        (total, checkpoint) => total + checkpoint.companyValuation,
        0,
      );
      const totalHeadcount = checkpoints.reduce(
        (total, checkpoint) => total + checkpoint.headcount,
        0,
      );
      const totalDebt = checkpoints.reduce((total, checkpoint) => total + checkpoint.debt, 0);
      const totalCompanyReputation = checkpoints.reduce(
        (total, checkpoint) => total + checkpoint.companyReputation,
        0,
      );
      const totalCompanyMorale = checkpoints.reduce(
        (total, checkpoint) => total + checkpoint.companyMorale,
        0,
      );
      const negativeCashCount = checkpoints.filter((checkpoint) => checkpoint.cash < 0).length;
      const publicCompanyCount = checkpoints.filter((checkpoint) => checkpoint.isPublic).length;
      const listedMarketValues = checkpoints
        .map((checkpoint) => checkpoint.listedMarketValue)
        .filter((value): value is number => typeof value === "number");
      const totalListedMarketValue = listedMarketValues.reduce((total, value) => total + value, 0);

      return {
        day,
        sampleCount: checkpoints.length,
        averageCash: totalCash / checkpoints.length,
        averageCompanyValuation: totalCompanyValuation / checkpoints.length,
        averageHeadcount: totalHeadcount / checkpoints.length,
        averageDebt: totalDebt / checkpoints.length,
        negativeCashCount,
        negativeCashRate: negativeCashCount / checkpoints.length,
        publicCompanyCount,
        publicCompanyRate: publicCompanyCount / checkpoints.length,
        averageListedMarketValue:
          listedMarketValues.length === 0 ? 0 : totalListedMarketValue / listedMarketValues.length,
        averageCompanyReputation: totalCompanyReputation / checkpoints.length,
        averageCompanyMorale: totalCompanyMorale / checkpoints.length,
        gameOverCount: checkpoints.filter((checkpoint) => checkpoint.gameOverReason).length,
        bankruptcyCount: checkpoints.filter(
          (checkpoint) => checkpoint.gameOverReason === "bankruptcy",
        ).length,
      };
    });
}

function entry(count: number, runs: number): EndingDistributionEntry {
  return {
    count,
    rate: runs === 0 ? 0 : count / runs,
  };
}

function createBalancePerformance(input: {
  runs: number;
  totalDays: number;
  results: FastForwardResult[];
}): BalancePerformance {
  const totalElapsedMs = input.results.reduce((total, result) => total + result.elapsedMs, 0);

  return {
    totalElapsedMs,
    averageElapsedMs: input.runs === 0 ? 0 : totalElapsedMs / input.runs,
    simulatedDaysPerMs: totalElapsedMs === 0 ? 0 : input.totalDays / totalElapsedMs,
  };
}
