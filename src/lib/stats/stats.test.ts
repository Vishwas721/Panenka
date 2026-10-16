import { describe, it, expect } from "vitest";
import {
  calcAppearances,
  calcGoals,
  calcAssists,
  calcGoalContributions,
  calcRate,
  isEligibleForRateRanking,
  calcPlayerStats,
  calcGoalBreakdown,
  calcAssistBreakdown,
  calcRecentForm,
  compareForRanking,
  type PerformanceRecord,
  type RankablePlayer,
} from "./index";

// Helper to create a performance record
function perf(overrides: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    goals: 0,
    assists: 0,
    minutesPlayed: 90,
    appeared: true,
    matchCompleted: true,
    ...overrides,
  };
}

describe("calcAppearances", () => {
  it("returns 0 for empty array", () => {
    expect(calcAppearances([])).toBe(0);
  });

  it("counts only completed matches where player appeared", () => {
    const performances = [
      perf(), // appeared + completed = counted
      perf({ appeared: false }), // not appeared = not counted
      perf({ matchCompleted: false }), // not completed = not counted
      perf({ appeared: false, matchCompleted: false }), // neither
      perf(), // another valid one
    ];
    expect(calcAppearances(performances)).toBe(2);
  });

  it("handles mixed scenarios with varied match states", () => {
    const performances = [
      perf({ appeared: true, matchCompleted: true }),
      perf({ appeared: false, matchCompleted: true }),
      perf({ appeared: true, matchCompleted: false }),
      perf({ appeared: false, matchCompleted: false }),
    ];
    expect(calcAppearances(performances)).toBe(1);
  });
});

describe("calcGoals", () => {
  it("returns 0 for empty array", () => {
    expect(calcGoals([])).toBe(0);
  });

  it("sums goals only from completed appearances", () => {
    const performances = [
      perf({ goals: 2 }),
      perf({ goals: 3 }),
      perf({ goals: 1, appeared: false }), // not counted
      perf({ goals: 4, matchCompleted: false }), // not counted
      perf({ goals: 5, appeared: false, matchCompleted: false }), // not counted
    ];
    expect(calcGoals(performances)).toBe(5);
  });

  it("handles zero goals", () => {
    expect(calcGoals([perf({ goals: 0 })])).toBe(0);
  });

  it("handles multiple appearances with mixed goals", () => {
    const performances = [
      perf({ goals: 0 }),
      perf({ goals: 1 }),
      perf({ goals: 2 }),
      perf({ goals: 3 }),
    ];
    expect(calcGoals(performances)).toBe(6);
  });
});

describe("calcAssists", () => {
  it("returns 0 for empty array", () => {
    expect(calcAssists([])).toBe(0);
  });

  it("sums assists only from completed appearances", () => {
    const performances = [
      perf({ assists: 1 }),
      perf({ assists: 2 }),
      perf({ assists: 3, appeared: false }),
      perf({ assists: 4, matchCompleted: false }),
    ];
    expect(calcAssists(performances)).toBe(3);
  });

  it("handles zero assists", () => {
    expect(calcAssists([perf({ assists: 0 })])).toBe(0);
  });
});

describe("calcGoalContributions", () => {
  it("returns goals + assists", () => {
    const performances = [
      perf({ goals: 2, assists: 1 }),
      perf({ goals: 1, assists: 3 }),
    ];
    expect(calcGoalContributions(performances)).toBe(7);
  });

  it("returns 0 for empty array", () => {
    expect(calcGoalContributions([])).toBe(0);
  });

  it("ignores non-completed matches and unappeared records", () => {
    const performances = [
      perf({ goals: 2, assists: 1 }),
      perf({ goals: 5, assists: 5, appeared: false }),
      perf({ goals: 3, assists: 2, matchCompleted: false }),
    ];
    expect(calcGoalContributions(performances)).toBe(3);
  });
});

