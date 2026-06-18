import { calculateFinalScore, type ScoreInput } from "./scoring";
import type { GameOverReason } from "./types";

export interface LeaderboardEntry {
  id: string;
  score: number;
  daysPlayed: number;
  companyValuation: number;
  playerWealth: number;
  gameOverReason: GameOverReason | string;
  date: string;
  rank: number;
}

export interface LeaderboardInput extends ScoreInput {
  gameOverReason?: GameOverReason | string;
}

const STORAGE_KEY = "i-am-boss-leaderboard";

export function addToLeaderboard(input: LeaderboardInput): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: generateId(),
    score: calculateFinalScore(input),
    daysPlayed: input.daysPlayed,
    companyValuation: input.companyValuation,
    playerWealth: input.playerWealth,
    gameOverReason: input.gameOverReason ?? "unknown",
    date: new Date().toISOString(),
    rank: 0,
  };

  const entries = loadFromStorage();
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  saveToStorage(entries);
  return entry;
}

export function getLeaderboard(limit?: number): LeaderboardEntry[] {
  const entries = loadFromStorage();
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
}

export function clearLeaderboard(): void {
  saveToStorage([]);
}

export function exportLeaderboard(): string {
  return JSON.stringify(getLeaderboard(), null, 2);
}

export function importLeaderboard(data: string): void {
  const parsed: unknown = JSON.parse(data);
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid leaderboard data: expected an array");
  }

  const entries = parsed.map(validateEntry);
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  saveToStorage(entries);
}

export function generateId(): string {
  return `lb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function validateEntry(raw: unknown): LeaderboardEntry {
  const obj = raw as Record<string, unknown>;
  if (typeof obj.score !== "number" || typeof obj.daysPlayed !== "number") {
    throw new Error("Invalid leaderboard entry: missing required numeric fields");
  }
  return {
    id: String(obj.id ?? generateId()),
    score: obj.score as number,
    daysPlayed: obj.daysPlayed as number,
    companyValuation: Number(obj.companyValuation ?? 0),
    playerWealth: Number(obj.playerWealth ?? 0),
    gameOverReason: String(obj.gameOverReason ?? "unknown"),
    date: String(obj.date ?? new Date().toISOString()),
    rank: 0,
  };
}

function loadFromStorage(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

function saveToStorage(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* intentionally ignored: localStorage may be unavailable */
  }
}
