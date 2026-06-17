import {
  aggregateBalanceResults,
  runBalanceReport
} from "../src/harness/balance-report";
import type { FastForwardResult } from "../src/harness/fast-forward";
import type { HarnessCheckpoint, HarnessSummary } from "../src/harness/sim-harness";
import type { GameOverReason } from "../src/sim/types";

describe("runBalanceReport", () => {
  it("runs deterministic multi-seed simulations with capped event logs", () => {
    const report = runBalanceReport({
      seedStart: 1,
      runs: 5,
      days: 365,
      initialChoiceId: "network-founder",
      maxEventLogEntries: 6
    });
    const repeat = runBalanceReport({
      seedStart: 1,
      runs: 5,
      days: 365,
      initialChoiceId: "network-founder",
      maxEventLogEntries: 6
    });
    const results = report.results ?? [];
    const repeatResults = repeat.results ?? [];

    expect(results.map((result) => result.summary)).toEqual(
      repeatResults.map((result) => result.summary)
    );
    expect(report.runs).toBe(5);
    expect(report.averageScore).toBeGreaterThan(0);
    expect(report.averageDaysPlayed).toBeGreaterThan(0);
    const totalElapsedMs = results.reduce((total, result) => total + result.elapsedMs, 0);
    const totalSimulatedDays = results.reduce(
      (total, result) => total + result.summary.daysPlayed,
      0
    );
    expect(report.performance.totalElapsedMs).toBeCloseTo(totalElapsedMs);
    expect(report.performance.averageElapsedMs).toBeCloseTo(totalElapsedMs / report.runs);
    expect(report.performance.simulatedDaysPerMs).toBeCloseTo(
      totalElapsedMs === 0 ? 0 : totalSimulatedDays / totalElapsedMs
    );
    expect(report.endingDistribution.bankruptcy.count).toBe(report.bankruptcyCount);
    expect(report.endingDistribution.retirement.count).toBe(report.retirementCount);
    expect(report.endingDistribution.death.count).toBe(report.deathCount);
    expect(report.endingDistribution.operating.count).toBe(report.operatingCount);
    expect(report.results).toBeDefined();
    expect(report.eventSummary.total).toBe(
      results.reduce((total, result) => total + result.summary.eventSummary.total, 0)
    );
    expect(report.eventSummary.byCategory.founder).toBeGreaterThanOrEqual(report.runs);
    expect(report.eventSummary.bySeverity.info).toBeGreaterThan(0);
    expect(
      report.endingDistribution.bankruptcy.count +
        report.endingDistribution.retirement.count +
        report.endingDistribution.death.count +
        report.endingDistribution.operating.count
    ).toBe(report.runs);
    expect(
      report.endingDistribution.bankruptcy.rate +
        report.endingDistribution.retirement.rate +
        report.endingDistribution.death.rate +
        report.endingDistribution.operating.rate
    ).toBeCloseTo(1);
    expect(results.every((result) => result.summary.eventLog.length <= 6)).toBe(true);
    expect(results.every((result) => result.summary.events.length <= 6)).toBe(true);
  });
});

describe("aggregateBalanceResults", () => {
  it("reports public company rate and listed market value range", () => {
    const report = aggregateBalanceResults(
      {
        seedStart: 20,
        runs: 3,
        days: 730,
        initialChoiceId: "network-founder"
      },
      [
        createResult({ isPublic: false, listedMarketValue: undefined }),
        createResult({ isPublic: true, listedMarketValue: 1_200_000 }),
        createResult({ isPublic: true, listedMarketValue: 1_800_000 })
      ]
    );

    expect(report.publicMarket.publicCompanyCount).toBe(2);
    expect(report.publicMarket.publicCompanyRate).toBeCloseTo(2 / 3);
    expect(report.publicMarket.averageListedMarketValue).toBe(1_500_000);
    expect(report.publicMarket.minimumListedMarketValue).toBe(1_200_000);
    expect(report.publicMarket.maximumListedMarketValue).toBe(1_800_000);
  });

  it("can omit per-run results for compact balance output", () => {
    const report = aggregateBalanceResults(
      {
        seedStart: 20,
        runs: 2,
        days: 365,
        initialChoiceId: "network-founder",
        includeResults: false
      },
      [
        createResult({ isPublic: false, listedMarketValue: undefined }),
        createResult({ isPublic: true, listedMarketValue: 1_200_000 })
      ]
    );

    expect(report.results).toBeUndefined();
    expect(report.averageScore).toBe(100);
    expect(report.publicMarket.publicCompanyCount).toBe(1);
  });

  it("aggregates timeline checkpoints across balance runs", () => {
    const report = aggregateBalanceResults(
      {
        seedStart: 20,
        runs: 2,
        days: 180,
        initialChoiceId: "network-founder",
        checkpointIntervalDays: 90
      },
      [
        createResult({ isPublic: false, listedMarketValue: undefined }),
        createResult({
          isPublic: false,
          listedMarketValue: undefined,
          gameOverReason: "bankruptcy"
        })
      ],
      [
        [
          createCheckpoint({
            day: 90,
            cash: 100_000,
            companyValuation: 800_000,
            headcount: 5,
            debt: 20_000,
            companyReputation: 8,
            companyMorale: 7.5,
            isPublic: true,
            listedMarketValue: 850_000
          }),
          createCheckpoint({
            day: 180,
            cash: 120_000,
            companyValuation: 900_000,
            headcount: 6,
            debt: 10_000,
            companyReputation: 9,
            companyMorale: 8,
            isPublic: true,
            listedMarketValue: 950_000
          })
        ],
        [
          createCheckpoint({
            day: 90,
            cash: -5_000,
            companyValuation: 300_000,
            headcount: 3,
            debt: 60_000,
            companyReputation: 4,
            companyMorale: 5,
            gameOverReason: "bankruptcy"
          })
        ]
      ]
    );

    expect(report.checkpointSummaries).toEqual([
      {
        day: 90,
        sampleCount: 2,
        averageCash: 47_500,
        averageCompanyValuation: 550_000,
        averageHeadcount: 4,
        averageDebt: 40_000,
        negativeCashCount: 1,
        negativeCashRate: 0.5,
        publicCompanyCount: 1,
        publicCompanyRate: 0.5,
        averageListedMarketValue: 850_000,
        averageCompanyReputation: 6,
        averageCompanyMorale: 6.25,
        gameOverCount: 1,
        bankruptcyCount: 1
      },
      {
        day: 180,
        sampleCount: 1,
        averageCash: 120_000,
        averageCompanyValuation: 900_000,
        averageHeadcount: 6,
        averageDebt: 10_000,
        negativeCashCount: 0,
        negativeCashRate: 0,
        publicCompanyCount: 1,
        publicCompanyRate: 1,
        averageListedMarketValue: 950_000,
        averageCompanyReputation: 9,
        averageCompanyMorale: 8,
        gameOverCount: 0,
        bankruptcyCount: 0
      }
    ]);
  });
});

