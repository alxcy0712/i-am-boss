import type {
  GameEvent,
  GameEventCategory,
  GameEventCategoryCounts,
  GameEventPayload,
  GameEventSeverity,
  GameEventSeverityCounts,
  GameEventSummary,
  GameState,
} from "./types";

const EMPTY_CATEGORY_COUNTS: GameEventCategoryCounts = {
  founder: 0,
  people: 0,
  finance: 0,
  market: 0,
  society: 0,
  legal: 0,
  operations: 0,
};

const EMPTY_SEVERITY_COUNTS: GameEventSeverityCounts = {
  info: 0,
  positive: 0,
  warning: 0,
  critical: 0,
};

export function recordGameEvent(state: GameState, payload: GameEventPayload): GameEvent {
  const event = {
    ...payload,
    day: state.day,
    category: getGameEventCategory(payload),
    severity: getGameEventSeverity(payload),
  } as GameEvent;

  state.events.push(event);
  state.eventLog.push(formatGameEvent(event));
  return event;
}

export function createGameEventSummary(events: GameEvent[]): GameEventSummary {
  const byCategory = { ...EMPTY_CATEGORY_COUNTS };
  const bySeverity = { ...EMPTY_SEVERITY_COUNTS };

  for (const event of events) {
    byCategory[event.category] += 1;
    bySeverity[event.severity] += 1;
  }

  return {
    total: events.length,
    byCategory,
    bySeverity,
  };
}

export function getGameEventCategory(event: GameEventPayload): GameEventCategory {
  switch (event.type) {
    case "initial_choice":
    case "game_over":
    case "car_purchased":
    case "car_upgraded":
    case "marriage":
    case "child_born":
    case "divorce":
      return "founder";
    case "employee_hired":
    case "employee_salary_adjusted":
    case "employee_terminated":
    case "employees_resigned":
    case "employee_promoted":
    case "hiring_failed":
    case "candidate_skipped":
    case "ai_hire_succeeded":
    case "ai_hire_failed":
      return "people";
    case "bank_loan_approved":
    case "ipo_prepared":
    case "insurance_purchased":
    case "insurance_claim_paid":
    case "investment_made":
    case "investment_return":
    case "investment_sold":
      return "finance";
    case "governance_penalty":
    case "delisting_warning":
      return "market";
    case "listed_market_value":
      return "market";
    case "society_event":
      if (event.eventType === "legal_incident") {
        return "legal";
      }
      if (event.eventType === "market_shock") {
        return "market";
      }
      return "society";
    case "special_event":
      if (event.eventType === "financial_crisis") {
        return "market";
      }
      if (event.eventType === "supply_chain_shock") {
        return "operations";
      }
      return "society";
    case "court_case_resolved":
      return "legal";
    case "payroll_paid":
    case "culture_changed":
    case "policy_support_ineligible":
    case "policy_support_granted":
      return event.type.startsWith("policy_") ? "society" : "operations";
  }
}

export function getGameEventSeverity(event: GameEventPayload): GameEventSeverity {
  switch (event.type) {
    case "employee_hired":
    case "employee_salary_adjusted":
    case "employee_promoted":
    case "bank_loan_approved":
    case "ipo_prepared":
    case "policy_support_granted":
    case "ai_hire_succeeded":
    case "insurance_purchased":
    case "investment_made":
    case "car_purchased":
    case "car_upgraded":
    case "marriage":
    case "child_born":
      return "positive";
    case "employee_terminated":
    case "employees_resigned":
    case "hiring_failed":
    case "policy_support_ineligible":
    case "court_case_resolved":
    case "ai_hire_failed":
    case "insurance_claim_paid":
    case "divorce":
      return "warning";
    case "governance_penalty":
      return "warning";
    case "delisting_warning":
      return "critical";
    case "investment_return":
      return event.returnAmount >= 0 ? "positive" : "warning";
    case "investment_sold":
      return event.gain >= 0 ? "positive" : "warning";
    case "society_event":
      if (
        event.cashDelta < 0 ||
        event.reputationDelta < 0 ||
        (event.marketSentimentDelta ?? 0) < 0
      ) {
        return "warning";
      }
      if (
        event.cashDelta > 0 ||
        event.reputationDelta > 0 ||
        (event.marketSentimentDelta ?? 0) > 0
      ) {
        return "positive";
      }
      return "info";
    case "special_event":
      return event.eventType === "financial_crisis" ? "critical" : "warning";
    case "game_over":
      return "critical";
    case "initial_choice":
    case "payroll_paid":
    case "culture_changed":
    case "listed_market_value":
    case "candidate_skipped":
      return "info";
  }
}

