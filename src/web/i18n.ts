import type {
  CandidateMajor,
  CompanyCulture,
  CompanyRole,
  EducationTier,
  EmployeePersonalityType,
  GameEvent,
  GameEventCategory,
  GameEventSeverity,
  MacroCyclePhase,
  ManagementLevel,
} from "../sim/types";
import { resolvePersonalityLabel } from "../sim/culture-fit";
import type { WebStage } from "./screen";

export type WebLanguage = "zh-CN" | "en";

export interface WebLanguageOption {
  id: WebLanguage;
  label: string;
  selected: boolean;
}

export interface WebScreenCopy {
  cityMapAria: string;
  founderDesk: string;
  age: string;
  health: string;
  wealth: string;
  staffDesk: string;
  employees: string;
  totalMonthlyPayroll: string;
  averageEmployeeSalary: string;
  employeeRoster: string;
  salary: string;
  tenure: string;
  raise: string;
  terminate: string;
  cultureStrategy: string;
  current: string;
  pressure: string;
  morale: string;
  reputation: string;
  resignationRisk: string;
  switchCulture: string;
  recruitmentDesk: string;
  financeDesk: string;
  target: string;
  minimum: string;
  type: string;
  background: string;
  runway: string;
  cash: string;
  debt: string;
  burn: string;
  source: string;
  value: string;
  sentiment: string;
  ipoRequirements: string;
  loanPrefix: string;
  perMonthSuffix: string;
  languageToggleAria: string;
  eventFilterAria: string;
}

interface LanguageText {
  languageLabel: string;
  startupSubtitle: string;
  operatingSubtitle: string;
  startupEvent: string;
  copy: WebScreenCopy;
  stageLabels: Record<WebStage, string>;
  statusBadges: Record<string, string>;
  initialChoices: Record<string, string>;
  abilities: Record<string, string>;
  companyBonuses: Record<"cash" | "reputation", string>;
  hudLabels: Record<string, string>;
  mapZones: Record<string, string>;
  actionLabels: Record<string, string>;
  roles: Record<CompanyRole, string>;
  seniorities: Record<string, string>;
  personalities: Record<EmployeePersonalityType, string>;
  educationTiers: Record<EducationTier, string>;
  majors: Record<CandidateMajor, string>;
  cultures: Record<CompanyCulture, string>;
  managementLevels: Record<ManagementLevel, string>;
  cyclePhases: Record<MacroCyclePhase, string>;
  financeRequirements: Record<string, string>;
  valuationSources: Record<"analyst-estimate" | "listed-market", string>;
  ipoStatuses: Record<"listed" | "ready" | "unmet", string>;
  eventCategories: Record<GameEventCategory, string>;
  eventSeverities: Record<GameEventSeverity, string>;
  eventAllLabel: string;
  offerSuffix: string;
  nextCandidate: string;
  monthsSuffix: string;
  yearsIndustry: (years: number) => string;
  gameOverTitle: string;
  gameOverReasons: Record<string, string>;
  gameOverScoreBreakdownLabels: Record<string, string>;
  gameOverSummaryLabels: Record<string, string>;
  playAgainLabel: string;
  leaderboardTitle: string;
  leaderboardHeaders: Record<string, string>;
  viewLeaderboardLabel: string;
  noLeaderboardEntries: string;
}

export const DEFAULT_WEB_LANGUAGE: WebLanguage = "zh-CN";

