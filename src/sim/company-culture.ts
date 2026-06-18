import { PROBABILITY_CONFIG } from "../config/probabilities";
import { recordGameEvent } from "./events";
import { clamp } from "./rng";
import type { CompanyCulture, GameState } from "./types";

export interface ChangeCompanyCultureInput {
  culture: CompanyCulture;
}

export function changeCompanyCulture(state: GameState, input: ChangeCompanyCultureInput): void {
  const config = PROBABILITY_CONFIG.companyCulture;

  state.company.culture = input.culture;
  state.company.culturePressure = config.culturePressureByCulture[input.culture];
  state.company.cash -= config.changeCost;
  state.company.morale = clamp(
    state.company.morale + config.moraleDeltaByCulture[input.culture],
    0,
    10,
  );
  state.company.reputation = clamp(
    state.company.reputation + config.reputationDeltaByCulture[input.culture],
    0,
    10,
  );
  recordGameEvent(state, {
    type: "culture_changed",
    culture: input.culture,
  });
}
