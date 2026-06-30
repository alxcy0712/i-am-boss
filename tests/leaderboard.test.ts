import {
  addToLeaderboard,
  getLeaderboard,
  clearLeaderboard,
  exportLeaderboard,
  importLeaderboard,
  generateId,
  type LeaderboardEntry,
} from "../src/sim/leaderboard";
import { calculateFinalScore } from "../src/sim/scoring";

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
  };
}

let mockStorage: Storage;

beforeEach(() => {
  mockStorage = createMockStorage();
  vi.stubGlobal("localStorage", mockStorage);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateId", () => {
  it("returns a string starting with lb_", () => {
    const id = generateId();
    expect(id).toMatch(/^lb_/);
  });

  it("produces unique IDs on successive calls", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });
});

describe("addToLeaderboard", () => {
  it("creates an entry with the correct score using 1:2:1 formula", () => {
    const entry = addToLeaderboard({
      daysPlayed: 200,
      companyValuation: 300_000,
      playerWealth: 80_000,
      gameOverReason: "bankruptcy",
    });

    expect(entry.score).toBe(
      calculateFinalScore({
        daysPlayed: 200,
        companyValuation: 300_000,
        playerWealth: 80_000,
      }),
    );
    expect(entry.daysPlayed).toBe(200);
    expect(entry.companyValuation).toBe(300_000);
    expect(entry.playerWealth).toBe(80_000);
    expect(entry.gameOverReason).toBe("bankruptcy");
    expect(entry.rank).toBe(1);
    expect(entry.id).toMatch(/^lb_/);
    expect(entry.date).toBeTruthy();
  });

  it("assigns rank 1 to the first entry", () => {
    const entry = addToLeaderboard({
      daysPlayed: 10,
      companyValuation: 1000,
      playerWealth: 500,
    });
    expect(entry.rank).toBe(1);
  });

  it("ranks entries by score descending", () => {
    addToLeaderboard({ daysPlayed: 10, companyValuation: 1000, playerWealth: 500 });
    const second = addToLeaderboard({
      daysPlayed: 100,
      companyValuation: 500_000,
      playerWealth: 200_000,
    });

    expect(second.rank).toBe(1);

    const entries = getLeaderboard();
    expect(entries[0].score).toBeGreaterThan(entries[1].score);
    expect(entries[0].rank).toBe(1);
    expect(entries[1].rank).toBe(2);
  });

  it("defaults gameOverReason to unknown when omitted", () => {
    const entry = addToLeaderboard({
      daysPlayed: 5,
      companyValuation: 100,
      playerWealth: 50,
    });
    expect(entry.gameOverReason).toBe("unknown");
  });

  it("normalizes invalid game over reasons before saving", () => {
    const blankReason = addToLeaderboard({
      daysPlayed: 5,
      companyValuation: 100,
      playerWealth: 50,
      gameOverReason: "",
    });
    const objectReason = addToLeaderboard({
      daysPlayed: 5,
      companyValuation: 100,
      playerWealth: 50,
      gameOverReason: { bad: true } as never,
    });

    expect(blankReason.gameOverReason).toBe("unknown");
    expect(objectReason.gameOverReason).toBe("unknown");
  });

  it("normalizes non-finite score inputs before saving", () => {
    const entry = addToLeaderboard({
      daysPlayed: Number.NaN,
      companyValuation: Infinity,
      playerWealth: Number.NaN,
      gameOverReason: "bankruptcy",
    });

    expect(entry).toMatchObject({
      score: 0,
      daysPlayed: 0,
      companyValuation: 0,
      playerWealth: 0,
      gameOverReason: "bankruptcy",
    });
    expect(getLeaderboard()).toHaveLength(1);
    expect(getLeaderboard()[0]).toMatchObject({
      score: 0,
      daysPlayed: 0,
      companyValuation: 0,
      playerWealth: 0,
    });
  });

  it("normalizes negative score inputs before saving", () => {
    const entry = addToLeaderboard({
      daysPlayed: -10,
      companyValuation: -1000,
      playerWealth: -500,
      gameOverReason: "bankruptcy",
    });

    expect(entry).toMatchObject({
      score: 0,
      daysPlayed: 0,
      companyValuation: 0,
      playerWealth: 0,
    });
  });
});

