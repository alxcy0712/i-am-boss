import type { GameState } from "../sim/types";

export interface GameSnapshot {
  version: 1;
  state: GameState;
}

export function serializeGameState(state: GameState): string {
  const snapshot: GameSnapshot = {
    version: 1,
    state,
  };
  return JSON.stringify(snapshot);
}

export function deserializeGameState(snapshotJson: string): GameState {
  const snapshot = JSON.parse(snapshotJson) as GameSnapshot;
  if (snapshot.version !== 1) {
    throw new Error(`Unsupported snapshot version: ${snapshot.version}`);
  }
  return structuredClone(snapshot.state);
}