const TEXT: Record<WebLanguage, LanguageText> = {
  "zh-CN": {
    languageLabel: "简体中文",
    startupSubtitle: "选择创始人画像，设置公司的第一批公司能力。",
    operatingSubtitle: "从城市地图管理现金、团队、政策与市场压力。",
    startupEvent: "选择一个创始人背景开始游戏。",
    copy: {
      cityMapAria: "城市地图",
      founderDesk: "创始人能力",
      age: "年龄",
      health: "健康",
      wealth: "身价",
      staffDesk: "人员配比",
      employees: "员工",
      totalMonthlyPayroll: "月薪总额",
      averageEmployeeSalary: "平均工资",
      employeeRoster: "员工明细",
      salary: "工资",
      tenure: "任期",
      raise: "加薪",
      terminate: "解雇",
      cultureStrategy: "文化策略",
      current: "当前",
      pressure: "压力",
      morale: "士气",
      reputation: "声誉",
      resignationRisk: "离职风险",
      switchCulture: "切换",
      recruitmentDesk: "招聘台",
      financeDesk: "财务台",
      target: "目标",
      minimum: "底线",
      type: "类型",
      background: "背景",
      runway: "跑道",
      cash: "现金",
      debt: "负债",
      burn: "消耗",
      source: "来源",
      value: "价值",
      sentiment: "情绪",
      ipoRequirements: "IPO 条件",
      loanPrefix: "贷款",
      perMonthSuffix: "/月",
      languageToggleAria: "语言",
      eventFilterAria: "事件筛选",
    },
    stageLabels: {
      startup: "创业准备",
      operating: "经营中",
      "game-over": "游戏结束",
      leaderboard: "排行榜",
    },
    statusBadges: {
      startup: "创业准备",
      operating: "经营中",
      bankruptcy: "破产",
      retirement: "退休",
      death: "创始人去世",
    },
    initialChoices: {
      "technical-founder": "技术型创始人",
      "network-founder": "人脉型创始人",
      "resilient-founder": "抗压型创始人",
    },
    abilities: {
      technical: "技术",
      experience: "经验",
      stressTolerance: "抗压",
      communication: "沟通",
      eq: "情商",
      iq: "智商",
    },
    companyBonuses: {
      cash: "现金",
      reputation: "知名度",
    },
    hudLabels: {
      cash: "现金",
      valuation: "估值",
      score: "得分",
      headcount: "人数",
      culture: "文化",
      morale: "士气",
      reputation: "知名度",
      pressure: "压力",
      cycle: "周期",
    },
    mapZones: {
      company: "公司",
      bank: "银行",
      exchange: "交易所",
      "labor-market": "劳动力市场",
      court: "法院",
      "policy-office": "政策办公室",
    },
    actionLabels: {
      "advance-30-days": "推进 30 天",
      "recruit-candidate": "招聘候选人",
      "request-bank-loan": "申请银行贷款",
      "request-policy-support": "申请政策支持",
      "prepare-ipo": "准备 IPO",
      "change-culture": "切换公司文化",
      "terminate-employee": "解雇员工",
      "raise-employee-salary": "员工加薪",
      "toggle-ai-hiring": "切换 AI 招聘",
      "run-ai-hiring-cycle": "运行 AI 招聘周期",
      "purchase-insurance": "购买保险",
      "file-insurance-claim": "提交保险理赔",
      "make-investment": "进行投资",
      "sell-investment": "出售投资",
      "buy-car": "购买汽车",
      "upgrade-car": "升级汽车",
      "get-married": "结婚",
      "have-child": "生子",
    },
    roles: {
      engineer: "工程师",
      product: "产品",
      sales: "销售",
      finance: "财务",
      hr: "人力",
    },
    seniorities: {
      junior: "初级",
      mid: "中级",
      senior: "高级",
    },
    personalities: {
      ambitious: "进取型",
      steady: "稳健型",
      collaborative: "协作型",
      independent: "独立型",
    },
    educationTiers: {
      elite: "顶尖院校",
      strong: "强校",
      standard: "普通院校",
      vocational: "职业院校",
    },
    majors: {
      "computer-science": "计算机科学",
      engineering: "工程",
      business: "商业",
      finance: "金融",
      design: "设计",
      operations: "运营",
    },
    cultures: {
      wolf: "狼性文化",
      "laissez-faire": "无为而治",
      adaptive: "适应型文化",
      striver: "奋斗精神",
    },
    managementLevels: {
      individual: "个人贡献者",
      middle: "中层",
      executive: "高管",
    },
    cyclePhases: {
      recovery: "复苏",
      prosperity: "繁荣",
      recession: "衰退",
      depression: "萧条",
    },
    financeRequirements: {
      "annual-revenue": "年收入",
      reputation: "知名度",
      headcount: "人数",
      "operational-capability": "运营能力",
    },
    valuationSources: {
      "analyst-estimate": "分析师估值",
      "listed-market": "公开市场",
    },
    ipoStatuses: {
      listed: "已上市公司",
      ready: "IPO 已就绪",
      unmet: "IPO 条件不足",
    },
    eventCategories: {
      founder: "创始人",
      people: "人员",
      finance: "金融",
      market: "市场",
      society: "社会",
      legal: "法律",
      operations: "运营",
    },
    eventSeverities: {
      info: "信息",
      positive: "正向",
      warning: "警告",
      critical: "危急",
    },
    eventAllLabel: "全部",
    offerSuffix: "报价",
    nextCandidate: "下一位候选人",
    monthsSuffix: "个月",
    yearsIndustry: (years) => `${years}年行业经验`,
    gameOverTitle: "游戏结束",
    gameOverReasons: {
      bankruptcy: "破产",
      retirement: "退休",
      death: "创始人去世",
    },
    gameOverScoreBreakdownLabels: {
      daysPlayed: "经营天数",
      companyValuation: "公司估值",
      playerWealth: "创始人身价",
    },
    gameOverSummaryLabels: {
      reason: "结束原因",
      scoreBreakdown: "得分明细",
      summary: "经营总结",
      daysSurvived: "存活天数",
      finalHeadcount: "最终人数",
      culture: "公司文化",
    },
    playAgainLabel: "再来一局",
    leaderboardTitle: "排行榜",
    leaderboardHeaders: {
      rank: "排名",
      score: "得分",
      daysPlayed: "经营天数",
      companyValuation: "公司估值",
      playerWealth: "创始人身价",
      gameOverReason: "结束原因",
      date: "日期",
    },
    viewLeaderboardLabel: "查看排行榜",
    noLeaderboardEntries: "暂无记录",
  },
  en: {
    languageLabel: "English",
    startupSubtitle: "Choose a founder profile to set the first company abilities.",
    operatingSubtitle: "Manage cash, people, policy, and market pressure from the city map.",
    startupEvent: "Choose a founder background to start.",
    copy: {
      cityMapAria: "City map",
      founderDesk: "Founder Abilities",
      age: "Age",
      health: "Health",
      wealth: "Net Worth",
      staffDesk: "Staff Mix",
      employees: "Employees",
      totalMonthlyPayroll: "Monthly Payroll",
      averageEmployeeSalary: "Avg Salary",
      employeeRoster: "Employee Roster",
      salary: "Salary",
      tenure: "Tenure",
      raise: "Raise",
      terminate: "Terminate",
      cultureStrategy: "Culture Strategy",
      current: "Current",
      pressure: "Pressure",
      morale: "Morale",
      reputation: "Reputation",
      resignationRisk: "Resignation Risk",
      switchCulture: "Switch",
      recruitmentDesk: "Recruitment Desk",
      financeDesk: "Finance Desk",
      target: "Target",
      minimum: "Minimum",
      type: "Type",
      background: "Background",
      runway: "Runway",
      cash: "Cash",
      debt: "Debt",
      burn: "Burn",
      source: "Source",
      value: "Value",
      sentiment: "Sentiment",
      ipoRequirements: "IPO Requirements",
      loanPrefix: "Loan",
      perMonthSuffix: "/mo",
      languageToggleAria: "Language",
      eventFilterAria: "Event filters",
    },
    stageLabels: {
      startup: "startup",
      operating: "operating",
      "game-over": "game-over",
      leaderboard: "leaderboard",
    },
    statusBadges: {
      startup: "startup",
      operating: "operating",
      bankruptcy: "bankruptcy",
      retirement: "retirement",
      death: "death",
    },
    initialChoices: {
      "technical-founder": "Technical Founder",
      "network-founder": "Network Founder",
      "resilient-founder": "Resilient Founder",
    },
    abilities: {
      technical: "Technical",
      experience: "Experience",
      stressTolerance: "Stress",
      communication: "Communication",
      eq: "EQ",
      iq: "IQ",
    },
    companyBonuses: {
      cash: "cash",
      reputation: "reputation",
    },
    hudLabels: {
      cash: "Cash",
      valuation: "Valuation",
      score: "Score",
      headcount: "Headcount",
      culture: "Culture",
      morale: "Morale",
      reputation: "Reputation",
      pressure: "Pressure",
      cycle: "Cycle",
    },
    mapZones: {
      company: "Company",
      bank: "Bank",
      exchange: "Exchange",
      "labor-market": "Labor Market",
      court: "Court",
      "policy-office": "Policy Office",
    },
    actionLabels: {
      "advance-30-days": "Advance 30 Days",
      "recruit-candidate": "Recruit Candidate",
      "request-bank-loan": "Request Bank Loan",
      "request-policy-support": "Request Policy Support",
      "prepare-ipo": "Prepare IPO",
      "change-culture": "Change Culture",
      "terminate-employee": "Terminate Employee",
      "raise-employee-salary": "Raise Salary",
      "toggle-ai-hiring": "Toggle AI Hiring",
      "run-ai-hiring-cycle": "Run AI Hiring Cycle",
      "purchase-insurance": "Purchase Insurance",
      "file-insurance-claim": "File Insurance Claim",
      "make-investment": "Make Investment",
      "sell-investment": "Sell Investment",
      "buy-car": "Buy Car",
      "upgrade-car": "Upgrade Car",
      "get-married": "Get Married",
      "have-child": "Have Child",
    },
    roles: {
      engineer: "engineer",
      product: "product",
      sales: "sales",
      finance: "finance",
      hr: "hr",
    },
    seniorities: {
      junior: "junior",
      mid: "mid",
      senior: "senior",
    },
    personalities: {
      ambitious: "ambitious",
      steady: "steady",
      collaborative: "collaborative",
      independent: "independent",
    },
    educationTiers: {
      elite: "elite",
      strong: "strong",
      standard: "standard",
      vocational: "vocational",
    },
    majors: {
      "computer-science": "computer-science",
      engineering: "engineering",
      business: "business",
      finance: "finance",
      design: "design",
      operations: "operations",
    },
    cultures: {
      wolf: "wolf",
      "laissez-faire": "laissez-faire",
      adaptive: "adaptive",
      striver: "striver",
    },
    managementLevels: {
      individual: "individual",
      middle: "middle",
      executive: "executive",
    },
    cyclePhases: {
      recovery: "recovery",
      prosperity: "prosperity",
      recession: "recession",
      depression: "depression",
    },
    financeRequirements: {
      "annual-revenue": "Annual revenue",
      reputation: "Reputation",
      headcount: "Headcount",
      "operational-capability": "Operational capability",
    },
    valuationSources: {
      "analyst-estimate": "Analyst estimate",
      "listed-market": "Public market",
    },
    ipoStatuses: {
      listed: "Listed company",
      ready: "IPO ready",
      unmet: "IPO requirements unmet",
    },
    eventCategories: {
      founder: "FOUNDER",
      people: "PEOPLE",
      finance: "FINANCE",
      market: "MARKET",
      society: "SOCIETY",
      legal: "LEGAL",
      operations: "OPS",
    },
    eventSeverities: {
      info: "INFO",
      positive: "POSITIVE",
      warning: "WARNING",
      critical: "CRITICAL",
    },
    eventAllLabel: "ALL",
    offerSuffix: "offer",
    nextCandidate: "Next candidate",
    monthsSuffix: "months",
    yearsIndustry: (years) => `${years}y industry`,
    gameOverTitle: "GAME OVER",
    gameOverReasons: {
      bankruptcy: "Bankruptcy",
      retirement: "Retirement",
      death: "Founder Death",
    },
    gameOverScoreBreakdownLabels: {
      daysPlayed: "Days Played",
      companyValuation: "Company Valuation",
      playerWealth: "Player Wealth",
    },
    gameOverSummaryLabels: {
      reason: "Cause",
      scoreBreakdown: "Score Breakdown",
      summary: "Summary",
      daysSurvived: "Days Survived",
      finalHeadcount: "Final Headcount",
      culture: "Company Culture",
    },
    playAgainLabel: "Play Again",
    leaderboardTitle: "LEADERBOARD",
    leaderboardHeaders: {
      rank: "Rank",
      score: "Score",
      daysPlayed: "Days",
      companyValuation: "Valuation",
      playerWealth: "Wealth",
      gameOverReason: "Cause",
      date: "Date",
    },
    viewLeaderboardLabel: "View Leaderboard",
    noLeaderboardEntries: "No entries yet",
  },
};

