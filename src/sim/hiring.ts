import { calculateCultureFit } from "./culture-fit";
import type {
  CandidateBackground,
  CompanyCulture,
  CompanyRole,
  EmployeePersonality
} from "./types";
import { PROBABILITY_CONFIG } from "../config/probabilities";
import { clamp, createSeededRng } from "./rng";

export interface Candidate {
  role: CompanyRole;
  targetSalary: number;
  minimumSalary: number;
  technical: number;
  experienceYears: number;
  stressTolerance: number;
  communication: number;
  eq: number;
  iq: number;
  background: CandidateBackground;
  personality: EmployeePersonality;
}

export interface HiringOffer {
  salary: number;
  equityPercent: number;
}

export interface HiringInput {
  seed: number;
  companyReputation: number;
  companyCulture?: CompanyCulture;
  offer: HiringOffer;
  candidate: Candidate;
}

export interface HiringResult {
  accepted: boolean;
  acceptanceProbability: number;
  reason?: "salary_below_minimum" | "probability_failed";
}

export function negotiateHiring(input: HiringInput): HiringResult {
  if (input.offer.salary < input.candidate.minimumSalary) {
    return {
      accepted: false,
      acceptanceProbability: 0,
      reason: "salary_below_minimum"
    };
  }

  const salaryFit = clamp(input.offer.salary / input.candidate.targetSalary, 0, 1);
  const reputationFit = clamp(input.companyReputation / 10, 0, 1);
  const equityFit = clamp(input.offer.equityPercent / 1, 0, 1);
  const communicationFit = clamp(input.candidate.communication / 10, 0, 1);
  const cultureFit = input.companyCulture
    ? calculateCultureFit({
        culture: input.companyCulture,
        personality: input.candidate.personality
      })
    : 0;
  const acceptanceProbability = clamp(
    PROBABILITY_CONFIG.hiring.baseAcceptance +
      salaryFit * PROBABILITY_CONFIG.hiring.salaryWeight +
      reputationFit * PROBABILITY_CONFIG.hiring.reputationWeight +
      equityFit * PROBABILITY_CONFIG.hiring.equityWeight +
      communicationFit * PROBABILITY_CONFIG.hiring.communicationWeight +
      cultureFit * PROBABILITY_CONFIG.cultureFit.hiringAcceptanceWeight,
    0,
    0.98
  );
  const roll = createSeededRng(input.seed).next();
  const accepted = roll <= acceptanceProbability;

  return {
    accepted,
    acceptanceProbability,
    reason: accepted ? undefined : "probability_failed"
  };
}
