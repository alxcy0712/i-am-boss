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
    lowMoraleHealthWeight: 0.12
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
    communicationWeight: 0.08
  },
  cultureFit: {
    // Hiring acceptance contribution from a candidate personality matching company culture.
    hiringAcceptanceWeight: 0.1,
    // Resignation risk added when an employee personality clashes with company culture.
    resignationRiskWeight: 0.24,
    // Culture/personality compatibility scores from 0 to 1.
    compatibilityByCulture: {
      wolf: {
        ambitious: 1,
        steady: 0.45,
        collaborative: 0.55,
        independent: 0.65
      },
      "laissez-faire": {
        ambitious: 0.6,
        steady: 0.8,
        collaborative: 0.65,
        independent: 1
      },
      adaptive: {
        ambitious: 0.75,
        steady: 0.9,
        collaborative: 1,
        independent: 0.8
      },
      striver: {
        ambitious: 0.95,
        steady: 0.65,
        collaborative: 0.75,
        independent: 0.6
      }
    }
  },
  companyCulture: {
    // Cash cost of communicating and implementing a culture change.
    changeCost: 12_000,
    // Target pressure level after each company culture is adopted.
    culturePressureByCulture: {
      wolf: 9,
      "laissez-faire": 3,
      adaptive: 5,
      striver: 7
    },
    // Immediate morale impact from changing to each culture.
    moraleDeltaByCulture: {
      wolf: -0.8,
      "laissez-faire": 0.5,
      adaptive: 0.3,
      striver: -0.2
    },
    // Reputation impact from adopting each visible company ideal.
    reputationDeltaByCulture: {
      wolf: 0,
      "laissez-faire": -0.2,
      adaptive: 0.2,
      striver: 0.1
    }
  },
  valuation: {
    // Base revenue multiple used by analyst-style private company estimates.
    privateRevenueMultiple: 2,
    // Profitability increases the private analyst multiple.
    profitMarginWeight: 8,
    // Reputation increases the private analyst multiple and financing credibility.
    reputationWeight: 2
  },
  society: {
    // Daily chance of a market sentiment move from financial or macro conditions.
    dailyMarketShockChance: 0.04,
    // Daily chance of supportive policy improving the company's operating conditions.
    supportivePolicyChance: 0.02,
    // Daily chance of an abstract legal or compliance incident affecting cash.
    legalIncidentChance: 0.01
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
    geopoliticalTensionUnemploymentDelta: 0.015
  },
  staffing: {
    // Baseline monthly salary for each role before ability and seniority multipliers.
    baseMonthlySalaryByRole: {
      engineer: 12000,
      product: 11000,
      sales: 9500,
      finance: 10500,
      hr: 9000
    },
    // Senior hires demand higher salary and usually arrive with stronger ability scores.
    senioritySalaryMultiplier: {
      junior: 0.75,
      mid: 1,
      senior: 1.65
    }
  },
  candidateBackground: {
    // Education tier distribution for generated candidates.
    educationTierWeights: {
      elite: 0.12,
      strong: 0.24,
      standard: 0.48,
      vocational: 0.16
    },
    // Role-specific major distribution for generated candidates.
    majorWeightsByRole: {
      engineer: {
        "computer-science": 0.5,
        engineering: 0.3,
        business: 0.08,
        finance: 0.04,
        design: 0.04,
        operations: 0.04
      },
      product: {
        "computer-science": 0.22,
        engineering: 0.12,
        business: 0.28,
        finance: 0.05,
        design: 0.23,
        operations: 0.1
      },
      sales: {
        "computer-science": 0.08,
        engineering: 0.05,
        business: 0.42,
        finance: 0.08,
        design: 0.07,
        operations: 0.3
      },
      finance: {
        "computer-science": 0.08,
        engineering: 0.05,
        business: 0.22,
        finance: 0.55,
        design: 0.02,
        operations: 0.08
      },
      hr: {
        "computer-science": 0.04,
        engineering: 0.04,
        business: 0.38,
        finance: 0.08,
        design: 0.06,
        operations: 0.4
      }
    },
    // Education tier contribution to technical ability.
    educationTechnicalBonus: {
      elite: 2,
      strong: 1,
      standard: 0,
      vocational: -0.5
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
      vocational: -0.02
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
    reputationIndustryRollBoost: 0.25
  },
  resignation: {
    // Baseline monthly resignation pressure before salary, culture, and morale effects.
    baseRisk: 0.08,
    // Maximum risk added when salary is below the employee's target salary.
    salaryGapWeight: 0.46,
    // Maximum risk added when culture pressure exceeds stress tolerance.
    pressureWeight: 0.5,
    // Maximum risk added when morale is low.
    moraleWeight: 0.32
  },
  finance: {
    // Reputation required before banks consider larger startup loans.
    minimumLoanReputation: 4,
    // Annual revenue required before IPO preparation is available.
    ipoRevenueThreshold: 1_000_000,
    // Reputation required before public-market listing is credible.
    ipoReputationThreshold: 7,
    // Headcount required before the company has enough operating maturity for IPO.
    ipoHeadcountThreshold: 30
  },
  employeeLifecycle: {
    // Minimum months counted for termination compensation.
    minimumSeveranceMonths: 1,
    // Severance is salary multiplied by completed service years, rounded up.
    severanceMonthsPerServiceYear: 1,
    // Default salary raise offered through the retention action.
    salaryRaiseRate: 0.1
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
    moraleGain: 0.2
  },
  macroCycle: {
    // One simplified Kondratiev-style cycle spans 60 in-game years.
    cycleLengthDays: 365 * 60,
    phases: {
      recovery: {
        // Recovery gently improves financial sentiment and lowers unemployment.
        marketSentiment: 1.05,
        unemploymentRate: 0.07
      },
      prosperity: {
        // Prosperity raises market sentiment and tightens the labor market.
        marketSentiment: 1.2,
        unemploymentRate: 0.04
      },
      recession: {
        // Recession weakens valuation multiples and raises unemployment.
        marketSentiment: 0.86,
        unemploymentRate: 0.12
      },
      depression: {
        // Depression sharply reduces market sentiment and creates a loose labor market.
        marketSentiment: 0.68,
        unemploymentRate: 0.2
      }
    }
  },
  policy: {
    // Cash grant for companies that match the current policy priority.
    supportGrantCash: 30_000,
    // Reputation boost from receiving visible government support.
    supportReputationGain: 1
  },
  court: {
    // Base cash penalty per severity point for company-side legal violations.
    companyViolationPenaltyPerSeverity: 8_000,
    // Base cash loss per severity point for employee-side legal incidents.
    employeeViolationPenaltyPerSeverity: 5_000,
    // Reputation loss per severity point after court resolution.
    reputationLossPerSeverity: 1
  },
  laborMarket: {
    // Salary expectations fall when unemployment rises above this level.
    highUnemploymentThreshold: 0.12,
    // Salary expectations rise when unemployment falls below this level.
    tightMarketThreshold: 0.05,
    // Maximum salary discount in a weak labor market.
    highUnemploymentSalaryDiscount: 0.12,
    // Maximum salary premium in a tight labor market.
    tightMarketSalaryPremium: 0.1
  },
  securitiesMarket: {
    // Public-market value reacts to sentiment above or below neutral.
    sentimentWeight: 0.08,
    // Public-market value reacts to reputation above or below 5.
    reputationWeight: 0.03,
    // Small seeded day-to-day market noise.
    noiseWeight: 0.02
  }
} as const;