export function resolveWebLanguage(language?: string): WebLanguage {
  return language === "en" || language === "zh-CN" ? language : DEFAULT_WEB_LANGUAGE;
}

export function createLanguageOptions(selected: WebLanguage): WebLanguageOption[] {
  return (Object.keys(TEXT) as WebLanguage[]).map((id) => ({
    id,
    label: TEXT[id].languageLabel,
    selected: id === selected,
  }));
}

export function getWebCopy(language: WebLanguage): WebScreenCopy {
  return TEXT[language].copy;
}

export function getStageLabel(stage: WebStage, language: WebLanguage): string {
  return TEXT[language].stageLabels[stage];
}

export function getStartupSubtitle(language: WebLanguage): string {
  return TEXT[language].startupSubtitle;
}

export function getOperatingSubtitle(language: WebLanguage): string {
  return TEXT[language].operatingSubtitle;
}

export function getStartupEvent(language: WebLanguage): string {
  return TEXT[language].startupEvent;
}

export function translateInitialChoiceLabel(
  id: string,
  fallback: string,
  language: WebLanguage,
): string {
  return TEXT[language].initialChoices[id] ?? fallback;
}

export function translateAbilityLabel(key: string, language: WebLanguage): string {
  return TEXT[language].abilities[key] ?? key;
}

