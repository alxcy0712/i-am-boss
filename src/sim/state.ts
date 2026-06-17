import { findInitialChoice } from "../config/initial-choices";
import { recordGameEvent } from "./events";
import type { GameState } from "./types";

export function createInitialGameState(input: {
  seed: number;
  initialChoiceId?: string;
}): GameState {
  const choice = findInitialChoice(input.initialChoiceId ?? "technical-founder");
  const baseAbilities = {
    technical: 5,
    experience: 1,
    stressTolerance: 5,
    communication: 5,
    eq: 5,
    iq: 5
  };

  const state: GameState = {
    seed: input.seed,
    day: 0,
    founder: {
      age: 25,
      health: 100,
      wealth: 20000,
      abilities: {
        ...baseAbilities,
        ...Object.fromEntries(
          Object.entries(choice.abilityBonus).map(([key, bonus]) => [
            key,
            Math.min(10, baseAbilities[key as keyof typeof baseAbilities] + (bonus ?? 0))
          ])
        )
      }
    },
    company: {
      cash: 100000 + choice.companyBonus.cash,
      debt: 0,
      valuation: 100000,
      annualRevenue: 90000,
      industry: "technology",
      monthlyBurn: 9000,
      reputation: 3 + choice.companyBonus.reputation,
      morale: 7,
      culture: "adaptive",
      culturePressure: 5,
      headcount: 1,
      employees: [],
      isPublic: false
    },
    marketSentiment: 1,
    society: {
      cyclePhase: "recovery",
      unemploymentRate: 0.07,
      legalCaseCount: 0,
      policySupportCount: 0,
      specialEventCount: 0
    },
    events: [],
    eventLog: []
  };

  recordGameEvent(state, {
    type: "initial_choice",
    choiceId: choice.id,
    choiceLabel: choice.label
  });

  return state;
}