describe("getLeaderboard", () => {
  it("returns empty array when no entries exist", () => {
    expect(getLeaderboard()).toEqual([]);
  });

  it("treats corrupt persisted data as empty", () => {
    mockStorage.setItem("i-am-boss-leaderboard", "{}");

    expect(getLeaderboard()).toEqual([]);

    mockStorage.setItem(
      "i-am-boss-leaderboard",
      JSON.stringify([{ score: 100, daysPlayed: 10, companyValuation: "oops" }]),
    );

    expect(getLeaderboard()).toEqual([]);
  });

  it("restores valid persisted entries when another entry is corrupt", () => {
    mockStorage.setItem(
      "i-am-boss-leaderboard",
      JSON.stringify([
        {
          id: "valid-entry",
          score: 200,
          daysPlayed: 20,
          companyValuation: 1000,
          playerWealth: 500,
          gameOverReason: "bankruptcy",
          date: "2026-01-01T00:00:00.000Z",
          rank: 0,
        },
        {
          id: "bad-entry",
          score: 100,
          daysPlayed: 10,
          companyValuation: "oops",
        },
      ]),
    );

    const entries = getLeaderboard();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: "valid-entry",
      score: 200,
      rank: 1,
    });
  });

  it("filters persisted entries with negative numeric fields", () => {
    mockStorage.setItem(
      "i-am-boss-leaderboard",
      JSON.stringify([
        {
          id: "valid-entry",
          score: 200,
          daysPlayed: 20,
          companyValuation: 1000,
          playerWealth: 500,
        },
        {
          id: "negative-entry",
          score: -1,
          daysPlayed: -20,
          companyValuation: -1000,
          playerWealth: -500,
        },
      ]),
    );

    const entries = getLeaderboard();

    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("valid-entry");
  });

  it("filters persisted entries with non-number optional numeric fields", () => {
    mockStorage.setItem(
      "i-am-boss-leaderboard",
      JSON.stringify([
        {
          id: "valid-entry",
          score: 200,
          daysPlayed: 20,
          companyValuation: 1000,
          playerWealth: 500,
        },
        {
          id: "coerced-entry",
          score: 100,
          daysPlayed: 10,
          companyValuation: true,
          playerWealth: "",
        },
      ]),
    );

    const entries = getLeaderboard();

    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("valid-entry");
  });

  it("returns entries sorted by score descending", () => {
    addToLeaderboard({ daysPlayed: 10, companyValuation: 1000, playerWealth: 500 });
    addToLeaderboard({ daysPlayed: 500, companyValuation: 1_000_000, playerWealth: 500_000 });
    addToLeaderboard({ daysPlayed: 100, companyValuation: 50_000, playerWealth: 20_000 });

    const entries = getLeaderboard();
    expect(entries).toHaveLength(3);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].score).toBeGreaterThanOrEqual(entries[i].score);
    }
  });

  it("respects the limit parameter", () => {
    for (let i = 0; i < 15; i++) {
      addToLeaderboard({
        daysPlayed: i * 10,
        companyValuation: i * 10_000,
        playerWealth: i * 5_000,
      });
    }

    expect(getLeaderboard(5)).toHaveLength(5);
    expect(getLeaderboard(10)).toHaveLength(10);
    expect(getLeaderboard()).toHaveLength(15);
  });

  it("normalizes invalid limit parameters", () => {
    for (let i = 0; i < 3; i++) {
      addToLeaderboard({
        daysPlayed: i + 1,
        companyValuation: (i + 1) * 1000,
        playerWealth: 0,
      });
    }

    expect(getLeaderboard(-1)).toHaveLength(0);
    expect(getLeaderboard(Number.NaN)).toHaveLength(0);
    expect(getLeaderboard(1.8)).toHaveLength(1);
  });

  it("assigns correct sequential ranks", () => {
    addToLeaderboard({ daysPlayed: 10, companyValuation: 1000, playerWealth: 500 });
    addToLeaderboard({ daysPlayed: 200, companyValuation: 200_000, playerWealth: 100_000 });

    const entries = getLeaderboard();
    expect(entries[0].rank).toBe(1);
    expect(entries[1].rank).toBe(2);
  });
});

describe("clearLeaderboard", () => {
  it("removes all entries", () => {
    addToLeaderboard({ daysPlayed: 10, companyValuation: 1000, playerWealth: 500 });
    addToLeaderboard({ daysPlayed: 20, companyValuation: 2000, playerWealth: 1000 });
    expect(getLeaderboard()).toHaveLength(2);

    clearLeaderboard();
    expect(getLeaderboard()).toEqual([]);
  });
});