export function translateCompanyBonusLabel(
  key: "cash" | "reputation",
  language: WebLanguage,
): string {
  return TEXT[language].companyBonuses[key];
}

export function translateHudLabel(id: string, fallback: string, language: WebLanguage): string {
  return TEXT[language].hudLabels[id] ?? fallback;
}

export function translateMapZoneLabel(id: string, fallback: string, language: WebLanguage): string {
  return TEXT[language].mapZones[id] ?? fallback;
}

export function translateActionLabel(id: string, fallback: string, language: WebLanguage): string {
  return TEXT[language].actionLabels[id] ?? fallback;
}

export function translateRole(role: CompanyRole, language: WebLanguage): string {
  return TEXT[language].roles[role];
}

export function translateSeniority(seniority: string, language: WebLanguage): string {
  return TEXT[language].seniorities[seniority] ?? seniority;
}

export function translatePersonality(personality: number, language: WebLanguage): string {
  const label = resolvePersonalityLabel(personality) as EmployeePersonalityType;
  return TEXT[language].personalities[label];
}

export function translateEducationTier(tier: EducationTier, language: WebLanguage): string {
  return TEXT[language].educationTiers[tier];
}

export function translateMajor(major: CandidateMajor, language: WebLanguage): string {
  return TEXT[language].majors[major];
}

