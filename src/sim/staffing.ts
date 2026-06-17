import { PROBABILITY_CONFIG } from "../config/probabilities";
import type {
  CandidateBackground,
  CandidateMajor,
  CompanyRole,
  EducationTier
} from "./types";
import type { Candidate } from "./hiring";
import { clamp, createSeededRng } from "./rng";

export type Seniority = "junior" | "mid" | "senior";

export interface HiringPlanInput {
  headcount: number;
  annualRevenue: number;
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

export function getHiringPlan(input: HiringPlanInput): CompanyRole[] {
  if (input.headcount < 5 && input.annualRevenue < 300_000) {
    return ["engineer"];
  }

  if (input.headcount < 15) {
    return ["engineer", "product", "sales"];
  }

  return ["engineer", "product", "sales", "finance", "hr"];
}

export function generateCandidate(input: CandidateInput): Candidate {
  const rng = createSeededRng(input.seed);
  const reputationFit = clamp((input.companyReputation ?? 0) / 10, 0, 1);
  const seniorityBase = input.seniority === "senior" ? 6 : input.seniority === "mid" ? 4 : 2;
  const experienceYears = seniorityBase + Math.floor(rng.next() * 3);
  const abilityBase = input.seniority === "senior" ? 7 : input.seniority === "mid" ? 5 : 3;
  const baseTechnical = clamp(abilityBase + Math.floor(rng.next() * 3), 0, 10);
  const communication = clamp(abilityBase - 1 + Math.floor(rng.next() * 4), 0, 10);
  const eq = clamp(abilityBase - 1 + Math.floor(rng.next() * 4), 0, 10);
  const iq = clamp(abilityBase + Math.floor(rng.next() * 3), 0, 10);
  const stressTolerance = clamp(abilityBase - 1 + Math.floor(rng.next() * 4), 0, 10);
  const background = generateCandidateBackground({
    role: input.role,
    experienceYears,
    educationRoll: applyReputationRollShift(
      rng.next(),
      reputationFit,
      PROBABILITY_CONFIG.candidateBackground.reputationEducationRollShift
    ),
    majorRoll: applyReputationRollShift(
      rng.next(),
      reputationFit,
      PROBABILITY_CONFIG.candidateBackground.reputationMajorRollShift
    ),
    industryRoll: clamp(
      rng.next() +
        reputationFit * PROBABILITY_CONFIG.candidateBackground.reputationIndustryRollBoost,
      0,
      0.999999
    )
  });
  const technical = clamp(
    Math.round(
      baseTechnical +
        calculateBackgroundTechnicalBonus({
          role: input.role,
          background
        })
    ),
    0,
    10
  );
  const targetSalary = calculateCandidateTargetSalary({
    role: input.role,
    seniority: input.seniority,
    technical,
    communication,
    iq,
    background
  });

  return {
    role: input.role,
    targetSalary,
    minimumSalary: Math.round(targetSalary * 0.82),
    technical,
    experienceYears,
    stressTolerance,
    communication,
    eq,
    iq,
    background,
    personality: input.seniority === "senior" ? "ambitious" : "steady"
  };
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
  const educationTier = selectWeightedKey(
    input.educationRoll,
    PROBABILITY_CONFIG.candidateBackground.educationTierWeights
  );
  const major = selectWeightedKey(
    input.majorRoll,
    PROBABILITY_CONFIG.candidateBackground.majorWeightsByRole[input.role]
  );
  const relevantExperienceShare = 0.5 + clamp(input.industryRoll, 0, 1) * 0.5;

  return {
    educationTier,
    major,
    industryExperienceYears: Math.min(
      input.experienceYears,
      Math.round(input.experienceYears * relevantExperienceShare)
    )
  };
}

export function calculateBackgroundTechnicalBonus(
  input: BackgroundTechnicalBonusInput
): number {
  const config = PROBABILITY_CONFIG.candidateBackground;
  return (
    config.educationTechnicalBonus[input.background.educationTier] +
    (majorFitsRole(input.role, input.background.major)
      ? config.roleMatchedMajorTechnicalBonus
      : 0) +
    input.background.industryExperienceYears * config.industryExperienceTechnicalWeight
  );
}

export function calculateCandidateTargetSalary(input: CandidateSalaryInput): number {
  const config = PROBABILITY_CONFIG.candidateBackground;
  const baseSalary = PROBABILITY_CONFIG.staffing.baseMonthlySalaryByRole[input.role];
  const seniorityMultiplier =
    PROBABILITY_CONFIG.staffing.senioritySalaryMultiplier[input.seniority];
  const abilityMultiplier = 1 + (input.technical + input.communication + input.iq) / 100;
  const backgroundMultiplier =
    1 +
    config.educationSalaryPremium[input.background.educationTier] +
    (majorFitsRole(input.role, input.background.major)
      ? config.roleMatchedMajorSalaryPremium
      : 0) +
    input.background.industryExperienceYears * config.industryExperienceSalaryWeight;

  return Math.round(
    baseSalary *
      seniorityMultiplier *
      abilityMultiplier *
      clamp(backgroundMultiplier, 0.8, 1.25)
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
    hr: ["business", "operations"]
  };

  return roleMatchedMajors[role].includes(major);
}
