import { PROBABILITY_CONFIG } from "../config/probabilities";
import type { CandidateBackground, CandidateMajor, CompanyRole, EducationTier } from "./types";
import type { Candidate } from "./hiring";
import { clamp, createSeededRng } from "./rng";

export type Seniority = "junior" | "mid" | "senior";

export interface HiringPlanInput {
  headcount: number;
  annualRevenue: number;
  resources?: number;
}

export interface CandidateInput {
  seed: number;
  role: CompanyRole;
  seniority: Seniority;
  companyReputation?: number;
}

export interface BackgroundTechnicalBonusInput {
  role: CompanyRole;
  background: CandidateBackground;
}

export interface CandidateSalaryInput {
  role: CompanyRole;
  seniority: Seniority;
  technical: number;
  communication: number;
  iq: number;
  background: CandidateBackground;
}

export interface AIHiringDecisionInput {
  role: CompanyRole;
  companyCash: number;
  marketRate: number;
}

export interface AIHiringDecision {
  targetSalaryMin: number;
  targetSalaryMax: number;
  equityPercent: number;
  strategy: "aggressive" | "moderate" | "conservative";
}

export function getHiringPlan(input: HiringPlanInput): CompanyRole[] {
  const headcount = readNonNegativeFinite(input.headcount, 0);
  const annualRevenue = readNonNegativeFinite(input.annualRevenue, 0);
  const resources = readNonNegativeFinite(input.resources ?? 5, 5);
  const resourceBoost = resources >= 7;

  if (headcount < 5 && annualRevenue < 300_000) {
    return resourceBoost ? ["engineer", "product"] : ["engineer"];
  }

  if (headcount < 15) {
    return resourceBoost
      ? ["engineer", "product", "sales", "finance"]
      : ["engineer", "product", "sales"];
  }

  return ["engineer", "product", "sales", "finance", "hr"];
}

export function generateCandidate(input: CandidateInput): Candidate {
  const rng = createSeededRng(input.seed);
  const role = readCompanyRole(input.role);
  const seniority = readSeniority(input.seniority);
  const reputationFit = clamp((input.companyReputation ?? 0) / 10, 0, 1);
  const seniorityBase = seniority === "senior" ? 6 : seniority === "mid" ? 4 : 2;
  const experienceYears = seniorityBase + Math.floor(rng.next() * 3);
  const abilityBase = seniority === "senior" ? 7 : seniority === "mid" ? 5 : 3;
  const baseTechnical = clamp(abilityBase + Math.floor(rng.next() * 3), 0, 10);
  const communication = clamp(abilityBase - 1 + Math.floor(rng.next() * 4), 0, 10);
  const eq = clamp(abilityBase - 1 + Math.floor(rng.next() * 4), 0, 10);
  const iq = clamp(abilityBase + Math.floor(rng.next() * 3), 0, 10);
  const stressTolerance = clamp(abilityBase - 1 + Math.floor(rng.next() * 4), 0, 10);
  const background = generateCandidateBackground({
    role,
    experienceYears,
    educationRoll: applyReputationRollShift(
      rng.next(),
      reputationFit,
      PROBABILITY_CONFIG.candidateBackground.reputationEducationRollShift,
    ),
    majorRoll: applyReputationRollShift(
      rng.next(),
      reputationFit,
      PROBABILITY_CONFIG.candidateBackground.reputationMajorRollShift,
    ),
    industryRoll: clamp(
      rng.next() +
        reputationFit * PROBABILITY_CONFIG.candidateBackground.reputationIndustryRollBoost,
      0,
      0.999999,
    ),
  });
  const technical = clamp(
    Math.round(
      baseTechnical +
        calculateBackgroundTechnicalBonus({
          role,
          background,
        }),
    ),
    0,
    10,
  );
  const targetSalary = calculateCandidateTargetSalary({
    role,
    seniority,
    technical,
    communication,
    iq,
    background,
  });

  return {
    role,
    targetSalary,
    minimumSalary: Math.round(targetSalary * 0.82),
    technical,
    experienceYears,
    stressTolerance,
    communication,
    eq,
    iq,
    background,
    personality:
      seniority === "senior"
        ? clamp(Math.round(6 + rng.next() * 5), 6, 10)
        : clamp(Math.round(3 + rng.next() * 5), 3, 7),
  };
}

function readCompanyRole(value: CompanyRole): CompanyRole {
  return value === "engineer" ||
    value === "product" ||
    value === "sales" ||
    value === "finance" ||
    value === "hr"
    ? value
    : "engineer";
}

function readSeniority(value: Seniority): Seniority {
  return value === "senior" || value === "mid" || value === "junior" ? value : "junior";
}

function readEducationTier(value: EducationTier): EducationTier {
  return value === "elite" || value === "strong" || value === "standard" || value === "vocational"
    ? value
    : "standard";
}

function readCandidateMajor(value: CandidateMajor): CandidateMajor {
  return value === "computer-science" ||
    value === "engineering" ||
    value === "business" ||
    value === "finance" ||
    value === "design" ||
    value === "operations"
    ? value
    : "business";
}

function applyReputationRollShift(roll: number, reputationFit: number, shift: number): number {
  return clamp(roll - reputationFit * shift, 0, 0.999999);
}