export function formatGameEvent(event: GameEventPayload): string {
  switch (event.type) {
    case "initial_choice":
      return `Initial choice: ${event.choiceLabel}`;
    case "employee_hired":
      return `Hired ${event.role}: ${event.salary}`;
    case "employee_salary_adjusted":
      return `Salary adjusted: ${event.role}, salary ¥${event.previousSalary.toLocaleString(
        "en-US",
      )} -> ¥${event.salary.toLocaleString("en-US")}`;
    case "payroll_paid":
      return `Payroll paid: ${event.amount}`;
    case "employee_terminated":
      return `Employee terminated: ${event.role}, severance ¥${event.severance.toLocaleString(
        "en-US",
      )}`;
    case "employees_resigned":
      return `Resigned employees: ${event.count}`;
    case "employee_promoted":
      return `Promoted ${event.role} to ${event.managementLevel} management`;
    case "society_event":
      return `${event.eventType}: cash ${event.cashDelta}, reputation ${event.reputationDelta}`;
    case "special_event":
      return [
        `Special event: ${event.eventType}`,
        `cash ${event.cashDelta},`,
        `sentiment ${event.marketSentimentDelta}`,
      ].join(" ");
    case "culture_changed":
      return `Culture changed: ${event.culture}`;
    case "listed_market_value":
      return `Listed market value: ${Math.round(event.value)}`;
    case "policy_support_ineligible":
      return "Policy support ineligible";
    case "policy_support_granted":
      return `Policy support granted: ${event.cashDelta}`;
    case "court_case_resolved":
      return [
        `Court case resolved: ${event.caseType}:`,
        `severity ${event.caseSeverity},`,
        `penalty ${event.penalty}`,
      ].join(" ");
    case "bank_loan_approved":
      return `Bank loan approved: ${event.amount}`;
    case "ipo_prepared":
      return `IPO prepared: ${Math.round(event.listedMarketValue)}`;
    case "hiring_failed":
      return event.reason
        ? `Hiring failed: ${event.role} (${event.reason})`
        : `Hiring failed: ${event.role}`;
    case "candidate_skipped":
      return `Candidate skipped: ${event.role}`;
    case "ai_hire_succeeded":
      return `AI hired ${event.role}: ${event.salary}`;
    case "ai_hire_failed":
      return event.reason
        ? `AI hiring failed: ${event.role} (${event.reason})`
        : `AI hiring failed: ${event.role}`;
    case "insurance_purchased":
      return `Insurance purchased: ${event.insuranceType}, premium ${event.premium}, coverage ${event.coverage}`;
    case "insurance_claim_paid":
      return `Insurance claim paid: policy ${event.policyId}, payout ${event.payout}, damage ${event.damageAmount}`;
    case "investment_made":
      return `Investment made: ${event.investmentType} ¥${event.amount.toLocaleString("en-US")}, expected return ${(event.expectedReturn * 100).toFixed(1)}%`;
    case "investment_return":
      return `Investment return: ${event.investmentId}, gain ¥${event.returnAmount.toLocaleString("en-US")}, value ¥${Math.round(event.currentValue).toLocaleString("en-US")}`;
    case "investment_sold":
      return `Investment sold: ${event.investmentType} ${event.investmentId}, sale ¥${event.saleAmount.toLocaleString("en-US")}, gain ¥${event.gain.toLocaleString("en-US")}`;
    case "governance_penalty":
      return `Governance penalty: ${event.reason}, penalty ¥${event.penalty.toLocaleString("en-US")}`;
    case "delisting_warning":
      return `Delisting warning: ${event.riskLevel} risk, reasons: ${event.reasons.join("; ")}`;
    case "game_over":
      return `Game over: ${event.reason}`;
    case "car_purchased":
      return `Purchased car: ${event.brand} for ¥${event.value.toLocaleString("en-US")}`;
    case "car_upgraded":
      return `Upgraded car: ${event.brand} to ¥${event.newValue.toLocaleString("en-US")}`;
    case "marriage":
      return `Married: ${event.spouseName}`;
    case "child_born":
      return `Child born: ${event.childName}`;
    case "divorce":
      return `Divorce: ${event.spouseName}, lost ¥${event.wealthLoss.toLocaleString("en-US")}`;
  }
}
