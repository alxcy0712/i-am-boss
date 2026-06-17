import type { InitialChoice } from "../sim/types";

export const INITIAL_CHOICES: InitialChoice[] = [
  {
    id: "technical-founder",
    label: "Technical Founder",
    abilityBonus: { technical: 2, iq: 1 },
    companyBonus: { cash: 0, reputation: 1 }
  },
  {
    id: "network-founder",
    label: "Network Founder",
    abilityBonus: { communication: 1, eq: 1 },
    companyBonus: { cash: 30000, reputation: 2 }
  },
  {
    id: "resilient-founder",
    label: "Resilient Founder",
    abilityBonus: { stressTolerance: 2, communication: 1 },
    companyBonus: { cash: 15000, reputation: 0 }
  }
];

export function findInitialChoice(id: string): InitialChoice {
  return INITIAL_CHOICES.find((choice) => choice.id === id) ?? INITIAL_CHOICES[0];
}
