import { getGameEventCategory, getGameEventSeverity } from "../sim/events";
import type { GameState } from "../sim/types";
import type { GameEventPayload } from "../sim/types";

const INSURANCE_TYPES = new Set(["legal", "operational", "market", "comprehensive"]);
const INVESTMENT_TYPES = new Set(["stocks", "bonds", "real_estate", "venture", "crypto"]);
const COMPANY_ROLES = new Set(["engineer", "product", "sales", "finance", "hr"]);
const MANAGEMENT_LEVELS = new Set(["individual", "middle", "executive"]);
const EDUCATION_TIERS = new Set(["elite", "strong", "standard", "vocational"]);
const CANDIDATE_MAJORS = new Set([
  "computer-science",
  "engineering",
  "business",
  "finance",
  "design",
  "operations",
]);
const COMPANY_CULTURES = new Set(["wolf", "laissez-faire", "adaptive", "striver"]);
const COMPANY_INDUSTRIES = new Set(["technology", "advanced-manufacturing", "biotech", "services"]);
const MACRO_CYCLE_PHASES = new Set(["recovery", "prosperity", "recession", "depression"]);
const SOCIETY_EVENT_KINDS = new Set([
  "policy_support",
  "legal_incident",
  "market_shock",
  "labor_market_shift",
]);
const SPECIAL_EVENT_KINDS = new Set([
  "financial_crisis",
  "supply_chain_shock",
  "geopolitical_tension",
]);
const COURT_CASE_KINDS = new Set(["company_violation", "employee_violation"]);
const DELISTING_RISK_LEVELS = new Set(["none", "low", "medium", "high", "critical"]);
const GAME_OVER_REASONS = new Set(["bankruptcy", "retirement", "death"]);
const EVENT_CATEGORIES = new Set([
  "founder",
  "people",
  "finance",
  "market",
  "society",
  "legal",
  "operations",
]);
const EVENT_SEVERITIES = new Set(["info", "positive", "warning", "critical"]);
const EVENT_TYPES = new Set([
  "initial_choice",
  "employee_hired",
  "payroll_paid",
  "employee_salary_adjusted",
  "employee_terminated",
  "employees_resigned",
  "employee_promoted",
  "society_event",
  "special_event",
  "culture_changed",
  "listed_market_value",
  "policy_support_ineligible",
  "policy_support_granted",
  "court_case_resolved",
  "bank_loan_approved",
  "ipo_prepared",
  "hiring_failed",
  "candidate_skipped",
  "ai_hire_succeeded",
  "ai_hire_failed",
  "insurance_purchased",
  "insurance_claim_paid",
  "investment_made",
  "investment_return",
  "investment_sold",
  "governance_penalty",
  "delisting_warning",
  "car_purchased",
  "car_upgraded",
  "marriage",
  "child_born",
  "divorce",
  "game_over",
]);

export interface GameSnapshot {
  version: 1;
  state: GameState;
}

export function serializeGameState(state: GameState): string {
  const snapshot: GameSnapshot = {
    version: 1,
    state,
  };
  return JSON.stringify(snapshot);
}

export function deserializeGameState(snapshotJson: string): GameState {
  const snapshot = JSON.parse(snapshotJson) as GameSnapshot;
  if (snapshot.version !== 1) {
    throw new Error(`Unsupported snapshot version: ${snapshot.version}`);
  }
  validateSnapshotState(snapshot.state);
  return structuredClone(snapshot.state);
}