export function translateCulture(culture: CompanyCulture, language: WebLanguage): string {
  return TEXT[language].cultures[culture];
}

export function translateCyclePhase(phase: MacroCyclePhase, language: WebLanguage): string {
  return TEXT[language].cyclePhases[phase];
}

export function translateManagementLevel(level: ManagementLevel, language: WebLanguage): string {
  return TEXT[language].managementLevels[level];
}

export function translateFinanceRequirementLabel(
  id: string,
  fallback: string,
  language: WebLanguage,
): string {
  return TEXT[language].financeRequirements[id] ?? fallback;
}

export function translateValuationSource(
  source: "analyst-estimate" | "listed-market",
  language: WebLanguage,
): string {
  return TEXT[language].valuationSources[source];
}

export function translateIpoStatus(
  status: "listed" | "ready" | "unmet",
  language: WebLanguage,
): string {
  return TEXT[language].ipoStatuses[status];
}

export function translateEventCategory(category: GameEventCategory, language: WebLanguage): string {
  return TEXT[language].eventCategories[category];
}

export function translateEventSeverity(severity: GameEventSeverity, language: WebLanguage): string {
  return TEXT[language].eventSeverities[severity];
}

export function getEventAllLabel(language: WebLanguage): string {
  return TEXT[language].eventAllLabel;
}

export function formatOfferLabel(amount: string, language: WebLanguage): string {
  return language === "zh-CN"
    ? `${TEXT[language].offerSuffix} ${amount}`
    : `${amount} ${TEXT[language].offerSuffix}`;
}

export function getNextCandidateLabel(language: WebLanguage): string {
  return TEXT[language].nextCandidate;
}

export function formatRunwayMonths(months: number, language: WebLanguage): string {
  return `${Number(months.toFixed(1)).toLocaleString("en-US")} ${TEXT[language].monthsSuffix}`;
}

export function formatIndustryExperience(years: number, language: WebLanguage): string {
  return TEXT[language].yearsIndustry(years);
}

export function translateStatusBadge(status: string, language: WebLanguage): string {
  return TEXT[language].statusBadges[status] ?? status;
}

export function translateGameOverTitle(language: WebLanguage): string {
  return TEXT[language].gameOverTitle;
}

export function translateGameOverReasonLabel(reason: string, language: WebLanguage): string {
  return TEXT[language].gameOverReasons[reason] ?? reason;
}

export function translateGameOverScoreBreakdownLabel(key: string, language: WebLanguage): string {
  return TEXT[language].gameOverScoreBreakdownLabels[key] ?? key;
}

export function translateGameOverSummaryLabel(key: string, language: WebLanguage): string {
  return TEXT[language].gameOverSummaryLabels[key] ?? key;
}

export function translatePlayAgainLabel(language: WebLanguage): string {
  return TEXT[language].playAgainLabel;
}

export function translateLeaderboardTitle(language: WebLanguage): string {
  return TEXT[language].leaderboardTitle;
}

export function translateLeaderboardHeader(key: string, language: WebLanguage): string {
  return TEXT[language].leaderboardHeaders[key] ?? key;
}

export function translateViewLeaderboardLabel(language: WebLanguage): string {
  return TEXT[language].viewLeaderboardLabel;
}

