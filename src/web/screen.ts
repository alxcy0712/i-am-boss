import {
  createSessionViewModel,
  getSessionActions,
  previewRecruitmentCandidate,
  type GameSession,
  type SessionAction,
} from "../game/session";
import { PROBABILITY_CONFIG } from "../config/probabilities";
import { getLeaderboard } from "../sim/leaderboard";
import { calculateResignationRisk } from "../sim/resignation";
import { calculateScoreBreakdown } from "../sim/scoring";
import type { GameViewModel } from "../ui/view-model";
import type {
  AbilitySet,
  CompanyCulture,
  CompanyRole,
  GameEventCategory,
  GameEventSeverity,
} from "../sim/types";
import {
  createLanguageOptions,
  formatIndustryExperience,
  formatOfferLabel,
  formatRunwayMonths,
  getEventAllLabel,
  getNextCandidateLabel,
  getOperatingSubtitle,
  getStageLabel,
  getStartupEvent,
  getStartupSubtitle,
  getWebCopy,
  resolveWebLanguage,
  translateAbilityLabel,
  translateActionLabel,
  translateCompanyBonusLabel,
  translateDisplayValue,
  translateEducationTier,
  translateEvent,
  translateEventCategory,
  translateEventEntry,
  translateEventSeverity,
  translateFinanceRequirementLabel,
  translateGameOverReasonLabel,
  translateGameOverScoreBreakdownLabel,
  translateGameOverTitle,
  translateGameOverSummaryLabel,
  translateHudLabel,
  translateInitialChoiceLabel,
  translateIpoStatus,
  translateLeaderboardHeader,
  translateLeaderboardTitle,
  translateMajor,
  translateMapZoneLabel,
  translateManagementLevel,
  translateNoLeaderboardEntries,
  translatePersonality,
  translatePlayAgainLabel,
  translateRole,
  translateSeniority,
  translateStatusBadge,
  translateValuationSource,
  translateViewLeaderboardLabel,
  type WebLanguage,
  type WebLanguageOption,
  type WebScreenCopy,
} from "./i18n";

export type WebStage = "startup" | "operating" | "game-over" | "leaderboard";
export type WebEventCategoryFilter = GameEventCategory | "all";

export interface WebChoiceCard {
  id: string;
  label: string;
  description: string;
}

export interface WebStatTile {
  id: string;
  label: string;
  value: string;
}

export interface WebFounderMetric {
  label: string;
  value: string;
}

export interface WebFounderPanel {
  title: string;
  age: WebFounderMetric;
  health: WebFounderMetric;
  wealth: WebFounderMetric;
  abilityRows: WebRecruitmentAbilityRow[];
}

export interface WebStaffRoleRow {
  id: CompanyRole;
  label: string;
  count: number;
  share: string;
}

export interface WebStaffEmployeeRow {
  id: string;
  role: string;
  salary: string;
  targetSalary: string;
  personality: string;
  tenure: string;
  managementLevel: string;
  resignationRisk: string;
  resignationRiskLevel: string;
  raiseSalary: string;
  raiseSalaryAmount: number;
  raiseActionLabel: string;
  terminateActionLabel: string;
}

export interface WebStaffPanel {
  title: string;
  rosterLabel: string;
  employeeCount: WebFounderMetric;
  totalMonthlyPayroll: WebFounderMetric;
  averageEmployeeSalary: WebFounderMetric;
  roleRows: WebStaffRoleRow[];
  employeeRows: WebStaffEmployeeRow[];
}

export interface WebMapZone {
  id: string;
  label: string;
  enabled: boolean;
}

export type WebMapTileKind = "district" | "road" | "plaza";

export interface WebMapTile {
  id: string;
  kind: WebMapTileKind;
  label: string;
  enabled: boolean;
  gridArea: string;
  variant: string;
  zoneId?: string;
}

export interface WebRecruitmentAbilityRow {
  label: string;
  value: string;
}

export interface WebRecruitmentOffer {
  id: string;
  label: string;
  actionId: "recruit-candidate" | "skip-candidate";
  salary?: number;
  equityPercent?: number;
}

