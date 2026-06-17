import type { HarnessEmployeeSummary, HarnessSummary } from "../harness/sim-harness";
import type { AbilitySet, CompanyRoleCounts, GameEvent } from "../sim/types";

export interface HudMetric {
  label: string;
  value: string;
}

export interface CityMapLocation {
  id: string;
  label: string;
  enabled: boolean;
}

export interface GameViewModel {
  title: string;
  founder: {
    age: number;
    health: number;
    wealth: number;
    abilities: AbilitySet;
  };
  staff: {
    employeeCount: number;
    roleCounts: CompanyRoleCounts;
    totalMonthlyPayroll: number;
    averageEmployeeSalary: number;
    employees: HarnessEmployeeSummary[];
  };
  hud: {
    cash: HudMetric;
    valuation: HudMetric;
    score: HudMetric;
    headcount: HudMetric;
    culture: HudMetric;
    morale: HudMetric;
    reputation: HudMetric;
    pressure: HudMetric;
    cycle: HudMetric;
  };
  statusBadge: string;
  mapLocations: CityMapLocation[];
  events: GameEvent[];
  eventFeed: string[];
}

export function createGameViewModel(summary: HarnessSummary): GameViewModel {
  return {
    title: "我是老板 / I am boss",
    founder: {
      age: summary.founderAge,
      health: summary.founderHealth,
      wealth: summary.playerWealth,
      abilities: summary.founderAbilities
    },
    staff: {
      employeeCount: summary.employeeCount,
      roleCounts: summary.staffRoleCounts,
      totalMonthlyPayroll: summary.totalMonthlyPayroll,
      averageEmployeeSalary: summary.averageEmployeeSalary,
      employees: summary.employees
    },
    hud: {
      cash: { label: "Cash", value: formatCurrency(summary.cash) },
      valuation: { label: "Valuation", value: formatCurrency(summary.companyValuation) },
      score: { label: "Score", value: Math.round(summary.score).toLocaleString("en-US") },
      headcount: { label: "Headcount", value: String(summary.headcount) },
      culture: { label: "Culture", value: summary.companyCulture },
      morale: { label: "Morale", value: formatTenPointScore(summary.companyMorale) },
      reputation: {
        label: "Reputation",
        value: formatTenPointScore(summary.companyReputation)
      },
      pressure: { label: "Pressure", value: formatTenPointScore(summary.culturePressure) },
      cycle: { label: "Cycle", value: summary.cyclePhase }
    },
    statusBadge: summary.gameOverReason ?? "operating",
    mapLocations: [
      { id: "company", label: "Company", enabled: true },
      { id: "bank", label: "Bank", enabled: true },
      { id: "exchange", label: "Exchange", enabled: summary.companyValuation > 0 },
      { id: "labor-market", label: "Labor Market", enabled: true },
      { id: "court", label: "Court", enabled: true },
      { id: "policy-office", label: "Policy Office", enabled: true }
    ],
    events: summary.events.slice(-8),
    eventFeed: summary.eventLog.slice(-8)
  };
}

function formatCurrency(value: number): string {
  return `¥${Math.round(value).toLocaleString("en-US")}`;
}

function formatTenPointScore(value: number): string {
  return `${Number(value.toFixed(1)).toLocaleString("en-US")}/10`;
}