function validateSnapshotState(state: GameState): void {
  if (!state || typeof state !== "object") {
    throw new Error("Invalid snapshot: missing game state");
  }
  if (!state.company || typeof state.company !== "object") {
    throw new Error("Invalid snapshot: missing company state");
  }
  if (!state.founder || typeof state.founder !== "object") {
    throw new Error("Invalid snapshot: missing founder state");
  }
  if (!state.society || typeof state.society !== "object") {
    throw new Error("Invalid snapshot: missing society state");
  }
  if (!Array.isArray(state.events)) {
    throw new Error("Invalid snapshot: missing event list");
  }
  if (!Array.isArray(state.eventLog)) {
    throw new Error("Invalid snapshot: missing event log");
  }
  state.events.forEach(validateGameEvent);
  state.eventLog.forEach((entry, index) => validateNonEmptyString(entry, `eventLog[${index}]`));

  validateNonNegativeInteger(state.day, "state.day");
  validateFiniteNumber(state.marketSentiment, "state.marketSentiment");

  const company = state.company;
  validateFiniteNumber(company.cash, "company.cash");
  validateFiniteNumber(company.annualRevenue, "company.annualRevenue");
  validateFiniteNumber(company.monthlyBurn, "company.monthlyBurn");
  validateFiniteNumber(company.debt, "company.debt");
  validateNonNegativeInteger(company.headcount, "company.headcount");
  validateFiniteNumber(company.reputation, "company.reputation");
  validateFiniteNumber(company.morale, "company.morale");
  validateFiniteNumber(company.resources, "company.resources");
  validateFiniteNumber(company.operationalCapability, "company.operationalCapability");
  validateFiniteNumber(company.culturePressure, "company.culturePressure");
  validateFiniteNumber(company.valuation, "company.valuation");
  validateSetMember(
    company.culture,
    COMPANY_CULTURES,
    "Invalid snapshot: invalid company culture: company.culture",
  );
  validateSetMember(
    company.industry,
    COMPANY_INDUSTRIES,
    "Invalid snapshot: invalid company industry: company.industry",
  );
  if (company.listedMarketValue !== undefined) {
    validateNonNegativeNumber(company.listedMarketValue, "company.listedMarketValue");
  }
  if (company.governanceMetrics !== undefined) {
    validateGovernanceMetrics(company.governanceMetrics);
  }

  if (!Array.isArray(company.employees)) {
    throw new Error("Invalid snapshot: missing employee roster");
  }
  if (!Array.isArray(company.insurancePolicies)) {
    throw new Error("Invalid snapshot: missing insurance policies");
  }
  if (!Array.isArray(company.investments)) {
    throw new Error("Invalid snapshot: missing investments");
  }
  company.employees.forEach((employee, index) => {
    validateNonEmptyString(employee.id, `company.employees[${index}].id`);
    validateCompanyRole(employee.role, `company.employees[${index}].role`);
    validateCandidateBackground(employee.background, `company.employees[${index}].background`);
    validateScore(employee.technical, `company.employees[${index}].technical`);
    validateScore(employee.experience, `company.employees[${index}].experience`);
    validateScore(employee.stressTolerance, `company.employees[${index}].stressTolerance`);
    validateScore(employee.communication, `company.employees[${index}].communication`);
    validateScore(employee.eq, `company.employees[${index}].eq`);
    validateScore(employee.iq, `company.employees[${index}].iq`);
    validateScore(employee.personality, `company.employees[${index}].personality`);
    validateFiniteNumber(employee.salary, `company.employees[${index}].salary`);
    validatePositiveNumber(employee.salary, `company.employees[${index}].salary`);
    validateFiniteNumber(employee.targetSalary, `company.employees[${index}].targetSalary`);
    validatePositiveNumber(employee.targetSalary, `company.employees[${index}].targetSalary`);
    validatePercentage(employee.equityPercent, `company.employees[${index}].equityPercent`);
    validateNonNegativeNumber(employee.monthsTenure, `company.employees[${index}].monthsTenure`);
    validateSetMember(
      employee.managementLevel,
      MANAGEMENT_LEVELS,
      `Invalid snapshot: invalid management level: company.employees[${index}].managementLevel`,
    );
  });
  company.insurancePolicies.forEach((policy, index) => {
    validateSetMember(
      policy.type,
      INSURANCE_TYPES,
      `Invalid snapshot: invalid insurance type: company.insurancePolicies[${index}].type`,
    );
    validateNonNegativeNumber(policy.premium, `company.insurancePolicies[${index}].premium`);
    validateNonNegativeNumber(policy.coverage, `company.insurancePolicies[${index}].coverage`);
    validateNonNegativeNumber(policy.deductible, `company.insurancePolicies[${index}].deductible`);
    validateNonNegativeInteger(policy.startDate, `company.insurancePolicies[${index}].startDate`);
    if (typeof policy.active !== "boolean") {
      throw new Error(
        `Invalid snapshot: invalid boolean field: company.insurancePolicies[${index}].active`,
      );
    }
  });
  company.investments.forEach((investment, index) => {
    validateSetMember(
      investment.type,
      INVESTMENT_TYPES,
      `Invalid snapshot: invalid investment type: company.investments[${index}].type`,
    );
    validateNonNegativeNumber(investment.amount, `company.investments[${index}].amount`);
    validateNonNegativeInteger(investment.startDate, `company.investments[${index}].startDate`);
    validateFiniteNumber(investment.expectedReturn, `company.investments[${index}].expectedReturn`);
    validateNonNegativeNumber(investment.riskLevel, `company.investments[${index}].riskLevel`);
    validateNonNegativeNumber(
      investment.currentValue,
      `company.investments[${index}].currentValue`,
    );
  });

  const founder = state.founder;
  validateFiniteNumber(founder.wealth, "founder.wealth");
  validateFiniteNumber(founder.age, "founder.age");
  validateFiniteNumber(founder.health, "founder.health");
  if (!founder.personalLife || typeof founder.personalLife !== "object") {
    throw new Error("Invalid snapshot: missing personal life");
  }
  if (!Array.isArray(founder.personalLife.cars)) {
    throw new Error("Invalid snapshot: missing car list");
  }
  if (!Array.isArray(founder.personalLife.children)) {
    throw new Error("Invalid snapshot: missing child list");
  }
  validatePersonalLife(founder.personalLife);

  const society = state.society;
  validateSetMember(
    society.cyclePhase,
    MACRO_CYCLE_PHASES,
    "Invalid snapshot: invalid macro cycle phase: society.cyclePhase",
  );
  validateFiniteNumber(society.unemploymentRate, "society.unemploymentRate");
  validateNonNegativeInteger(society.legalCaseCount, "society.legalCaseCount");
  validateNonNegativeInteger(society.policySupportCount, "society.policySupportCount");
  validateNonNegativeInteger(society.specialEventCount, "society.specialEventCount");
}