export interface WebRecruitmentPanel {
  role: string;
  seniority: string;
  personality: string;
  background: string;
  targetSalary: string;
  minimumSalary: string;
  abilityRows: WebRecruitmentAbilityRow[];
  offerOptions: WebRecruitmentOffer[];
}

export interface WebFinanceRequirement {
  id: "annual-revenue" | "reputation" | "headcount" | "operational-capability";
  label: string;
  current: string;
  required: string;
  met: boolean;
}

export interface WebMarketBoard {
  basis: "analyst-estimate" | "listed-market";
  sourceLabel: string;
  value: string;
  sentiment: string;
}

export interface WebFinancePanel {
  runway: string;
  cash: string;
  debt: string;
  monthlyBurn: string;
  valuationBasis: "analyst-estimate" | "listed-market";
  valuationBasisLabel: string;
  marketBoard: WebMarketBoard;
  loanOption: {
    amount: string;
    actionId: "request-bank-loan";
    eligible: boolean;
  };
  ipoStatus: {
    label: string;
    ready: boolean;
    completed: boolean;
    actionId: "prepare-ipo";
  };
  ipoRequirements: WebFinanceRequirement[];
}

export interface WebCultureOption {
  id: CompanyCulture;
  label: string;
  selected: boolean;
  pressure: string;
  moraleDelta: string;
  reputationDelta: string;
  projectedAverageResignationRisk: string;
  actionLabel: string;
}

export interface WebCulturePanel {
  title: string;
  currentLabel: string;
  pressureLabel: string;
  moraleLabel: string;
  reputationLabel: string;
  resignationRiskLabel: string;
  options: WebCultureOption[];
}

export interface WebEventFeedItem {
  text: string;
  day: number;
  type: string;
  category: GameEventCategory;
  severity: GameEventSeverity;
  categoryLabel: string;
  severityLabel: string;
}

export interface WebEventFilterOption {
  id: WebEventCategoryFilter;
  label: string;
  count: number;
  selected: boolean;
}

export interface WebGameOverScoreRow {
  label: string;
  value: string;
  multiplier: string;
  points: string;
}

export interface WebGameOverSummaryRow {
  label: string;
  value: string;
}

export interface WebGameOverScreen {
  title: string;
  reasonLabel: string;
  reasonValue: string;
  finalScore: string;
  scoreBreakdownTitle: string;
  scoreRows: WebGameOverScoreRow[];
  summaryTitle: string;
  summaryRows: WebGameOverSummaryRow[];
  playAgainLabel: string;
  viewLeaderboardLabel: string;
}

export interface WebLeaderboardRow {
  rank: string;
  score: string;
  daysPlayed: string;
  companyValuation: string;
  playerWealth: string;
  gameOverReason: string;
  date: string;
  isCurrentGame: boolean;
}

export interface WebLeaderboardScreen {
  title: string;
  headers: Record<string, string>;
  rows: WebLeaderboardRow[];
  emptyMessage: string;
  backLabel: string;
}

export interface WebScreenModel {
  language: WebLanguage;
  languageOptions: WebLanguageOption[];
  copy: WebScreenCopy;
  title: string;
  subtitle: string;
  stage: WebStage;
  stageLabel: string;
  statusBadge: string;
  initialChoices: WebChoiceCard[];
  statTiles: WebStatTile[];
  mapZones: WebMapZone[];
  mapTiles: WebMapTile[];
  founder?: WebFounderPanel;
  staff?: WebStaffPanel;
  culture?: WebCulturePanel;
  recruitment?: WebRecruitmentPanel;
  finance?: WebFinancePanel;
  actions: SessionAction[];
  eventFilterOptions: WebEventFilterOption[];
  eventItems: WebEventFeedItem[];
  eventFeed: string[];
  gameOverScreen?: WebGameOverScreen;
  leaderboardScreen?: WebLeaderboardScreen;
}

export interface WebScreenOptions {
  language?: WebLanguage;
  eventCategoryFilter?: WebEventCategoryFilter;
  showLeaderboard?: boolean;
  currentLeaderboardId?: string;
}