export function translateNoLeaderboardEntries(language: WebLanguage): string {
  return TEXT[language].noLeaderboardEntries;
}

export function translateDisplayValue(value: string, language: WebLanguage): string {
  if (language === "en") {
    return value;
  }

  if (isCompanyCulture(value)) {
    return translateCulture(value, language);
  }

  if (isMacroCyclePhase(value)) {
    return translateCyclePhase(value, language);
  }

  return value;
}

export function translateEvent(event: GameEvent, language: WebLanguage): string {
  if (language === "en") {
    return formatEnglishEvent(event);
  }

  switch (event.type) {
    case "initial_choice":
      return `初始选择：${translateInitialChoiceLabel(
        event.choiceId,
        event.choiceLabel,
        language,
      )}`;
    case "bank_loan_approved":
      return `银行贷款获批：${formatCurrency(event.amount)}`;
    case "policy_support_granted":
      return `政策支持获批：${formatCurrency(event.cashDelta)}`;
    case "policy_support_ineligible":
      return "暂不符合政策支持条件";
    case "ipo_prepared":
      return `IPO 已准备：${formatCurrency(event.listedMarketValue)}`;
    case "candidate_skipped":
      return `已跳过候选人：${translateRole(event.role, language)}`;
    case "employee_hired":
      return `已招聘${translateRole(event.role, language)}：${formatCurrency(event.salary)}`;
    case "employee_salary_adjusted":
      return `已给${translateRole(event.role, language)}加薪：${formatCurrency(
        event.previousSalary,
      )} -> ${formatCurrency(event.salary)}`;
    case "hiring_failed":
      return `招聘失败：${translateRole(event.role, language)}`;
    case "payroll_paid":
      return `已发薪资：${formatCurrency(event.amount)}`;
    case "employee_terminated":
      return `已解雇${translateRole(event.role, language)}：赔偿 ${formatCurrency(
        event.severance,
      )}`;
    case "employees_resigned":
      return `员工离职：${event.count} 人`;
    case "employee_promoted":
      return `晋升${translateRole(event.role, language)}为${translateManagementLevel(
        event.managementLevel,
        language,
      )}管理`;
    case "culture_changed":
      return `公司文化切换为：${translateCulture(event.culture, language)}`;
    case "listed_market_value":
      return `上市市值：${formatCurrency(event.value)}`;
    case "game_over":
      return `游戏结束：${translateStatusBadge(event.reason, language)}`;
    case "court_case_resolved":
      return `法院案件已处理：${translateCourtCaseType(event.caseType)}，严重度 ${
        event.caseSeverity
      }，罚款 ${formatCurrency(event.penalty)}`;
    case "society_event":
      return `${translateEventType(event.eventType)}：现金 ${formatCurrency(
        event.cashDelta,
      )}，知名度 ${event.reputationDelta}`;
    case "special_event":
      return `特殊事件：${translateEventType(event.eventType)}，现金 ${formatCurrency(
        event.cashDelta,
      )}，市场情绪 ${event.marketSentimentDelta}`;
    case "car_purchased":
      return `购买汽车：${event.brand}，${formatCurrency(event.value)}`;
    case "car_upgraded":
      return `升级汽车：${event.brand}，${formatCurrency(event.newValue)}`;
    case "marriage":
      return `结婚：${event.spouseName}`;
    case "child_born":
      return `孩子出生：${event.childName}`;
    case "divorce":
      return `离婚：${event.spouseName}，损失 ${formatCurrency(event.wealthLoss)}`;
    case "ai_hire_succeeded":
      return `AI 招聘成功：${translateRole(event.role, language)}，薪资 ${formatCurrency(event.salary)}`;
    case "ai_hire_failed":
      return `AI 招聘失败：${translateRole(event.role, language)}`;
    case "insurance_purchased":
      return `购买保险：${event.insuranceType}，保费 ${formatCurrency(event.premium)}`;
    case "insurance_claim_paid":
      return `保险理赔：赔付 ${formatCurrency(event.payout)}`;
    case "investment_made":
      return `投资：${event.investmentType}，金额 ${formatCurrency(event.amount)}`;
    case "investment_return":
      return `投资收益：${formatCurrency(event.returnAmount)}`;
    case "investment_sold":
      return `投资出售：${formatCurrency(event.saleAmount)}，收益 ${formatCurrency(event.gain)}`;
    case "governance_penalty":
      return `治理处罚：${event.reason}，罚款 ${formatCurrency(event.penalty)}`;
    case "delisting_warning":
      return `退市警告：${event.reasons.join("，")}`;
  }
}