function createResult(input: {
  isPublic: boolean;
  listedMarketValue?: number;
  gameOverReason?: GameOverReason;
}): FastForwardResult {
  const summary: HarnessSummary = {
    daysPlayed: 730,
    companyValuation: input.listedMarketValue ?? 900_000,
    valuationKind: input.isPublic ? "listed_market" : "private_estimate",
    isPublic: input.isPublic,
    listedMarketValue: input.listedMarketValue,
    playerWealth: 500_000,
    score: 100,
    cash: 100_000,
    headcount: 30,
    debt: 0,
    employeeCount: 30,
    staffRoleCounts: {
      engineer: 10,
      product: 5,
      sales: 7,
      finance: 4,
      hr: 4
    },
    totalMonthlyPayroll: 300_000,
    averageEmployeeSalary: 10_000,
    employees: [],
    companyReputation: 8,
    companyMorale: 7,
    companyCulture: "adaptive",
    culturePressure: 5,
    founderAbilities: {
      technical: 5,
      experience: 1,
      stressTolerance: 5,
      communication: 5,
      eq: 5,
      iq: 5
    },
    founderAge: 27,
    founderHealth: 98,
    cyclePhase: "recovery",
    unemploymentRate: 0.07,
    legalCaseCount: 0,
    policySupportCount: 0,
    specialEventCount: 0,
    events: [],
    eventSummary: {
      total: 0,
      byCategory: {
        founder: 0,
        people: 0,
        finance: 0,
        market: 0,
        society: 0,
        legal: 0,
        operations: 0
      },
      bySeverity: {
        info: 0,
        positive: 0,
        warning: 0,
        critical: 0
      }
    },
    eventLog: [],
    gameOverReason: input.gameOverReason
  };

  return {
    summary,
    elapsedMs: 1,
    eventLogTruncated: false
  };
}

function createCheckpoint(input: {
  day: number;
  cash: number;
  companyValuation: number;
  headcount: number;
  debt?: number;
  companyReputation?: number;
  companyMorale?: number;
  isPublic?: boolean;
  listedMarketValue?: number;
  gameOverReason?: GameOverReason;
}): HarnessCheckpoint {
  return {
    day: input.day,
    companyValuation: input.companyValuation,
    valuationKind: input.isPublic ? "listed_market" : "private_estimate",
    isPublic: input.isPublic ?? false,
    listedMarketValue: input.listedMarketValue,
    playerWealth: 500_000,
    score: input.day + input.companyValuation * 2 + 500_000,
    cash: input.cash,
    headcount: input.headcount,
    debt: input.debt ?? 0,
    employeeCount: input.headcount,
    staffRoleCounts: {
      engineer: input.headcount,
      product: 0,
      sales: 0,
      finance: 0,
      hr: 0
    },
    totalMonthlyPayroll: input.headcount * 10_000,
    averageEmployeeSalary: input.headcount > 0 ? 10_000 : 0,
    companyReputation: input.companyReputation ?? 8,
    companyMorale: input.companyMorale ?? 7,
    founderAbilities: {
      technical: 5,
      experience: 1,
      stressTolerance: 5,
      communication: 5,
      eq: 5,
      iq: 5
    },
    founderAge: 27,
    founderHealth: 98,
    cyclePhase: "recovery",
    unemploymentRate: 0.07,
    gameOverReason: input.gameOverReason
  };
}