const HUD_ORDER: Array<keyof GameViewModel["hud"]> = [
  "cash",
  "valuation",
  "score",
  "headcount",
  "culture",
  "morale",
  "reputation",
  "pressure",
  "cycle",
];

const ABILITY_ORDER: Array<keyof AbilitySet> = [
  "technical",
  "experience",
  "stressTolerance",
  "communication",
  "eq",
  "iq",
];

const ROLE_ORDER: CompanyRole[] = ["engineer", "product", "sales", "finance", "hr"];
const CULTURE_ORDER: CompanyCulture[] = ["wolf", "laissez-faire", "adaptive", "striver"];

const INFRASTRUCTURE_TILES: WebMapTile[] = [
  {
    id: "north-avenue",
    kind: "road",
    label: "North Avenue",
    enabled: false,
    gridArea: "3 / 1 / 4 / 7",
    variant: "road-horizontal",
  },
  {
    id: "market-street",
    kind: "road",
    label: "Market Street",
    enabled: false,
    gridArea: "1 / 3 / 6 / 4",
    variant: "road-vertical",
  },
  {
    id: "central-plaza",
    kind: "plaza",
    label: "Central Plaza",
    enabled: false,
    gridArea: "3 / 3 / 4 / 4",
    variant: "plaza",
  },
];

const DISTRICT_TILE_LAYOUT: Record<string, Pick<WebMapTile, "gridArea" | "variant">> = {
  company: { gridArea: "1 / 1 / 3 / 3", variant: "company-tower" },
  bank: { gridArea: "1 / 4 / 3 / 6", variant: "bank-block" },
  exchange: { gridArea: "1 / 6 / 3 / 7", variant: "exchange-board" },
  "labor-market": { gridArea: "4 / 1 / 6 / 3", variant: "labor-hall" },
  court: { gridArea: "4 / 4 / 6 / 5", variant: "court-house" },
  "policy-office": { gridArea: "4 / 5 / 6 / 7", variant: "policy-office" },
};

const EVENT_CATEGORY_ORDER: GameEventCategory[] = [
  "founder",
  "people",
  "finance",
  "market",
  "society",
  "legal",
  "operations",
];

export function createWebScreenModel(
  session: GameSession,
  options: WebScreenOptions = {},
): WebScreenModel {
  const language = resolveWebLanguage(options.language);
  const copy = getWebCopy(language);
  const hasStarted = Boolean(session.selectedInitialChoiceId && session.summary);
  const viewModel = hasStarted ? createSessionViewModel(session) : undefined;
  const gameOverReason = session.gameOverReason ?? session.summary?.gameOverReason;
  const stage: WebStage = options.showLeaderboard
    ? "leaderboard"
    : gameOverReason
      ? "game-over"
      : hasStarted
        ? "operating"
        : "startup";
  const allEventItems = viewModel ? createEventItems(viewModel, language) : [];
  const eventCategoryFilter = resolveEventCategoryFilter(
    options.eventCategoryFilter,
    allEventItems,
  );
  const eventItems = filterEventItems(allEventItems, eventCategoryFilter);
  const eventFilterOptions =
    allEventItems.length > 0
      ? createEventFilterOptions(allEventItems, eventCategoryFilter, language)
      : [];

  return {
    language,
    languageOptions: createLanguageOptions(language),
    copy,
    title: viewModel?.title ?? "我是老板 / I am boss",
    subtitle: hasStarted ? getOperatingSubtitle(language) : getStartupSubtitle(language),
    stage,
    stageLabel: getStageLabel(stage, language),
    statusBadge: translateStatusBadge(viewModel?.statusBadge ?? "startup", language),
    initialChoices: session.initialChoices.map((choice) => ({
      id: choice.id,
      label: translateInitialChoiceLabel(choice.id, choice.label, language),
      description: [
        formatAbilityBonus(choice.abilityBonus, language),
        `${translateCompanyBonusLabel("cash", language)} +¥${choice.companyBonus.cash.toLocaleString(
          "en-US",
        )}`,
        `${translateCompanyBonusLabel("reputation", language)} +${choice.companyBonus.reputation}`,
      ]
        .filter(Boolean)
        .join(" | "),
    })),
    statTiles: viewModel ? createStatTiles(viewModel, language) : [],
    mapZones:
      viewModel?.mapLocations.map((zone) => ({
        ...zone,
        label: translateMapZoneLabel(zone.id, zone.label, language),
      })) ?? [],
    mapTiles: viewModel ? createMapTiles(viewModel, language) : [],
    founder: viewModel ? createFounderPanel(viewModel, language, copy) : undefined,
    staff: viewModel ? createStaffPanel(viewModel, language, copy) : undefined,
    culture: viewModel ? createCulturePanel(viewModel, language, copy) : undefined,
    recruitment: viewModel ? createRecruitmentPanel(session, language) : undefined,
    finance: viewModel ? createFinancePanel(session, language) : undefined,
    actions: getSessionActions(session).map((action) => ({
      ...action,
      label: translateActionLabel(action.id, action.label, language),
    })),
    eventFilterOptions,
    eventItems,
    eventFeed: viewModel
      ? createEventFeed(viewModel, language, eventItems)
      : [getStartupEvent(language)],
    gameOverScreen:
      gameOverReason && session.summary
        ? createGameOverScreen(session.summary, gameOverReason, language)
        : undefined,
    leaderboardScreen: options.showLeaderboard
      ? createLeaderboardScreen(language, options.currentLeaderboardId)
      : undefined,
  };
}