export function translateEventEntry(entry: string, language: WebLanguage): string {
  if (language === "en") {
    return entry;
  }

  const bankLoan = entry.match(/^Bank loan approved: (\d+)/);
  if (bankLoan) {
    return `银行贷款获批：${formatCurrency(Number(bankLoan[1]))}`;
  }

  const policyGrant = entry.match(/^Policy support granted(?:: (\d+))?$/);
  if (policyGrant) {
    return policyGrant[1]
      ? `政策支持获批：${formatCurrency(Number(policyGrant[1]))}`
      : "政策支持获批";
  }

  if (entry === "Policy support ineligible") {
    return "暂不符合政策支持条件";
  }

  const ipo = entry.match(/^IPO prepared: (\d+)/);
  if (ipo) {
    return `IPO 已准备：${formatCurrency(Number(ipo[1]))}`;
  }

  if (entry === "IPO unavailable") {
    return "暂不可准备 IPO";
  }

  const skipped = entry.match(/^Candidate skipped: ([\w-]+)/);
  if (skipped) {
    return `已跳过候选人：${translateRoleFromString(skipped[1], language)}`;
  }

  const hired = entry.match(/^Hired ([\w-]+)(?:: | for ¥)([\d,]+)$/);
  if (hired) {
    return `已招聘${translateRoleFromString(hired[1], language)}：${formatCurrency(
      Number(hired[2].replaceAll(",", "")),
    )}`;
  }

  const hiringFailed = entry.match(/^Hiring failed: ([\w-]+)(?: \((.+)\))?$/);
  if (hiringFailed) {
    return `招聘失败：${translateRoleFromString(hiringFailed[1], language)}`;
  }

  const payroll = entry.match(/^Payroll paid: (\d+)/);
  if (payroll) {
    return `已发薪资：${formatCurrency(Number(payroll[1]))}`;
  }

  const resigned = entry.match(/^Resigned employees: (\d+)/);
  if (resigned) {
    return `员工离职：${resigned[1]} 人`;
  }

  const promoted = entry.match(/^Promoted ([\w-]+) to ([\w-]+) management$/);
  if (promoted) {
    return `晋升${translateRoleFromString(promoted[1], language)}为${translateManagementLevelFromString(
      promoted[2],
      language,
    )}管理`;
  }

  const culture = entry.match(/^Culture changed: ([\w-]+)$/);
  if (culture) {
    return `公司文化切换为：${translateCultureFromString(culture[1], language)}`;
  }

  const listedValue = entry.match(/^Listed market value: (\d+)/);
  if (listedValue) {
    return `上市市值：${formatCurrency(Number(listedValue[1]))}`;
  }

  const gameOver = entry.match(/^Game over: ([\w-]+)/);
  if (gameOver) {
    return `游戏结束：${translateStatusBadge(gameOver[1], language)}`;
  }

  const court = entry.match(/^Court case resolved: ([\w-]+): severity (\d+), penalty (\d+)/);
  if (court) {
    const caseType = court[1] === "company_violation" ? "公司违规" : "员工违规";
    return `法院案件已处理：${caseType}，严重度 ${court[2]}，罚款 ${formatCurrency(Number(court[3]))}`;
  }

  const society = entry.match(/^([\w-]+): cash (-?\d+), reputation (-?\d+)/);
  if (society) {
    return `${translateEventType(society[1])}：现金 ${formatCurrency(
      Number(society[2]),
    )}，知名度 ${society[3]}`;
  }

  const special = entry.match(/^Special event: ([\w-]+) cash (-?\d+), sentiment (-?[\d.]+)/);
  if (special) {
    return `特殊事件：${translateEventType(special[1])}，现金 ${formatCurrency(
      Number(special[2]),
    )}，市场情绪 ${special[3]}`;
  }

  return entry;
}

