export const PROBABILITY_CONFIG = {
  founder: {
    // Age at which the player can formally retire and end the run.
    retirementAge: 65,
    // Health floor for death-related game over.
    minimumHealth: 0,
    // Number of in-game days in one founder age year.
    daysPerAgeYear: 365,
    // Base health loss per month before culture and morale pressure.
    monthlyBaseHealthLoss: 0.08,
    // Health loss multiplier when culture pressure exceeds stress tolerance.
    culturePressureHealthWeight: 0.22,
    // Health loss multiplier when company morale is low.
    lowMoraleHealthWeight: 0.12,
  },
  hiring: {
    // Baseline chance before salary, equity, reputation, and communication effects.
    baseAcceptance: 0.32,
    // Maximum probability contribution when salary meets or exceeds target salary.
    salaryWeight: 0.36,
    // Maximum contribution from company reputation, scaled from 0 to 10.
    reputationWeight: 0.16,
    // Maximum contribution from equity percent, capped at 1%.
    equityWeight: 0.08,
    // Small contribution from candidate communication ability, scaled from 0 to 10.
    communicationWeight: 0.08,
  },
  cultureFit: {
    // Hiring acceptance contribution from a candidate personality matching company culture.
    hiringAcceptanceWeight: 0.1,
    // Resignation risk added when an employee personality clashes with company culture.
    resignationRiskWeight: 0.24,
    // Reference points on the 0-10 personality scale: 0=steady, 4=collaborative, 7=ambitious, 10=independent.
    personalityReferencePoints: [0, 4, 7, 10] as readonly number[],
    // Compatibility values at each reference point for each culture.
    compatibilityByCulture: {
      wolf: [0.45, 0.55, 1.0, 0.65] as readonly number[],
      "laissez-faire": [0.8, 0.65, 0.6, 1.0] as readonly number[],
      adaptive: [0.9, 1.0, 0.75, 0.8] as readonly number[],
      striver: [0.65, 0.75, 0.95, 0.6] as readonly number[],
    },
  },
  companyCulture: {
    // Cash cost of communicating and implementing a culture change.
    changeCost: 12_000,
    // Target pressure level after each company culture is adopted.
    culturePressureByCulture: {
      wolf: 9,
      "laissez-faire": 3,
      adaptive: 5,
      striver: 7,
    },
    // Immediate morale impact from changing to each culture.
    moraleDeltaByCulture: {
      wolf: -0.8,
      "laissez-faire": 0.5,
      adaptive: 0.3,
      striver: -0.2,
    },
    // Reputation impact from adopting each visible company ideal.
    reputationDeltaByCulture: {
      wolf: 0,
      "laissez-faire": -0.2,
      adaptive: 0.2,
      striver: 0.1,
    },
  },
  valuation: {
    // Base revenue multiple used by analyst-style private company estimates.
    privateRevenueMultiple: 2,
    // Profitability increases the private analyst multiple.
    profitMarginWeight: 8,
    // Reputation increases the private analyst multiple and financing credibility.
    reputationWeight: 2,
  },
  society: {
    // Daily chance of a market sentiment move from financial or macro conditions.
    dailyMarketShockChance: 0.04,
    // Daily chance of supportive policy improving the company's operating conditions.
    supportivePolicyChance: 0.02,
    // Daily chance of an abstract legal or compliance incident affecting cash.
    legalIncidentChance: 0.01,
  },
  specialEvents: {
    // Monthly chance of an unexpected abstract external event.
    monthlyChance: 0.08,
    // Selection weight for a financial crisis event.
    financialCrisisWeight: 0.4,
    // Selection weight for a supply chain shock event.
    supplyChainShockWeight: 0.35,
    // Selection weight for a geopolitical tension event.
    geopoliticalTensionWeight: 0.25,
    // Cash loss rate during a financial crisis.
    financialCrisisCashLossRate: 0.12,
    // Market sentiment drop during a financial crisis.
    financialCrisisSentimentDelta: -0.18,
    // Unemployment increase during a financial crisis.
    financialCrisisUnemploymentDelta: 0.035,
    // Monthly burn increase rate during a supply chain shock.
    supplyChainBurnIncreaseRate: 0.05,
    // Cash loss rate during a supply chain shock.
    supplyChainCashLossRate: 0.04,
    // Market sentiment drop during a supply chain shock.
    supplyChainSentimentDelta: -0.04,
    // Market sentiment drop during geopolitical tension.
    geopoliticalTensionSentimentDelta: -0.1,
    // Reputation loss during geopolitical tension.
    geopoliticalTensionReputationLoss: 1,
    // Unemployment increase during geopolitical tension.
    geopoliticalTensionUnemploymentDelta: 0.015,
  },
  staffing: {
    // Baseline monthly salary for each role before ability and seniority multipliers.
    baseMonthlySalaryByRole: {
      engineer: 12000,
      product: 11000,
      sales: 9500,
      finance: 10500,
      hr: 9000,
    },
    // Senior hires demand higher salary and usually arrive with stronger ability scores.
    senioritySalaryMultiplier: {
      junior: 0.75,
      mid: 1,
      senior: 1.65,
    },
  },
  candidateBackground: {
    // Education tier distribution for generated candidates.
    educationTierWeights: {
      elite: 0.12,
      strong: 0.24,
      standard: 0.48,
      vocational: 0.16,
    },
    // Role-specific major distribution for generated candidates.
    majorWeightsByRole: {
      engineer: {
        "computer-science": 0.5,
        engineering: 0.3,
        business: 0.08,
        finance: 0.04,
        design: 0.04,
        operations: 0.04,
      },
      product: {
        "computer-science": 0.22,
        engineering: 0.12,
        business: 0.28,
        finance: 0.05,
        design: 0.23,
        operations: 0.1,
      },
      sales: {
        "computer-science": 0.08,
        engineering: 0.05,
        business: 0.42,
        finance: 0.08,
        design: 0.07,
        operations: 0.3,
      },
      finance: {
        "computer-science": 0.08,
        engineering: 0.05,
        business: 0.22,
        finance: 0.55,
        design: 0.02,
        operations: 0.08,
      },
      hr: {
        "computer-science": 0.04,
        engineering: 0.04,
        business: 0.38,
        finance: 0.08,
        design: 0.06,
        operations: 0.4,
      },
    },
    // Education tier contribution to technical ability.
    educationTechnicalBonus: {
      elite: 2,
      strong: 1,
      standard: 0,
      vocational: -0.5,
    },
    // Technical bonus when major matches the target role.
    roleMatchedMajorTechnicalBonus: 1,
    // Technical bonus per year of relevant industry experience.
    industryExperienceTechnicalWeight: 0.15,
    // Education tier salary premium or discount.
    educationSalaryPremium: {
      elite: 0.08,
      strong: 0.04,
      standard: 0,
      vocational: -0.02,
    },
    // Salary premium when major matches the target role.
    roleMatchedMajorSalaryPremium: 0.03,
    // Salary premium per year of relevant industry experience.
    industryExperienceSalaryWeight: 0.004,
    // Reputation lowers education-tier roll, increasing elite and strong candidate odds.
    reputationEducationRollShift: 0.28,
    // Reputation lowers major roll, increasing role-fit major odds.
    reputationMajorRollShift: 0.2,
    // Reputation raises relevant industry experience share.
    reputationIndustryRollBoost: 0.25,
  },
  resignation: {
    // Baseline monthly resignation pressure before salary, culture, and morale effects.
    baseRisk: 0.08,
    // Maximum risk added when salary is below the employee's target salary.
    salaryGapWeight: 0.46,
    // Maximum risk added when culture pressure exceeds stress tolerance.
    pressureWeight: 0.5,
    // Maximum risk added when morale is low.
    moraleWeight: 0.32,
    // Personality 0 (steady) multiplier on salary-gap resignation weight.
    lowPersonalitySalaryWeight: 0.6,
    // Personality 10 (independent) multiplier on salary-gap resignation weight.
    highPersonalitySalaryWeight: 1.4,
  },
  finance: {
    // Reputation required before banks consider larger startup loans.
    minimumLoanReputation: 4,
    // Annual revenue required before IPO preparation is available.
    ipoRevenueThreshold: 1_000_000,
    // Reputation required before public-market listing is credible.
    ipoReputationThreshold: 7,
    // Headcount required before the company has enough operating maturity for IPO.
    ipoHeadcountThreshold: 30,
    // Minimum operational capability required for IPO eligibility.
    ipoOperationalCapabilityThreshold: 5,
    // Resource level bonus to loan approval (per resource point above threshold).
    resourceLoanBonusRate: 0.2,
  },
  companyResources: {
    // Starting resource level for new companies.
    baseResourceLevel: 5,
    // Cash health contribution to resource calculation.
    cashResourceWeight: 0.3,
    // Reputation contribution to resource calculation.
    reputationResourceWeight: 0.4,
    // Headcount contribution to resource calculation.
    headcountResourceWeight: 0.3,
    // Operational capability impact on revenue as a multiplier.
    operationalCapabilityRevenueMultiplier: 0.2,
    // Monthly resource decay rate when under-investing.
    resourceDecayRate: 0.02,
    // Minimum operational efficiency multiplier.
    minOperationalEfficiency: 0.5,
    // Maximum operational efficiency multiplier.
    maxOperationalEfficiency: 1.5,
  },
  employeeLifecycle: {
    // Minimum months counted for termination compensation.
    minimumSeveranceMonths: 1,
    // Severance is salary multiplied by completed service years, rounded up.
    severanceMonthsPerServiceYear: 1,
    // Default salary raise offered through the retention action.
    salaryRaiseRate: 0.1,
  },
  promotion: {
    // Headcount required before middle management roles become useful.
    middleManagementMinimumHeadcount: 8,
    // Tenure required before an employee can move into middle management.
    middleManagementMinimumTenureMonths: 12,
    // Promotion score required for middle management.
    middleManagementScoreThreshold: 7.2,
    // Headcount required before executive roles become useful.
    executiveMinimumHeadcount: 30,
    // Tenure required before a middle manager can move into executive management.
    executiveMinimumTenureMonths: 36,
    // Promotion score required for executive management.
    executiveScoreThreshold: 8.4,
    // Communication drives whether strong specialists can coordinate teams.
    communicationWeight: 0.35,
    // EQ helps promoted employees handle people-heavy management work.
    eqWeight: 0.25,
    // Stress tolerance helps managers stay stable under culture pressure.
    stressToleranceWeight: 0.2,
    // Work experience improves promotion readiness.
    experienceWeight: 0.15,
    // Tenure gives a small score boost for company-specific knowledge.
    tenureWeight: 0.05,
    // Salary raise applied when an employee is promoted.
    salaryRaiseRate: 0.15,
    // Morale gain from visible internal promotion.
    moraleGain: 0.2,
  },
  macroCycle: {
    // One simplified Kondratiev-style cycle spans 60 in-game years.
    cycleLengthDays: 365 * 60,
    phases: {
      recovery: {
        // Recovery gently improves financial sentiment and lowers unemployment.
        marketSentiment: 1.05,
        unemploymentRate: 0.07,
      },
      prosperity: {
        // Prosperity raises market sentiment and tightens the labor market.
        marketSentiment: 1.2,
        unemploymentRate: 0.04,
      },
      recession: {
        // Recession weakens valuation multiples and raises unemployment.
        marketSentiment: 0.86,
        unemploymentRate: 0.12,
      },
      depression: {
        // Depression sharply reduces market sentiment and creates a loose labor market.
        marketSentiment: 0.68,
        unemploymentRate: 0.2,
      },
    },
  },
  policy: {
    // Cash grant for companies that match the current policy priority.
    supportGrantCash: 30_000,
    // Reputation boost from receiving visible government support.
    supportReputationGain: 1,
  },
  court: {
    // Base cash penalty per severity point for company-side legal violations.
    companyViolationPenaltyPerSeverity: 8_000,
    // Base cash loss per severity point for employee-side legal incidents.
    employeeViolationPenaltyPerSeverity: 5_000,
    // Reputation loss per severity point after court resolution.
    reputationLossPerSeverity: 1,
  },
  laborMarket: {
    // Salary expectations fall when unemployment rises above this level.
    highUnemploymentThreshold: 0.12,
    // Salary expectations rise when unemployment falls below this level.
    tightMarketThreshold: 0.05,
    // Maximum salary discount in a weak labor market.
    highUnemploymentSalaryDiscount: 0.12,
    // Maximum salary premium in a tight labor market.
    tightMarketSalaryPremium: 0.1,
  },
  securitiesMarket: {
    // Public-market value reacts to sentiment above or below neutral.
    sentimentWeight: 0.08,
    // Public-market value reacts to reputation above or below 5.
    reputationWeight: 0.03,
    // Small seeded day-to-day market noise.
    noiseWeight: 0.02,
  },
  aiHiring: {
    // Player can toggle AI-driven hiring on or off.
    enabled: false,
    // Monthly chance that the AI will attempt to hire when needs exist.
    monthlyHiringChance: 0.7,
    // Maximum hires the AI will attempt per monthly cycle.
    maxHiresPerMonth: 3,
    // Willingness to pay above target salary (e.g. 0.15 = 15% above).
    salaryFlexibility: 0.15,
    // Maximum equity percent the AI can offer per hire.
    equityOfferRate: 0.01,
    // How much company reputation weighs in candidate selection (0-1).
    reputationWeight: 0.3,
    // How much candidate skill weighs in candidate selection (0-1).
    skillWeight: 0.4,
    // How much cost weighs in candidate selection (0-1).
    costWeight: 0.3,
  },
  investment: {
    // Expected annual return rates by asset class (balanced for gameplay).
    baseReturnRates: {
      stocks: 0.08,
      bonds: 0.04,
      real_estate: 0.06,
      venture: 0.15,
      crypto: 0.12,
    },
    // Risk levels by asset class (0 = safe, 1 = very risky).
    riskLevels: {
      stocks: 0.6,
      bonds: 0.2,
      real_estate: 0.4,
      venture: 0.8,
      crypto: 0.9,
    },
    // How much market sentiment (0-2) influences returns.
    marketSentimentWeight: 0.3,
    // Annual volatility by asset class (standard deviation of returns).
    volatilityByType: {
      stocks: 0.15,
      bonds: 0.05,
      real_estate: 0.1,
      venture: 0.25,
      crypto: 0.4,
    },
    // Minimum investment amount in cash.
    minimumInvestment: 10000,
    // Maximum fraction of cash that can go into a single investment.
    maxPortfolioPercentage: 0.3,
  },
  listedGovernance: {
    // Weight of shareholder satisfaction in overall governance score.
    shareholderSatisfactionWeight: 0.4,
    // Weight of disclosure compliance in overall governance score.
    disclosureComplianceWeight: 0.3,
    // Weight of regulatory compliance in overall governance score.
    regulatoryComplianceWeight: 0.3,
    // Maximum days between required disclosures for listed companies.
    minimumDisclosureFrequency: 90,
    // Cash level below which delisting risk increases.
    delistingCashThreshold: -100000,
    // Reputation level below which delisting risk increases.
    delistingReputationThreshold: 2,
    // Valuation below which delisting risk increases.
    delistingValuationThreshold: 50000,
    // Governance penalty rate as a fraction of valuation.
    governancePenaltyRate: 0.05,
    // Shareholder satisfaction below this threshold triggers pressure.
    shareholderPressureThreshold: 0.3,
    // Weight of governance score in market value calculation.
    marketPerceptionWeight: 0.2,
  },
  insurance: {
    // Base monthly premium rate as a fraction of coverage amount.
    basePremiumRate: 0.02,
    // Premium multiplier applied per unit of company risk score.
    premiumMultiplier: 1.5,
    // Deductible as a fraction of coverage amount paid by the company before insurance kicks in.
    deductibleRate: 0.1,
    // Maximum payout per claim as a fraction of total coverage.
    maxPayoutRate: 0.8,
    // Number of in-game days required to process an insurance claim.
    claimProcessingTime: 30,
    // Coverage type-specific base rates and settings.
    coverageTypes: {
      legal: { baseRate: 0.015, riskFactors: ["legalCaseCount"] },
      operational: { baseRate: 0.012, riskFactors: ["operationalCapability"] },
      market: { baseRate: 0.018, riskFactors: ["marketSentiment"] },
      comprehensive: { baseRate: 0.025, riskFactors: ["all"] },
    },
  },
  personalLife: {
    // 2% of car value per month for maintenance.
    carMaintenanceRate: 0.02,
    // Happiness bonus from marriage.
    marriageHappinessBonus: 2,
    // 10% of wealth per month for marriage expenses.
    marriageExpenseRate: 0.1,
    // Happiness bonus per child.
    childHappinessBonus: 3,
    // Education cost per month per child.
    childEducationCost: 5000,
    // Happiness below this threshold increases divorce chance.
    divorceHappinessThreshold: 3,
    // Lose 30% of wealth during divorce.
    divorceWealthLossRate: 0.3,
    // Happiness decreases without personal life investments.
    happinessDecayRate: 0.1,
    // How much personal life affects work (0-1).
    workLifeBalanceWeight: 0.2,
  },
} as const;