describe("calcRate", () => {
  it("returns null when appearances is 0", () => {
    expect(calcRate(5, 0)).toBeNull();
    expect(calcRate(0, 0)).toBeNull();
  });

  it("calculates correct rate", () => {
    expect(calcRate(10, 4)).toBe(2.5);
    expect(calcRate(0, 5)).toBe(0);
  });

  it("returns unrounded value", () => {
    expect(calcRate(1, 3)).toBeCloseTo(0.333333, 5);
    expect(calcRate(2, 3)).toBeCloseTo(0.666667, 5);
  });
});

describe("isEligibleForRateRanking", () => {
  it("returns false below threshold", () => {
    expect(isEligibleForRateRanking(2, 3)).toBe(false);
    expect(isEligibleForRateRanking(0, 1)).toBe(false);
  });

  it("returns true at threshold", () => {
    expect(isEligibleForRateRanking(3, 3)).toBe(true);
    expect(isEligibleForRateRanking(0, 0)).toBe(true);
  });

  it("returns true above threshold", () => {
    expect(isEligibleForRateRanking(10, 3)).toBe(true);
  });
});

describe("calcPlayerStats", () => {
  it("calculates all stats correctly", () => {
    const performances = [
      perf({ goals: 2, assists: 1 }),
      perf({ goals: 0, assists: 2 }),
      perf({ goals: 1, assists: 0 }),
      perf({ goals: 3, appeared: false }), // not counted
      perf({ goals: 2, assists: 1, matchCompleted: false }), // not counted
    ];
    const stats = calcPlayerStats(performances);
    expect(stats.appearances).toBe(3);
    expect(stats.goals).toBe(3);
    expect(stats.assists).toBe(3);
    expect(stats.goalContributions).toBe(6);
    expect(stats.goalsPerAppearance).toBe(1);
    expect(stats.assistsPerAppearance).toBe(1);
    expect(stats.contributionsPerAppearance).toBe(2);
  });

  it("returns null rates for zero appearances", () => {
    const stats = calcPlayerStats([]);
    expect(stats.appearances).toBe(0);
    expect(stats.goals).toBe(0);
    expect(stats.assists).toBe(0);
    expect(stats.goalContributions).toBe(0);
    expect(stats.goalsPerAppearance).toBeNull();
    expect(stats.assistsPerAppearance).toBeNull();
    expect(stats.contributionsPerAppearance).toBeNull();
  });

  it("returns null rates when player only has non-completed or unappeared matches", () => {
    const stats = calcPlayerStats([
      perf({ goals: 4, assists: 2, appeared: false }),
      perf({ goals: 1, assists: 1, matchCompleted: false }),
    ]);
    expect(stats.appearances).toBe(0);
    expect(stats.goals).toBe(0);
    expect(stats.assists).toBe(0);
    expect(stats.goalContributions).toBe(0);
    expect(stats.goalsPerAppearance).toBeNull();
    expect(stats.assistsPerAppearance).toBeNull();
    expect(stats.contributionsPerAppearance).toBeNull();
  });
});

describe("calcGoalBreakdown", () => {
  it("returns all zeros for empty array", () => {
    const bd = calcGoalBreakdown([]);
    expect(bd.singleGoalMatches).toBe(0);
    expect(bd.braces).toBe(0);
    expect(bd.hatTricks).toBe(0);
    expect(bd.fourGoalMatches).toBe(0);
    expect(bd.fiveOrMoreGoalMatches).toBe(0);
  });

  it("correctly categorizes goal counts", () => {
    const performances = [
      perf({ goals: 0 }), // not counted in any category
      perf({ goals: 1 }), // single
      perf({ goals: 2 }), // brace
      perf({ goals: 3 }), // hat-trick
      perf({ goals: 4 }), // four
      perf({ goals: 5 }), // five+
      perf({ goals: 6 }), // five+
      perf({ goals: 1 }), // single
      perf({ goals: 3, appeared: false }), // not counted
    ];
    const bd = calcGoalBreakdown(performances);
    expect(bd.singleGoalMatches).toBe(2);
    expect(bd.braces).toBe(1);
    expect(bd.hatTricks).toBe(1);
    expect(bd.fourGoalMatches).toBe(1);
    expect(bd.fiveOrMoreGoalMatches).toBe(2);
  });

  it("ignores non-completed matches", () => {
    const performances = [
      perf({ goals: 3, matchCompleted: false }),
      perf({ goals: 2, appeared: false }),
    ];
    const bd = calcGoalBreakdown(performances);
    expect(bd.singleGoalMatches).toBe(0);
    expect(bd.braces).toBe(0);
    expect(bd.hatTricks).toBe(0);
    expect(bd.fourGoalMatches).toBe(0);
    expect(bd.fiveOrMoreGoalMatches).toBe(0);
  });
});