function formatEnglishEvent(event: GameEvent): string {
  switch (event.type) {
    case "initial_choice":
      return `Initial choice: ${event.choiceLabel}`;
    case "bank_loan_approved":
      return `Bank loan approved: ${event.amount}`;
    case "policy_support_granted":
      return `Policy support granted: ${event.cashDelta}`;
    case "policy_support_ineligible":
      return "Policy support ineligible";
    case "ipo_prepared":
      return `IPO prepared: ${Math.round(event.listedMarketValue)}`;
    case "candidate_skipped":
      return `Candidate skipped: ${event.role}`;
    case "employee_hired":
      return `Hired ${event.role}: ${event.salary}`;
    case "employee_salary_adjusted":
      return `Raised ${event.role} salary: ${formatCurrency(
        event.previousSalary,
      )} -> ${formatCurrency(event.salary)}`;
    case "hiring_failed":
      return event.reason
        ? `Hiring failed: ${event.role} (${event.reason})`
        : `Hiring failed: ${event.role}`;
    case "payroll_paid":
      return `Payroll paid: ${event.amount}`;
    case "employee_terminated":
      return `Terminated ${event.role}: severance ${formatCurrency(event.severance)}`;
    case "employees_resigned":
      return `Resigned employees: ${event.count}`;
    case "employee_promoted":
      return `Promoted ${event.role} to ${event.managementLevel} management`;
    case "culture_changed":
      return `Culture changed: ${event.culture}`;
    case "listed_market_value":
      return `Listed market value: ${Math.round(event.value)}`;
    case "game_over":
      return `Game over: ${event.reason}`;
    case "court_case_resolved":
      return `Court case resolved: ${event.caseType}: severity ${event.caseSeverity}, penalty ${event.penalty}`;
    case "society_event":
      return `${event.eventType}: cash ${event.cashDelta}, reputation ${event.reputationDelta}`;
    case "special_event":
      return `Special event: ${event.eventType} cash ${event.cashDelta}, sentiment ${event.marketSentimentDelta}`;
    case "car_purchased":
      return `Purchased car: ${event.brand} for ${formatCurrency(event.value)}`;
    case "car_upgraded":
      return `Upgraded car: ${event.brand} to ${formatCurrency(event.newValue)}`;
    case "marriage":
      return `Married: ${event.spouseName}`;
    case "child_born":
      return `Child born: ${event.childName}`;
    case "divorce":
      return `Divorce: ${event.spouseName}, lost ${formatCurrency(event.wealthLoss)}`;
    case "ai_hire_succeeded":
      return `AI hired ${event.role}: ${event.salary}`;
    case "ai_hire_failed":
      return `AI hiring failed: ${event.role}`;
    case "insurance_purchased":
      return `Insurance purchased: ${event.insuranceType}, premium ${formatCurrency(event.premium)}`;
    case "insurance_claim_paid":
      return `Insurance claim paid: ${formatCurrency(event.payout)}`;
    case "investment_made":
      return `Investment made: ${event.investmentType}, ${formatCurrency(event.amount)}`;
    case "investment_return":
      return `Investment return: ${formatCurrency(event.returnAmount)}`;
    case "investment_sold":
      return `Investment sold: ${formatCurrency(event.saleAmount)}, gain ${formatCurrency(event.gain)}`;
    case "governance_penalty":
      return `Governance penalty: ${event.reason}, ${formatCurrency(event.penalty)}`;
    case "delisting_warning":
      return `Delisting warning: ${event.reasons.join(", ")}`;
  }
}

function translateRoleFromString(role: string, language: WebLanguage): string {
  return isCompanyRole(role) ? translateRole(role, language) : role;
}

function translateCultureFromString(culture: string, language: WebLanguage): string {
  return isCompanyCulture(culture) ? translateCulture(culture, language) : culture;
}

function translateManagementLevelFromString(level: string, language: WebLanguage): string {
  return isManagementLevel(level) ? translateManagementLevel(level, language) : level;
}

function translateEventType(type: string): string {
  const labels: Record<string, string> = {
    policy_support: "政策支持",
    legal_incident: "法律事件",
    market_shock: "市场冲击",
    labor_market_shift: "劳动力市场变化",
    financial_crisis: "金融危机",
    supply_chain_shock: "供应链冲击",
    geopolitical_tension: "地缘风险",
  };

  return labels[type] ?? type;
}

function translateCourtCaseType(type: string): string {
  return type === "company_violation" ? "公司违规" : "员工违规";
}

function isCompanyRole(value: string): value is CompanyRole {
  return (
    value === "engineer" ||
    value === "product" ||
    value === "sales" ||
    value === "finance" ||
    value === "hr"
  );
}

function isCompanyCulture(value: string): value is CompanyCulture {
  return (
    value === "wolf" || value === "laissez-faire" || value === "adaptive" || value === "striver"
  );
}

function isMacroCyclePhase(value: string): value is MacroCyclePhase {
  return (
    value === "recovery" ||
    value === "prosperity" ||
    value === "recession" ||
    value === "depression"
  );
}

function isManagementLevel(value: string): value is ManagementLevel {
  return value === "individual" || value === "middle" || value === "executive";
}

function formatCurrency(value: number): string {
  return `¥${Math.round(value).toLocaleString("en-US")}`;
}
