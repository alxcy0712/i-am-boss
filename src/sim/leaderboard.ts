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
  const scoreInput: ScoreInput = {
    daysPlayed: readScoreInputNumber(input.daysPlayed),
    companyValuation: readScoreInputNumber(input.companyValuation),
    playerWealth: readScoreInputNumber(input.playerWealth),
  };
  const entry: LeaderboardEntry = {
    id: generateId(),
    score: calculateFinalScore(scoreInput),
    daysPlayed: scoreInput.daysPlayed,
    companyValuation: scoreInput.companyValuation,
    playerWealth: scoreInput.playerWealth,
    gameOverReason: readGameOverReason(input.gameOverReason),
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
  return typeof limit === "number" ? entries.slice(0, normalizeLimit(limit)) : entries;
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
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid leaderboard entry: expected an object");
  }

  const obj = raw as Record<string, unknown>;
  if (typeof obj.score !== "number" || typeof obj.daysPlayed !== "number") {
    throw new Error("Invalid leaderboard entry: missing required numeric fields");
  }
  const score = readFiniteNumber(obj.score, "score");
  const daysPlayed = readFiniteNumber(obj.daysPlayed, "daysPlayed");

  return {
    id: String(obj.id ?? generateId()),
    score,
    daysPlayed,
    companyValuation: readOptionalFiniteNumber(obj.companyValuation, "companyValuation", 0),
    playerWealth: readOptionalFiniteNumber(obj.playerWealth, "playerWealth", 0),
    gameOverReason: readGameOverReason(obj.gameOverReason),
    date: String(obj.date ?? new Date().toISOString()),
    rank: 0,
  };
}

function readOptionalFiniteNumber(value: unknown, fieldName: string, fallback: number): number {
  if (value == null) {
    return fallback;
  }

  if (typeof value !== "number") {
    throw new Error(`Invalid leaderboard entry: invalid numeric field: ${fieldName}`);
  }

  return readFiniteNumber(value, fieldName);
}

function readFiniteNumber(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid leaderboard entry: invalid numeric field: ${fieldName}`);
  }

  return value;
}

function readScoreInputNumber(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function readGameOverReason(value: unknown): GameOverReason | string {
  return typeof value === "string" && value.trim().length > 0 ? value : "unknown";
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 0;
  }
  return Math.floor(limit);
}

function loadFromStorage(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      try {
        return [validateEntry(entry)];
      } catch {
        return [];
      }
    });
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