describe("exportLeaderboard", () => {
  it("returns valid JSON with sorted entries", () => {
    addToLeaderboard({ daysPlayed: 10, companyValuation: 1000, playerWealth: 500 });
    addToLeaderboard({ daysPlayed: 200, companyValuation: 200_000, playerWealth: 100_000 });

    const json = exportLeaderboard();
    const parsed = JSON.parse(json) as LeaderboardEntry[];

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].score).toBeGreaterThanOrEqual(parsed[1].score);
  });
});

describe("importLeaderboard", () => {
  it("imports entries from a valid JSON string", () => {
    const entries: LeaderboardEntry[] = [
      {
        id: "test-1",
        score: 500_000,
        daysPlayed: 300,
        companyValuation: 200_000,
        playerWealth: 99_700,
        gameOverReason: "retirement",
        date: "2026-01-01T00:00:00.000Z",
        rank: 0,
      },
      {
        id: "test-2",
        score: 100_000,
        daysPlayed: 50,
        companyValuation: 40_000,
        playerWealth: 19_950,
        gameOverReason: "bankruptcy",
        date: "2026-01-02T00:00:00.000Z",
        rank: 0,
      },
    ];

    importLeaderboard(JSON.stringify(entries));
    const result = getLeaderboard();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("test-1");
    expect(result[0].rank).toBe(1);
    expect(result[1].id).toBe("test-2");
    expect(result[1].rank).toBe(2);
  });

  it("replaces existing entries on import", () => {
    addToLeaderboard({ daysPlayed: 10, companyValuation: 1000, playerWealth: 500 });

    importLeaderboard(
      JSON.stringify([
        {
          id: "new-1",
          score: 999,
          daysPlayed: 1,
          companyValuation: 1,
          playerWealth: 1,
          gameOverReason: "death",
          date: "2026-01-01",
          rank: 0,
        },
      ]),
    );

    const result = getLeaderboard();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("new-1");
  });

  it("throws on non-array input", () => {
    expect(() => importLeaderboard("{}")).toThrow("Invalid leaderboard data: expected an array");
  });

  it("throws on entry missing required fields", () => {
    expect(() => importLeaderboard(JSON.stringify([{ foo: "bar" }]))).toThrow(
      "Invalid leaderboard entry: missing required numeric fields",
    );
  });

  it("throws on null entries", () => {
    expect(() => importLeaderboard("[null]")).toThrow(
      "Invalid leaderboard entry: expected an object",
    );
  });

  it("throws on required numeric fields that are not finite", () => {
    expect(() => importLeaderboard('[{"score":1e999,"daysPlayed":10}]')).toThrow(
      "Invalid leaderboard entry: invalid numeric field: score",
    );
  });

  it("throws on optional numeric fields that cannot be parsed", () => {
    expect(() =>
      importLeaderboard(
        JSON.stringify([
          {
            score: 100,
            daysPlayed: 10,
            companyValuation: "oops",
            playerWealth: 50,
          },
        ]),
      ),
    ).toThrow("Invalid leaderboard entry: invalid numeric field: companyValuation");
  });

  it("throws on optional numeric fields that are coercible non-numbers", () => {
    expect(() =>
      importLeaderboard(
        JSON.stringify([
          {
            score: 100,
            daysPlayed: 10,
            companyValuation: true,
            playerWealth: "",
          },
        ]),
      ),
    ).toThrow("Invalid leaderboard entry: invalid numeric field: companyValuation");
  });

  it("fills in defaults for optional fields", () => {
    importLeaderboard(JSON.stringify([{ score: 100, daysPlayed: 10 }]));
    const result = getLeaderboard();
    expect(result[0].companyValuation).toBe(0);
    expect(result[0].playerWealth).toBe(0);
    expect(result[0].gameOverReason).toBe("unknown");
  });
});

describe("leaderboard persistence roundtrip", () => {
  it("survives export then import", () => {
    addToLeaderboard({
      daysPlayed: 100,
      companyValuation: 100_000,
      playerWealth: 50_000,
      gameOverReason: "bankruptcy",
    });
    addToLeaderboard({
      daysPlayed: 300,
      companyValuation: 500_000,
      playerWealth: 200_000,
      gameOverReason: "retirement",
    });

    const exported = exportLeaderboard();
    clearLeaderboard();
    expect(getLeaderboard()).toEqual([]);

    importLeaderboard(exported);
    const restored = getLeaderboard();
    expect(restored).toHaveLength(2);
    expect(restored[0].score).toBeGreaterThanOrEqual(restored[1].score);
  });
});