function resolveEventCategoryFilter(
  requestedFilter: WebEventCategoryFilter | undefined,
  eventItems: WebEventFeedItem[],
): WebEventCategoryFilter {
  if (requestedFilter && requestedFilter !== "all") {
    return eventItems.some((item) => item.category === requestedFilter) ? requestedFilter : "all";
  }

  return "all";
}

function filterEventItems(
  eventItems: WebEventFeedItem[],
  eventCategoryFilter: WebEventCategoryFilter,
): WebEventFeedItem[] {
  if (eventCategoryFilter === "all") {
    return eventItems;
  }

  return eventItems.filter((item) => item.category === eventCategoryFilter);
}

function createEventFilterOptions(
  eventItems: WebEventFeedItem[],
  selectedFilter: WebEventCategoryFilter,
  language: WebLanguage,
): WebEventFilterOption[] {
  const counts = new Map<GameEventCategory, number>();
  for (const item of eventItems) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  const categoryCounts = EVENT_CATEGORY_ORDER.map((category) => ({
    category,
    count: counts.get(category) ?? 0,
  })).filter((entry) => entry.count > 0);

  return [
    {
      id: "all",
      label: getEventAllLabel(language),
      count: eventItems.length,
      selected: selectedFilter === "all",
    },
    ...categoryCounts.map((entry) => ({
      id: entry.category,
      label: translateEventCategory(entry.category, language),
      count: entry.count,
      selected: selectedFilter === entry.category,
    })),
  ];
}

function createEventFeed(
  viewModel: GameViewModel,
  language: WebLanguage,
  eventItems: WebEventFeedItem[],
): string[] {
  if (eventItems.length > 0) {
    return eventItems.map((item) => item.text);
  }

  if (viewModel.events.length > 0) {
    return viewModel.events.map((event) => translateEvent(event, language));
  }

  return viewModel.eventFeed.map((entry) => translateEventEntry(entry, language));
}

function createEventItems(viewModel: GameViewModel, language: WebLanguage): WebEventFeedItem[] {
  return viewModel.events
    .filter((event) => event.category && event.severity)
    .map((event) => ({
      text: translateEvent(event, language),
      day: event.day,
      type: event.type,
      category: event.category,
      severity: event.severity,
      categoryLabel: translateEventCategory(event.category, language),
      severityLabel: translateEventSeverity(event.severity, language),
    }));
}

function createStatTiles(viewModel: GameViewModel, language: WebLanguage): WebStatTile[] {
  return HUD_ORDER.map((id) => ({
    id,
    label: translateHudLabel(id, viewModel.hud[id].label, language),
    value: translateDisplayValue(viewModel.hud[id].value, language),
  }));
}

