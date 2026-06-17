export type GameOverReason = "bankruptcy" | "retirement" | "death";
export type CompanyCulture = "wolf" | "laissez-faire" | "adaptive" | "striver";
export type CompanyRole = "engineer" | "product" | "sales" | "finance" | "hr";
export type CompanyRoleCounts = Record<CompanyRole, number>;
export type MacroCyclePhase = "recovery" | "prosperity" | "recession" | "depression";
export type CompanyIndustry = "technology" | "advanced-manufacturing" | "biotech" | "services";
export type ManagementLevel = "individual" | "middle" | "executive";
export type EmployeePersonality = "ambitious" | "steady" | "collaborative" | "independent";
export type EducationTier = "elite" | "strong" | "standard" | "vocational";
export type CandidateMajor =
  | "computer-science"
  | "engineering"
  | "business"
  | "finance"
  | "design"
  | "operations";
export type SocietyEventKind =
  | "policy_support"
  | "legal_incident"
  | "market_shock"
  | "labor_market_shift";
export type SpecialEventKind =
  | "financial_crisis"
  | "supply_chain_shock"
  | "geopolitical_tension";
export type CourtCaseKind = "company_violation" | "employee_violation";
export type GameEventCategory =
  | "founder"
  | "people"
  | "finance"
  | "market"
  | "society"
  | "legal"
  | "operations";
export type GameEventSeverity = "info" | "positive" | "warning" | "critical";

export type GameEventPayload =
  | { type: "initial_choice"; choiceId: string; choiceLabel: string }
  | { type: "employee_hired"; role: CompanyRole; salary: number }
  | { type: "payroll_paid"; amount: number }
  | {
      type: "employee_salary_adjusted";
      role: CompanyRole;
      previousSalary: number;
      salary: number;
    }
  | { type: "employee_terminated"; role: CompanyRole; severance: number }
  | { type: "employees_resigned"; count: number }
  | { type: "employee_promoted"; role: CompanyRole; managementLevel: ManagementLevel }
  | {
      type: "society_event";
      eventType: SocietyEventKind;
      cashDelta: number;
      reputationDelta: number;
      marketSentimentDelta?: number;
    }
  | {
      type: "special_event";
      eventType: SpecialEventKind;
      cashDelta: number;
      reputationDelta?: number;
      marketSentimentDelta: number;
      unemploymentDelta: number;
    }
  | { type: "culture_changed"; culture: CompanyCulture }
  | { type: "listed_market_value"; value: number }
  | { type: "policy_support_ineligible" }
  | { type: "policy_support_granted"; cashDelta: number }
  | {
      type: "court_case_resolved";
      caseType: CourtCaseKind;
      caseSeverity: number;
      penalty: number;
    }
  | { type: "bank_loan_approved"; amount: number }
  | { type: "ipo_prepared"; listedMarketValue: number }
  | { type: "hiring_failed"; role: CompanyRole; reason?: string }
  | { type: "candidate_skipped"; role: CompanyRole }
  | { type: "game_over"; reason: GameOverReason };

export type GameEvent = GameEventPayload & {
  day: number;
  category: GameEventCategory;
  severity: GameEventSeverity;
};

export type GameEventCategoryCounts = Record<GameEventCategory, number>;
export type GameEventSeverityCounts = Record<GameEventSeverity, number>;

export interface GameEventSummary {
  total: number;
  byCategory: GameEventCategoryCounts;
  bySeverity: GameEventSeverityCounts;
}

export interface AbilitySet {
  technical: number;
  experience: number;
  stressTolerance: number;
  communication: number;
  eq: number;
  iq: number;
}

export interface FounderState {
  age: number;
  health: number;
  wealth: number;
  abilities: AbilitySet;
}

export interface CandidateBackground {
  educationTier: EducationTier;
  major: CandidateMajor;
  industryExperienceYears: number;
}

export interface EmployeeState extends AbilitySet {
  id: string;
  role: CompanyRole;
  salary: number;
  targetSalary: number;
  equityPercent: number;
  background: CandidateBackground;
  personality: EmployeePersonality;
  monthsTenure: number;
  managementLevel: ManagementLevel;
}

export interface CompanyState {
  cash: number;
  debt: number;
  valuation: number;
  annualRevenue: number;
  industry: CompanyIndustry;
  monthlyBurn: number;
  reputation: number;
  morale: number;
  culture: CompanyCulture;
  culturePressure: number;
  headcount: number;
  employees: EmployeeState[];
  isPublic: boolean;
  listedMarketValue?: number;
}

export interface SocietyState {
  cyclePhase: MacroCyclePhase;
  unemploymentRate: number;
  legalCaseCount: number;
  policySupportCount: number;
  specialEventCount: number;
}

export interface GameState {
  seed: number;
  day: number;
  founder: FounderState;
  company: CompanyState;
  marketSentiment: number;
  society: SocietyState;
  events: GameEvent[];
  eventLog: string[];
}

export interface InitialChoice {
  id: string;
  label: string;
  abilityBonus: Partial<AbilitySet>;
  companyBonus: {
    cash: number;
    reputation: number;
  };
}