describe("calcAssistBreakdown", () => {
  it("returns all zeros for empty array", () => {
    const bd = calcAssistBreakdown([]);
    expect(bd.singleAssistMatches).toBe(0);
    expect(bd.twoAssistMatches).toBe(0);
    expect(bd.threeAssistMatches).toBe(0);
    expect(bd.fourOrMoreAssistMatches).toBe(0);
  });

  it("correctly categorizes assist counts", () => {
    const performances = [
      perf({ assists: 0 }),
      perf({ assists: 1 }),
      perf({ assists: 2 }),
      perf({ assists: 3 }),
      perf({ assists: 4 }),
      perf({ assists: 5 }),
      perf({ assists: 1 }),
      perf({ assists: 3, appeared: false }), // not counted
      perf({ assists: 2, matchCompleted: false }), // not counted
    ];
    const bd = calcAssistBreakdown(performances);
    expect(bd.singleAssistMatches).toBe(2);
    expect(bd.twoAssistMatches).toBe(1);
    expect(bd.threeAssistMatches).toBe(1);
    expect(bd.fourOrMoreAssistMatches).toBe(2);
  });
});

describe("calcRecentForm", () => {
  it("returns insufficient for empty array", () => {
    const form = calcRecentForm([]);
    expect(form.sufficient).toBe(false);
    expect(form.sampleSize).toBe(0);
    expect(form.totalAppearances).toBe(0);
    expect(form.goals).toBe(0);
    expect(form.assists).toBe(0);
    expect(form.goalContributions).toBe(0);
    expect(form.performances).toEqual([]);
  });

  it("returns insufficient for fewer than 3 appearances", () => {
    const form = calcRecentForm([perf({ goals: 1 }), perf({ goals: 2 })]);
    expect(form.sufficient).toBe(false);
    expect(form.sampleSize).toBe(2);
    expect(form.totalAppearances).toBe(2);
    expect(form.goals).toBe(3);
  });

  it("returns sufficient for 3+ appearances", () => {
    const perfs = [perf(), perf(), perf()];
    const form = calcRecentForm(perfs);
    expect(form.sufficient).toBe(true);
    expect(form.sampleSize).toBe(3);
    expect(form.totalAppearances).toBe(3);
  });

  it("handles exactly 5 appearances", () => {
    const perfs = [
      perf({ goals: 1 }),
      perf({ goals: 2 }),
      perf({ goals: 0 }),
      perf({ goals: 1 }),
      perf({ goals: 3 }),
    ];
    const form = calcRecentForm(perfs);
    expect(form.sampleSize).toBe(5);
    expect(form.totalAppearances).toBe(5);
    expect(form.sufficient).toBe(true);
    expect(form.goals).toBe(7);
  });

  it("takes only last N appearances (default 5)", () => {
    const perfs = [
      perf({ goals: 1 }),
      perf({ goals: 2 }),
      perf({ goals: 3 }),
      perf({ goals: 4 }),
      perf({ goals: 5 }),
      perf({ goals: 100 }), // 6th, should be excluded
    ];
    const form = calcRecentForm(perfs);
    expect(form.sampleSize).toBe(5);
    expect(form.goals).toBe(15); // 1+2+3+4+5
    expect(form.totalAppearances).toBe(6);
    expect(form.performances).toHaveLength(5);
  });

  it("filters out non-completed and non-appeared records", () => {
    const perfs = [
      perf({ goals: 1 }),
      perf({ goals: 2, matchCompleted: false }),
      perf({ goals: 3, appeared: false }),
      perf({ goals: 4 }),
    ];
    const form = calcRecentForm(perfs);
    expect(form.sampleSize).toBe(2);
    expect(form.totalAppearances).toBe(2);
    expect(form.goals).toBe(5);
    expect(form.sufficient).toBe(false);
  });

  it("computes goalContributions correctly", () => {
    const perfs = [
      perf({ goals: 2, assists: 1 }),
      perf({ goals: 0, assists: 3 }),
      perf({ goals: 1, assists: 0 }),
    ];
    const form = calcRecentForm(perfs);
    expect(form.goals).toBe(3);
    expect(form.assists).toBe(4);
    expect(form.goalContributions).toBe(7);
  });

  it("supports custom count and minForSufficiency parameters", () => {
    const perfs = [
      perf({ goals: 1 }),
      perf({ goals: 2 }),
      perf({ goals: 3 }),
      perf({ goals: 4 }),
    ];
    const form = calcRecentForm(perfs, 2, 2);
    expect(form.sampleSize).toBe(2);
    expect(form.totalAppearances).toBe(4);
    expect(form.sufficient).toBe(true);
    expect(form.goals).toBe(3); // 1 + 2
  });
});