function createFounderPanel(
  viewModel: GameViewModel,
  language: WebLanguage,
  copy: WebScreenCopy,
): WebFounderPanel {
  return {
    title: copy.founderDesk,
    age: {
      label: copy.age,
      value: String(viewModel.founder.age),
    },
    health: {
      label: copy.health,
      value: `${Math.round(viewModel.founder.health)}/100`,
    },
    wealth: {
      label: copy.wealth,
      value: formatCurrency(viewModel.founder.wealth),
    },
    abilityRows: ABILITY_ORDER.map((ability) => ({
      label: translateAbilityLabel(ability, language),
      value: formatTenPoint(viewModel.founder.abilities[ability]),
    })),
  };
}

function createStaffPanel(
  viewModel: GameViewModel,
  language: WebLanguage,
  copy: WebScreenCopy,
): WebStaffPanel {
  const employeeCount = viewModel.staff.employeeCount;

  return {
    title: copy.staffDesk,
    rosterLabel: copy.employeeRoster,
    employeeCount: {
      label: copy.employees,
      value: String(employeeCount),
    },
    totalMonthlyPayroll: {
      label: copy.totalMonthlyPayroll,
      value: formatCurrency(viewModel.staff.totalMonthlyPayroll),
    },
    averageEmployeeSalary: {
      label: copy.averageEmployeeSalary,
      value: formatCurrency(viewModel.staff.averageEmployeeSalary),
    },
    roleRows: ROLE_ORDER.map((role) => {
      const count = viewModel.staff.roleCounts[role];
      const share = employeeCount > 0 ? `${Math.round((count / employeeCount) * 100)}%` : "0%";

      return {
        id: role,
        label: translateRole(role, language),
        count,
        share,
      };
    }),
    employeeRows: viewModel.staff.employees.map((employee) => {
      const raiseSalaryAmount = calculateRaiseSalary(employee.salary);

      return {
        id: employee.id,
        role: translateRole(employee.role, language),
        salary: formatCurrency(employee.salary),
        targetSalary: formatCurrency(employee.targetSalary),
        personality: translatePersonality(employee.personality, language),
        tenure: formatTenureMonths(employee.monthsTenure, language),
        managementLevel: translateManagementLevel(employee.managementLevel, language),
        resignationRisk: formatPercent(employee.resignationRisk),
        resignationRiskLevel: translateResignationRiskLevel(employee.resignationRisk, language),
        raiseSalary: formatCurrency(raiseSalaryAmount),
        raiseSalaryAmount,
        raiseActionLabel: copy.raise,
        terminateActionLabel: copy.terminate,
      };
    }),
  };
}

function createCulturePanel(
  viewModel: GameViewModel,
  language: WebLanguage,
  copy: WebScreenCopy,
): WebCulturePanel {
  const currentCulture = viewModel.hud.culture.value as CompanyCulture;

  return {
    title: copy.cultureStrategy,
    currentLabel: copy.current,
    pressureLabel: copy.pressure,
    moraleLabel: copy.morale,
    reputationLabel: copy.reputation,
    resignationRiskLabel: copy.resignationRisk,
    options: CULTURE_ORDER.map((culture) => {
      const selected = culture === currentCulture;
      return {
        id: culture,
        label: translateDisplayValue(culture, language),
        selected,
        pressure: formatTenPoint(
          PROBABILITY_CONFIG.companyCulture.culturePressureByCulture[culture],
        ),
        moraleDelta: formatSignedOneDecimal(
          PROBABILITY_CONFIG.companyCulture.moraleDeltaByCulture[culture],
        ),
        reputationDelta: formatSignedOneDecimal(
          PROBABILITY_CONFIG.companyCulture.reputationDeltaByCulture[culture],
        ),
        projectedAverageResignationRisk: formatPercent(
          calculateProjectedAverageResignationRisk(viewModel, culture),
        ),
        actionLabel: selected ? copy.current : copy.switchCulture,
      };
    }),
  };
}