export function generateCandidateBackground(input: {
  role: CompanyRole;
  experienceYears: number;
  educationRoll: number;
  majorRoll: number;
  industryRoll: number;
}): CandidateBackground {
  const role = readCompanyRole(input.role);
  const experienceYears = readNonNegativeFinite(input.experienceYears, 0);
  const educationTier = selectWeightedKey(
    readFinite(input.educationRoll, 0),
    PROBABILITY_CONFIG.candidateBackground.educationTierWeights,
  );
  const major = selectWeightedKey(
    readFinite(input.majorRoll, 0),
    PROBABILITY_CONFIG.candidateBackground.majorWeightsByRole[role],
  );
  const relevantExperienceShare = 0.5 + clamp(readFinite(input.industryRoll, 0), 0, 1) * 0.5;

  return {
    educationTier,
    major,
    industryExperienceYears: Math.min(
      experienceYears,
      Math.round(experienceYears * relevantExperienceShare),
    ),
  };
}

export function calculateBackgroundTechnicalBonus(input: BackgroundTechnicalBonusInput): number {
  const config = PROBABILITY_CONFIG.candidateBackground;
  const role = readCompanyRole(input.role);
  const educationTier = readEducationTier(input.background.educationTier);
  const major = readCandidateMajor(input.background.major);
  const industryExperienceYears = readNonNegativeFinite(
    input.background.industryExperienceYears,
    0,
  );
  return (
    config.educationTechnicalBonus[educationTier] +
    (majorFitsRole(role, major) ? config.roleMatchedMajorTechnicalBonus : 0) +
    industryExperienceYears * config.industryExperienceTechnicalWeight
  );
}

export function calculateCandidateTargetSalary(input: CandidateSalaryInput): number {
  const config = PROBABILITY_CONFIG.candidateBackground;
  const role = readCompanyRole(input.role);
  const seniority = readSeniority(input.seniority);
  const technical = readNonNegativeFinite(input.technical, 0);
  const communication = readNonNegativeFinite(input.communication, 0);
  const iq = readNonNegativeFinite(input.iq, 0);
  const educationTier = readEducationTier(input.background.educationTier);
  const major = readCandidateMajor(input.background.major);
  const industryExperienceYears = readNonNegativeFinite(
    input.background.industryExperienceYears,
    0,
  );
  const baseSalary = PROBABILITY_CONFIG.staffing.baseMonthlySalaryByRole[role];
  const seniorityMultiplier = PROBABILITY_CONFIG.staffing.senioritySalaryMultiplier[seniority];
  const abilityMultiplier = 1 + (technical + communication + iq) / 100;
  const backgroundMultiplier =
    1 +
    config.educationSalaryPremium[educationTier] +
    (majorFitsRole(role, major) ? config.roleMatchedMajorSalaryPremium : 0) +
    industryExperienceYears * config.industryExperienceSalaryWeight;

  return Math.round(
    baseSalary * seniorityMultiplier * abilityMultiplier * clamp(backgroundMultiplier, 0.8, 1.25),
  );
}

function selectWeightedKey<T extends string>(roll: number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as Array<[T, number]>;
  const totalWeight = entries.reduce((total, [, weight]) => total + weight, 0);
  const target = clamp(roll, 0, 0.999999) * totalWeight;
  let cursor = 0;

  for (const [key, weight] of entries) {
    cursor += weight;
    if (target < cursor) {
      return key;
    }
  }

  return entries[entries.length - 1][0];
}

function majorFitsRole(role: CompanyRole, major: CandidateMajor): boolean {
  const roleMatchedMajors: Record<CompanyRole, CandidateMajor[]> = {
    engineer: ["computer-science", "engineering"],
    product: ["computer-science", "business", "design"],
    sales: ["business", "operations"],
    finance: ["finance", "business"],
    hr: ["business", "operations"],
  };

  return roleMatchedMajors[role].includes(major);
}

export function getAIHiringDecision(input: AIHiringDecisionInput): AIHiringDecision {
  const config = PROBABILITY_CONFIG.aiHiring;
  const marketRate = readPositiveFinite(
    input.marketRate,
    PROBABILITY_CONFIG.staffing.baseMonthlySalaryByRole[input.role] ?? 10_000,
  );
  const companyCash = readFinite(input.companyCash, 0);
  const budgetRatio = companyCash / (marketRate * 12);
  let strategy: AIHiringDecision["strategy"];

  if (budgetRatio > 3) {
    strategy = "aggressive";
  } else if (budgetRatio > 1.5) {
    strategy = "moderate";
  } else {
    strategy = "conservative";
  }

  const flexibilityMultiplier =
    strategy === "aggressive"
      ? 1 + config.salaryFlexibility
      : strategy === "moderate"
        ? 1
        : 1 - config.salaryFlexibility;

  return {
    targetSalaryMin: Math.round(marketRate * 0.85),
    targetSalaryMax: Math.round(marketRate * flexibilityMultiplier),
    equityPercent:
      strategy === "aggressive"
        ? config.equityOfferRate
        : strategy === "moderate"
          ? config.equityOfferRate * 0.5
          : 0,
    strategy,
  };
}

function readFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function readNonNegativeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readPositiveFinite(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