describe("compareForRanking", () => {
  function player(overrides: Partial<RankablePlayer> = {}): RankablePlayer {
    return {
      id: "1",
      fullName: "Player A",
      primaryMetric: 10,
      appearances: 5,
      totalMinutes: 450,
      ...overrides,
    };
  }

  it("sorts by primary metric descending", () => {
    const a = player({ primaryMetric: 10 });
    const b = player({ primaryMetric: 5 });
    expect(compareForRanking(a, b)).toBeLessThan(0);
    expect(compareForRanking(b, a)).toBeGreaterThan(0);
  });

  it("breaks tie with more appearances", () => {
    const a = player({ primaryMetric: 10, appearances: 5 });
    const b = player({ primaryMetric: 10, appearances: 8 });
    expect(compareForRanking(a, b)).toBeGreaterThan(0);
    expect(compareForRanking(b, a)).toBeLessThan(0);
  });

  it("breaks tie with fewer minutes", () => {
    const a = player({ primaryMetric: 10, appearances: 5, totalMinutes: 400 });
    const b = player({ primaryMetric: 10, appearances: 5, totalMinutes: 450 });
    expect(compareForRanking(a, b)).toBeLessThan(0);
    expect(compareForRanking(b, a)).toBeGreaterThan(0);
  });

  it("breaks tie with name alphabetically", () => {
    const a = player({ primaryMetric: 10, appearances: 5, totalMinutes: 450, fullName: "Alpha" });
    const b = player({ primaryMetric: 10, appearances: 5, totalMinutes: 450, fullName: "Beta" });
    expect(compareForRanking(a, b)).toBeLessThan(0);
    expect(compareForRanking(b, a)).toBeGreaterThan(0);
  });

  it("handles null minutes (player with minutes sorts first)", () => {
    const a = player({ primaryMetric: 10, appearances: 5, totalMinutes: 450 });
    const b = player({ primaryMetric: 10, appearances: 5, totalMinutes: null });
    expect(compareForRanking(a, b)).toBeLessThan(0);
    expect(compareForRanking(b, a)).toBeGreaterThan(0);
  });

  it("handles both null minutes (falls through to name)", () => {
    const a = player({ primaryMetric: 10, appearances: 5, totalMinutes: null, fullName: "Zeta" });
    const b = player({ primaryMetric: 10, appearances: 5, totalMinutes: null, fullName: "Alpha" });
    expect(compareForRanking(a, b)).toBeGreaterThan(0);
    expect(compareForRanking(b, a)).toBeLessThan(0);
  });

  it("returns 0 for identical players", () => {
    const a = player({ fullName: "Same Name" });
    const b = player({ fullName: "Same Name" });
    expect(compareForRanking(a, b)).toBe(0);
  });
});