function calculateProjectedAverageResignationRisk(
  viewModel: GameViewModel,
  culture: CompanyCulture,
): number {
  if (viewModel.staff.employees.length === 0) {
    return 0;
  }

  const projectedMorale = clampTenPoint(
    parseTenPoint(viewModel.hud.morale.value) +
      PROBABILITY_CONFIG.companyCulture.moraleDeltaByCulture[culture],
  );
  const culturePressure = PROBABILITY_CONFIG.companyCulture.culturePressureByCulture[culture];
  const totalRisk = viewModel.staff.employees.reduce((total, employee) => {
    return (
      total +
      calculateResignationRisk({
        salary: employee.salary,
        targetSalary: employee.targetSalary,
        stressTolerance: employee.abilities.stressTolerance,
        culturePressure,
        morale: projectedMorale,
        culture,
        personality: employee.personality,
      })
    );
  }, 0);

  return totalRisk / viewModel.staff.employees.length;
}

function formatAbilityBonus(
  abilityBonus: Record<string, number | undefined>,
  language: WebLanguage,
): string {
  return Object.entries(abilityBonus)
    .filter(([, value]) => value)
    .map(([key, value]) => `${translateAbilityLabel(key, language)} +${value}`)
    .join(", ");
}

function createMapTiles(viewModel: GameViewModel, language: WebLanguage): WebMapTile[] {
  return [
    ...INFRASTRUCTURE_TILES,
    ...viewModel.mapLocations.map((zone) => {
      const layout = DISTRICT_TILE_LAYOUT[zone.id] ?? {
        gridArea: "1 / 1 / 2 / 2",
        variant: "district",
      };

      return {
        id: `district-${zone.id}`,
        kind: "district" as const,
        label: translateMapZoneLabel(zone.id, zone.label, language),
        enabled: zone.enabled,
        gridArea: layout.gridArea,
        variant: layout.variant,
        zoneId: zone.id,
      };
    }),
  ];
}

function createRecruitmentPanel(session: GameSession, language: WebLanguage): WebRecruitmentPanel {
  const candidate = previewRecruitmentCandidate(session);
  const conservativeSalary = Math.round(candidate.targetSalary * 0.9);
  const marketSalary = Math.round(candidate.targetSalary * 0.96);

  return {
    role: translateRole(candidate.role, language),
    seniority: translateSeniority(candidate.seniority, language),
    personality: translatePersonality(candidate.personality, language),
    background: [
      translateEducationTier(candidate.background.educationTier, language),
      translateMajor(candidate.background.major, language),
      formatIndustryExperience(candidate.background.industryExperienceYears, language),
    ].join(" / "),
    targetSalary: formatCurrency(candidate.targetSalary),
    minimumSalary: formatCurrency(candidate.minimumSalary),
    abilityRows: [
      {
        label: translateAbilityLabel("technical", language),
        value: formatTenPoint(candidate.technical),
      },
      {
        label: translateAbilityLabel("experience", language),
        value:
          language === "zh-CN" ? `${candidate.experienceYears}年` : `${candidate.experienceYears}y`,
      },
      {
        label: translateAbilityLabel("stressTolerance", language),
        value: formatTenPoint(candidate.stressTolerance),
      },
      {
        label: translateAbilityLabel("communication", language),
        value: formatTenPoint(candidate.communication),
      },
      { label: translateAbilityLabel("eq", language), value: formatTenPoint(candidate.eq) },
      { label: translateAbilityLabel("iq", language), value: formatTenPoint(candidate.iq) },
    ],
    offerOptions: [
      {
        id: "offer-conservative",
        label: formatOfferLabel(formatCurrency(conservativeSalary), language),
        actionId: "recruit-candidate",
        salary: conservativeSalary,
        equityPercent: candidate.equityPercent,
      },
      {
        id: "offer-market",
        label: formatOfferLabel(formatCurrency(marketSalary), language),
        actionId: "recruit-candidate",
        salary: marketSalary,
        equityPercent: candidate.equityPercent,
      },
      {
        id: "offer-target",
        label: formatOfferLabel(formatCurrency(candidate.targetSalary), language),
        actionId: "recruit-candidate",
        salary: candidate.targetSalary,
        equityPercent: candidate.equityPercent,
      },
      {
        id: "next-candidate",
        label: getNextCandidateLabel(language),
        actionId: "skip-candidate",
      },
    ],
  };
}

