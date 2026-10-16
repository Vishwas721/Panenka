/**
 * Pure statistical calculation functions for Panenka.
 * These functions have no I/O dependencies and are fully unit-tested.
 * They are the single source of truth for all statistical computations.
 */

export interface PerformanceRecord {
  goals: number;
  assists: number;
  minutesPlayed: number | null;
  appeared: boolean; // true if STARTED or SUBSTITUTE_USED
  matchCompleted: boolean; // true if match status is COMPLETED
}

export interface PlayerStats {
  appearances: number;
  goals: number;
  assists: number;
  goalContributions: number;
  goalsPerAppearance: number | null;
  assistsPerAppearance: number | null;
  contributionsPerAppearance: number | null;
}

export interface GoalBreakdown {
  singleGoalMatches: number;
  braces: number;
  hatTricks: number;
  fourGoalMatches: number;
  fiveOrMoreGoalMatches: number;
}

export interface AssistBreakdown {
  singleAssistMatches: number;
  twoAssistMatches: number;
  threeAssistMatches: number;
  fourOrMoreAssistMatches: number;
}

export interface RecentForm {
  performances: PerformanceRecord[];
  sampleSize: number;
  totalAppearances: number;
  sufficient: boolean;
  goals: number;
  assists: number;
  goalContributions: number;
}

// ----- Core Calculations -----

/**
 * Calculate appearances: count of records where player appeared in a completed match.
 */
export function calcAppearances(performances: PerformanceRecord[]): number {
  return performances.filter((p) => p.appeared && p.matchCompleted).length;
}

/**
 * Calculate total goals from completed matches where the player appeared.
 */
export function calcGoals(performances: PerformanceRecord[]): number {
  return performances
    .filter((p) => p.appeared && p.matchCompleted)
    .reduce((sum, p) => sum + p.goals, 0);
}

/**
 * Calculate total assists from completed matches where the player appeared.
 */
export function calcAssists(performances: PerformanceRecord[]): number {
  return performances
    .filter((p) => p.appeared && p.matchCompleted)
    .reduce((sum, p) => sum + p.assists, 0);
}

/**
 * Calculate goal contributions (goals + assists).
 */
export function calcGoalContributions(performances: PerformanceRecord[]): number {
  return calcGoals(performances) + calcAssists(performances);
}

// ----- Rate Calculations -----

/**
 * Calculate a per-appearance rate.
 * Returns null when appearances is 0 to avoid division by zero.
 * Returns the unrounded value for accurate sorting/comparison.
 */
export function calcRate(metric: number, appearances: number): number | null {
  if (appearances === 0) return null;
  return metric / appearances;
}

/**
 * Check if a player is eligible for rate-based rankings.
 */
export function isEligibleForRateRanking(
  appearances: number,
  minAppearances: number,
): boolean {
  return appearances >= minAppearances;
}

// ----- Full Player Stats -----

/**
 * Calculate all stats for a player from their performance records.
 */
export function calcPlayerStats(performances: PerformanceRecord[]): PlayerStats {
  const appearances = calcAppearances(performances);
  const goals = calcGoals(performances);
  const assists = calcAssists(performances);
  const goalContributions = goals + assists;

  return {
    appearances,
    goals,
    assists,
    goalContributions,
    goalsPerAppearance: calcRate(goals, appearances),
    assistsPerAppearance: calcRate(assists, appearances),
    contributionsPerAppearance: calcRate(goalContributions, appearances),
  };
}

// ----- Goal & Assist Breakdown -----

/**
 * Calculate goal breakdown from completed appearances.
 * Categories use exact counts per match.
 */
export function calcGoalBreakdown(performances: PerformanceRecord[]): GoalBreakdown {
  const completedAppearances = performances.filter(
    (p) => p.appeared && p.matchCompleted,
  );

  let singleGoalMatches = 0;
  let braces = 0;
  let hatTricks = 0;
  let fourGoalMatches = 0;
  let fiveOrMoreGoalMatches = 0;

  for (const p of completedAppearances) {
    if (p.goals === 1) singleGoalMatches++;
    else if (p.goals === 2) braces++;
    else if (p.goals === 3) hatTricks++;
    else if (p.goals === 4) fourGoalMatches++;
    else if (p.goals >= 5) fiveOrMoreGoalMatches++;
  }

  return {
    singleGoalMatches,
    braces,
    hatTricks,
    fourGoalMatches,
    fiveOrMoreGoalMatches,
  };
}

/**
 * Calculate assist breakdown from completed appearances.
 */
export function calcAssistBreakdown(
  performances: PerformanceRecord[],
): AssistBreakdown {
  const completedAppearances = performances.filter(
    (p) => p.appeared && p.matchCompleted,
  );

  let singleAssistMatches = 0;
  let twoAssistMatches = 0;
  let threeAssistMatches = 0;
  let fourOrMoreAssistMatches = 0;

  for (const p of completedAppearances) {
    if (p.assists === 1) singleAssistMatches++;
    else if (p.assists === 2) twoAssistMatches++;
    else if (p.assists === 3) threeAssistMatches++;
    else if (p.assists >= 4) fourOrMoreAssistMatches++;
  }

  return {
    singleAssistMatches,
    twoAssistMatches,
    threeAssistMatches,
    fourOrMoreAssistMatches,
  };
}

// ----- Recent Form -----

/**
 * Calculate recent form from the last N completed appearances.
 * @param performances - All performances, already sorted by match date desc then createdAt desc
 * @param count - Number of recent appearances to consider (default: 5)
 * @param minForSufficiency - Minimum appearances for form to be "sufficient" (default: 3)
 */
export function calcRecentForm(
  performances: PerformanceRecord[],
  count = 5,
  minForSufficiency = 3,
): RecentForm {
  const completedAppearances = performances.filter(
    (p) => p.appeared && p.matchCompleted,
  );
  const totalAppearances = completedAppearances.length;
  const recent = completedAppearances.slice(0, count);
  const sampleSize = recent.length;

  const goals = recent.reduce((sum, p) => sum + p.goals, 0);
  const assists = recent.reduce((sum, p) => sum + p.assists, 0);

  return {
    performances: recent,
    sampleSize,
    totalAppearances,
    sufficient: sampleSize >= minForSufficiency,
    goals,
    assists,
    goalContributions: goals + assists,
  };
}

// ----- Tiebreaking -----

export interface RankablePlayer {
  id: string;
  fullName: string;
  primaryMetric: number;
  appearances: number;
  totalMinutes: number | null;
}

/**
 * Compare two players for ranking purposes.
 * Tiebreak order: primary metric desc, appearances desc, fewer total minutes asc, name asc.
 */
export function compareForRanking(a: RankablePlayer, b: RankablePlayer): number {
  // 1. Primary metric descending
  if (b.primaryMetric !== a.primaryMetric) return b.primaryMetric - a.primaryMetric;
  // 2. More appearances descending
  if (b.appearances !== a.appearances) return b.appearances - a.appearances;
  // 3. Fewer total minutes ascending (null sorts last)
  if (a.totalMinutes !== null && b.totalMinutes !== null) {
    if (a.totalMinutes !== b.totalMinutes) return a.totalMinutes - b.totalMinutes;
  } else if (a.totalMinutes !== null) {
    return -1; // a has minutes, b doesn't — a goes first
  } else if (b.totalMinutes !== null) {
    return 1; // b has minutes, a doesn't — b goes first
  }
  // 4. Name alphabetical ascending
  return a.fullName.localeCompare(b.fullName);
}