function validateFiniteNumber(value: unknown, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid snapshot: invalid numeric field: ${fieldName}`);
  }
}

function validateNonNegativeNumber(value: unknown, fieldName: string): void {
  if (!Number.isFinite(value) || (value as number) < 0) {
    throw new Error(`Invalid snapshot: invalid non-negative numeric field: ${fieldName}`);
  }
}

function validateNonNegativeInteger(value: unknown, fieldName: string): void {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`Invalid snapshot: invalid non-negative integer field: ${fieldName}`);
  }
}

function validatePositiveNumber(value: unknown, fieldName: string): void {
  if (!Number.isFinite(value) || (value as number) <= 0) {
    throw new Error(`Invalid snapshot: invalid positive numeric field: ${fieldName}`);
  }
}

function validatePercentage(value: unknown, fieldName: string): void {
  if (!Number.isFinite(value) || (value as number) < 0 || (value as number) > 1) {
    throw new Error(`Invalid snapshot: invalid percentage field: ${fieldName}`);
  }
}

function validateScore(value: unknown, fieldName: string): void {
  if (!Number.isFinite(value) || (value as number) < 0 || (value as number) > 10) {
    throw new Error(`Invalid snapshot: invalid score field: ${fieldName}`);
  }
}

function validateOptionalString(value: unknown, fieldName: string): void {
  if (value !== undefined) {
    validateNonEmptyString(value, fieldName);
  }
}

function validateOptionalFiniteNumber(value: unknown, fieldName: string): void {
  if (value !== undefined) {
    validateFiniteNumber(value, fieldName);
  }
}

function validateStringList(value: unknown, fieldName: string): void {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`Invalid snapshot: invalid string list field: ${fieldName}`);
  }
  if (value.length === 0 || value.some((entry) => !entry.trim())) {
    throw new Error(`Invalid snapshot: invalid non-empty string list field: ${fieldName}`);
  }
}

function validateGovernanceMetrics(metrics: unknown): void {
  if (!metrics || typeof metrics !== "object") {
    throw new Error("Invalid snapshot: missing governance metrics");
  }
  const values = metrics as {
    shareholderSatisfaction?: unknown;
    disclosureCompliance?: unknown;
    regulatoryCompliance?: unknown;
    overallScore?: unknown;
  };
  validatePercentage(
    values.shareholderSatisfaction,
    "company.governanceMetrics.shareholderSatisfaction",
  );
  validatePercentage(values.disclosureCompliance, "company.governanceMetrics.disclosureCompliance");
  validatePercentage(values.regulatoryCompliance, "company.governanceMetrics.regulatoryCompliance");
  validatePercentage(values.overallScore, "company.governanceMetrics.overallScore");
}

function validateGameEvent(event: unknown, index: number): void {
  if (!event || typeof event !== "object") {
    throw new Error(`Invalid snapshot: invalid event record: events[${index}]`);
  }
  const values = event as { type?: unknown; day?: unknown; category?: unknown; severity?: unknown };
  validateSetMember(
    values.type,
    EVENT_TYPES,
    `Invalid snapshot: invalid event type: events[${index}].type`,
  );
  validateNonNegativeInteger(values.day, `events[${index}].day`);
  validateSetMember(
    values.category,
    EVENT_CATEGORIES,
    `Invalid snapshot: invalid event category: events[${index}].category`,
  );
  validateSetMember(
    values.severity,
    EVENT_SEVERITIES,
    `Invalid snapshot: invalid event severity: events[${index}].severity`,
  );
  validateGameEventPayload(values, index);
  const payload = values as GameEventPayload;
  if (values.category !== getGameEventCategory(payload)) {
    throw new Error(`Invalid snapshot: mismatched event category: events[${index}].category`);
  }
  if (values.severity !== getGameEventSeverity(payload)) {
    throw new Error(`Invalid snapshot: mismatched event severity: events[${index}].severity`);
  }
}

function validateGameEventPayload(
  event: { type?: unknown } & Record<string, unknown>,
  index: number,
): void {
  const field = (name: string) => `events[${index}].${name}`;
  switch (event.type) {
    case "initial_choice":
      validateNonEmptyString(event.choiceId, field("choiceId"));
      validateNonEmptyString(event.choiceLabel, field("choiceLabel"));
      return;
    case "employee_hired":
      validateCompanyRole(event.role, field("role"));
      validateNonNegativeNumber(event.salary, field("salary"));
      return;
    case "payroll_paid":
      validateNonNegativeNumber(event.amount, field("amount"));
      return;
    case "employee_salary_adjusted":
      validateCompanyRole(event.role, field("role"));
      validateNonNegativeNumber(event.previousSalary, field("previousSalary"));
      validateNonNegativeNumber(event.salary, field("salary"));
      return;
    case "employee_terminated":
      validateCompanyRole(event.role, field("role"));
      validateNonNegativeNumber(event.severance, field("severance"));
      return;
    case "employees_resigned":
      validateNonNegativeInteger(event.count, field("count"));
      return;
    case "employee_promoted":
      validateCompanyRole(event.role, field("role"));
      validateSetMember(
        event.managementLevel,
        MANAGEMENT_LEVELS,
        `Invalid snapshot: invalid management level: ${field("managementLevel")}`,
      );
      return;
    case "society_event":
      validateSetMember(
        event.eventType,
        SOCIETY_EVENT_KINDS,
        `Invalid snapshot: invalid society event type: ${field("eventType")}`,
      );
      validateFiniteNumber(event.cashDelta, field("cashDelta"));
      validateFiniteNumber(event.reputationDelta, field("reputationDelta"));
      validateOptionalFiniteNumber(event.marketSentimentDelta, field("marketSentimentDelta"));
      return;
    case "special_event":
      validateSetMember(
        event.eventType,
        SPECIAL_EVENT_KINDS,
        `Invalid snapshot: invalid special event type: ${field("eventType")}`,
      );
      validateFiniteNumber(event.cashDelta, field("cashDelta"));
      validateOptionalFiniteNumber(event.reputationDelta, field("reputationDelta"));
      validateFiniteNumber(event.marketSentimentDelta, field("marketSentimentDelta"));
      validateFiniteNumber(event.unemploymentDelta, field("unemploymentDelta"));
      return;
    case "culture_changed":
      validateSetMember(
        event.culture,
        COMPANY_CULTURES,
        `Invalid snapshot: invalid company culture: ${field("culture")}`,
      );
      return;
    case "listed_market_value":
      validateNonNegativeNumber(event.value, field("value"));
      return;
    case "policy_support_ineligible":
      return;
    case "policy_support_granted":
      validateNonNegativeNumber(event.cashDelta, field("cashDelta"));
      return;
    case "court_case_resolved":
      validateSetMember(
        event.caseType,
        COURT_CASE_KINDS,
        `Invalid snapshot: invalid court case type: ${field("caseType")}`,
      );
      validatePositiveNumber(event.caseSeverity, field("caseSeverity"));
      validateNonNegativeNumber(event.penalty, field("penalty"));
      return;
    case "bank_loan_approved":
      validatePositiveNumber(event.amount, field("amount"));
      return;
    case "ipo_prepared":
      validateNonNegativeNumber(event.listedMarketValue, field("listedMarketValue"));
      return;
    case "hiring_failed":
    case "candidate_skipped":
    case "ai_hire_failed":
      validateCompanyRole(event.role, field("role"));
      validateOptionalString(event.reason, field("reason"));
      return;
    case "ai_hire_succeeded":
      validateCompanyRole(event.role, field("role"));
      validateNonNegativeNumber(event.salary, field("salary"));
      return;
    case "insurance_purchased":
      validateSetMember(
        event.insuranceType,
        INSURANCE_TYPES,
        `Invalid snapshot: invalid insurance type: ${field("insuranceType")}`,
      );
      validateNonNegativeNumber(event.premium, field("premium"));
      validateNonNegativeNumber(event.coverage, field("coverage"));
      return;
    case "insurance_claim_paid":
      validateNonEmptyString(event.policyId, field("policyId"));
      validateNonNegativeNumber(event.payout, field("payout"));
      validateNonNegativeNumber(event.damageAmount, field("damageAmount"));
      return;
    case "investment_made":
      validateSetMember(
        event.investmentType,
        INVESTMENT_TYPES,
        `Invalid snapshot: invalid investment type: ${field("investmentType")}`,
      );
      validateNonNegativeNumber(event.amount, field("amount"));
      validateFiniteNumber(event.expectedReturn, field("expectedReturn"));
      return;
    case "investment_return":
      validateNonEmptyString(event.investmentId, field("investmentId"));
      validateFiniteNumber(event.returnAmount, field("returnAmount"));
      validateNonNegativeNumber(event.currentValue, field("currentValue"));
      return;
    case "investment_sold":
      validateNonEmptyString(event.investmentId, field("investmentId"));
      validateSetMember(
        event.investmentType,
        INVESTMENT_TYPES,
        `Invalid snapshot: invalid investment type: ${field("investmentType")}`,
      );
      validateNonNegativeNumber(event.saleAmount, field("saleAmount"));
      validateFiniteNumber(event.gain, field("gain"));
      return;
    case "governance_penalty":
      validateNonEmptyString(event.reason, field("reason"));
      validatePercentage(event.severityLevel, field("severityLevel"));
      validateNonNegativeNumber(event.penalty, field("penalty"));
      return;
    case "delisting_warning":
      validateSetMember(
        event.riskLevel,
        DELISTING_RISK_LEVELS,
        `Invalid snapshot: invalid delisting risk level: ${field("riskLevel")}`,
      );
      validateStringList(event.reasons, field("reasons"));
      return;
    case "car_purchased":
      validateNonEmptyString(event.carId, field("carId"));
      validateNonEmptyString(event.brand, field("brand"));
      validatePositiveNumber(event.value, field("value"));
      return;
    case "car_upgraded":
      validateNonEmptyString(event.carId, field("carId"));
      validateNonEmptyString(event.brand, field("brand"));
      validatePositiveNumber(event.newValue, field("newValue"));
      return;
    case "marriage":
      validateNonEmptyString(event.spouseName, field("spouseName"));
      return;
    case "child_born":
      validateNonEmptyString(event.childId, field("childId"));
      validateNonEmptyString(event.childName, field("childName"));
      return;
    case "divorce":
      validateNonEmptyString(event.spouseName, field("spouseName"));
      validateNonNegativeNumber(event.wealthLoss, field("wealthLoss"));
      return;
    case "game_over":
      validateSetMember(
        event.reason,
        GAME_OVER_REASONS,
        `Invalid snapshot: invalid game over reason: ${field("reason")}`,
      );
      return;
  }
}

function validateCompanyRole(value: unknown, fieldName: string): void {
  validateSetMember(value, COMPANY_ROLES, `Invalid snapshot: invalid company role: ${fieldName}`);
}

function validateCandidateBackground(value: unknown, fieldName: string): void {
  if (!value || typeof value !== "object") {
    throw new Error(`Invalid snapshot: missing candidate background: ${fieldName}`);
  }
  const background = value as {
    educationTier?: unknown;
    major?: unknown;
    industryExperienceYears?: unknown;
  };
  validateSetMember(
    background.educationTier,
    EDUCATION_TIERS,
    `Invalid snapshot: invalid education tier: ${fieldName}.educationTier`,
  );
  validateSetMember(
    background.major,
    CANDIDATE_MAJORS,
    `Invalid snapshot: invalid candidate major: ${fieldName}.major`,
  );
  validateNonNegativeInteger(
    background.industryExperienceYears,
    `${fieldName}.industryExperienceYears`,
  );
}

function validatePersonalLife(personalLife: GameState["founder"]["personalLife"]): void {
  validateScore(personalLife.happiness, "founder.personalLife.happiness");

  personalLife.cars.forEach((car, index) => {
    validateNonEmptyString(car.id, `founder.personalLife.cars[${index}].id`);
    validateNonEmptyString(car.brand, `founder.personalLife.cars[${index}].brand`);
    validateNonNegativeNumber(car.value, `founder.personalLife.cars[${index}].value`);
    validateNonNegativeNumber(
      car.maintenanceCost,
      `founder.personalLife.cars[${index}].maintenanceCost`,
    );
    validateNonNegativeInteger(
      car.purchaseDate,
      `founder.personalLife.cars[${index}].purchaseDate`,
    );
  });

  const marriage = personalLife.marriage;
  if (marriage !== undefined) {
    validateNonEmptyString(marriage.spouseName, "founder.personalLife.marriage.spouseName");
    validateNonNegativeInteger(marriage.marriageDate, "founder.personalLife.marriage.marriageDate");
    validateScore(marriage.happiness, "founder.personalLife.marriage.happiness");
    validatePercentage(marriage.divorceRisk, "founder.personalLife.marriage.divorceRisk");
  }

  personalLife.children.forEach((child, index) => {
    validateNonEmptyString(child.id, `founder.personalLife.children[${index}].id`);
    validateNonEmptyString(child.name, `founder.personalLife.children[${index}].name`);
    validateNonNegativeInteger(
      child.birthDate,
      `founder.personalLife.children[${index}].birthDate`,
    );
    validateNonNegativeNumber(
      child.educationCost,
      `founder.personalLife.children[${index}].educationCost`,
    );
    validateScore(child.happiness, `founder.personalLife.children[${index}].happiness`);
  });
}

function validateNonEmptyString(value: unknown, fieldName: string): void {
  if (typeof value !== "string") {
    throw new Error(`Invalid snapshot: invalid string field: ${fieldName}`);
  }
  if (!value.trim()) {
    throw new Error(`Invalid snapshot: invalid non-empty string field: ${fieldName}`);
  }
}

function validateSetMember(value: unknown, allowedValues: Set<string>, message: string): void {
  if (typeof value !== "string" || !allowedValues.has(value)) {
    throw new Error(message);
  }
}