function createFinancePanel(session: GameSession, language: WebLanguage): WebFinancePanel {
  if (!session.state) {
    throw new Error("Session state is required before creating finance panel");
  }

  const company = session.state.company;
  const financeConfig = PROBABILITY_CONFIG.finance;
  const valuationBasis = company.isPublic ? "listed-market" : "analyst-estimate";
  const runwayMonths = company.monthlyBurn > 0 ? company.cash / company.monthlyBurn : 0;
  const loanEligible =
    company.reputation >= financeConfig.minimumLoanReputation &&
    company.annualRevenue > company.monthlyBurn * 6;
  const ipoRequirements: WebFinanceRequirement[] = [
    {
      id: "annual-revenue",
      label: translateFinanceRequirementLabel("annual-revenue", "Annual revenue", language),
      current: formatCurrency(company.annualRevenue),
      required: formatCurrency(financeConfig.ipoRevenueThreshold),
      met: company.annualRevenue >= financeConfig.ipoRevenueThreshold,
    },
    {
      id: "reputation",
      label: translateFinanceRequirementLabel("reputation", "Reputation", language),
      current: formatTenPoint(company.reputation),
      required: formatTenPoint(financeConfig.ipoReputationThreshold),
      met: company.reputation >= financeConfig.ipoReputationThreshold,
    },
    {
      id: "headcount",
      label: translateFinanceRequirementLabel("headcount", "Headcount", language),
      current: String(company.headcount),
      required: String(financeConfig.ipoHeadcountThreshold),
      met: company.headcount >= financeConfig.ipoHeadcountThreshold,
    },
    {
      id: "operational-capability",
      label: translateFinanceRequirementLabel(
        "operational-capability",
        "Operational capability",
        language,
      ),
      current: formatTenPoint(company.operationalCapability),
      required: formatTenPoint(financeConfig.ipoOperationalCapabilityThreshold),
      met: company.operationalCapability >= financeConfig.ipoOperationalCapabilityThreshold,
    },
  ];
  const ipoReady = !company.isPublic && ipoRequirements.every((requirement) => requirement.met);

  return {
    runway: formatRunwayMonths(runwayMonths, language),
    cash: formatCurrency(company.cash),
    debt: formatCurrency(company.debt),
    monthlyBurn: formatCurrency(company.monthlyBurn),
    valuationBasis,
    valuationBasisLabel: translateValuationSource(valuationBasis, language),
    marketBoard: {
      basis: valuationBasis,
      sourceLabel: translateValuationSource(valuationBasis, language),
      value: formatCurrency(
        company.isPublic ? (company.listedMarketValue ?? company.valuation) : company.valuation,
      ),
      sentiment: formatMultiplier(session.state.marketSentiment),
    },
    loanOption: {
      amount: formatCurrency(80_000),
      actionId: "request-bank-loan",
      eligible: loanEligible,
    },
    ipoStatus: {
      label: translateIpoStatus(
        company.isPublic ? "listed" : ipoReady ? "ready" : "unmet",
        language,
      ),
      ready: ipoReady,
      completed: company.isPublic,
      actionId: "prepare-ipo",
    },
    ipoRequirements,
  };
}

function createGameOverScreen(
  summary: NonNullable<GameSession["summary"]>,
  reason: string,
  language: WebLanguage,
): WebGameOverScreen {
  const breakdown = calculateScoreBreakdown({
    daysPlayed: summary.daysPlayed,
    companyValuation: summary.companyValuation,
    playerWealth: summary.playerWealth,
  });

  return {
    title: translateGameOverTitle(language),
    reasonLabel: translateGameOverSummaryLabel("reason", language),
    reasonValue: translateGameOverReasonLabel(reason, language),
    finalScore: Math.round(summary.score).toLocaleString("en-US"),
    scoreBreakdownTitle: translateGameOverSummaryLabel("scoreBreakdown", language),
    scoreRows: [
      {
        label: translateGameOverScoreBreakdownLabel("daysPlayed", language),
        value: String(summary.daysPlayed),
        multiplier: "×1",
        points: Math.round(breakdown.daysPoints).toLocaleString("en-US"),
      },
      {
        label: translateGameOverScoreBreakdownLabel("companyValuation", language),
        value: formatCurrency(summary.companyValuation),
        multiplier: "×2",
        points: Math.round(breakdown.valuationPoints).toLocaleString("en-US"),
      },
      {
        label: translateGameOverScoreBreakdownLabel("playerWealth", language),
        value: formatCurrency(summary.playerWealth),
        multiplier: "×1",
        points: Math.round(breakdown.wealthPoints).toLocaleString("en-US"),
      },
    ],
    summaryTitle: translateGameOverSummaryLabel("summary", language),
    summaryRows: [
      {
        label: translateGameOverSummaryLabel("daysSurvived", language),
        value: String(summary.daysPlayed),
      },
      {
        label: translateGameOverSummaryLabel("finalHeadcount", language),
        value: String(summary.headcount),
      },
      {
        label: translateGameOverSummaryLabel("culture", language),
        value: translateDisplayValue(summary.companyCulture, language),
      },
    ],
    playAgainLabel: translatePlayAgainLabel(language),
    viewLeaderboardLabel: translateViewLeaderboardLabel(language),
  };
}

function createLeaderboardScreen(
  language: WebLanguage,
  currentGameId?: string,
): WebLeaderboardScreen {
  const entries = getLeaderboard(10);
  const headers: Record<string, string> = {
    rank: translateLeaderboardHeader("rank", language),
    score: translateLeaderboardHeader("score", language),
    daysPlayed: translateLeaderboardHeader("daysPlayed", language),
    companyValuation: translateLeaderboardHeader("companyValuation", language),
    playerWealth: translateLeaderboardHeader("playerWealth", language),
    gameOverReason: translateLeaderboardHeader("gameOverReason", language),
    date: translateLeaderboardHeader("date", language),
  };

  return {
    title: translateLeaderboardTitle(language),
    headers,
    rows: entries.map((entry) => ({
      rank: String(entry.rank),
      score: Math.round(entry.score).toLocaleString("en-US"),
      daysPlayed: String(entry.daysPlayed),
      companyValuation: formatCurrency(entry.companyValuation),
      playerWealth: formatCurrency(entry.playerWealth),
      gameOverReason: translateGameOverReasonLabel(entry.gameOverReason, language),
      date: entry.date.slice(0, 10),
      isCurrentGame: entry.id === currentGameId,
    })),
    emptyMessage: translateNoLeaderboardEntries(language),
    backLabel: language === "zh-CN" ? "返回" : "Back",
  };
}

function formatCurrency(value: number): string {
  return `¥${Math.round(value).toLocaleString("en-US")}`;
}

function formatTenPoint(value: number): string {
  return `${value}/10`;
}

function formatMultiplier(value: number): string {
  return `${value.toFixed(2)}x`;
}

function formatTenureMonths(months: number, language: WebLanguage): string {
  return language === "zh-CN" ? `${months}个月` : `${months}mo`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatSignedOneDecimal(value: number): string {
  const formatted = value.toFixed(1);
  return value >= 0 ? `+${formatted}` : formatted;
}

function parseTenPoint(value: string): number {
  return Number(value.split("/")[0]) || 0;
}

function clampTenPoint(value: number): number {
  return Math.min(10, Math.max(0, value));
}

function calculateRaiseSalary(salary: number): number {
  return Math.round(salary * (1 + PROBABILITY_CONFIG.employeeLifecycle.salaryRaiseRate));
}

function translateResignationRiskLevel(value: number, language: WebLanguage): string {
  if (value >= 0.55) {
    return language === "zh-CN" ? "高风险" : "High risk";
  }

  if (value >= 0.3) {
    return language === "zh-CN" ? "中风险" : "Medium risk";
  }

  return language === "zh-CN" ? "低风险" : "Low risk";
}
