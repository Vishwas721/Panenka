/**
 * Advanced per-player profile engine.
 *
 * Everything here is derived from four per-match inputs (rating, goals,
 * assists, man of the match) plus the match context that is already recorded
 * (date, opponent, venue, score, competition, minutes, start/sub).
 *
 * Pure functions only: no I/O, no Prisma, no Date.now().
 */

export type Venue = "HOME" | "AWAY" | "NEUTRAL" | null;
export type Result = "W" | "D" | "L" | null;

/** One completed appearance by a player. */
export interface MatchRecord {
  matchId: string;
  date: string; // ISO
  opponent: string;
  competitionId: string | null;
  competitionName: string | null;
  season: string | null;
  venue: Venue;
  goalsFor: number | null;
  goalsAgainst: number | null;
  started: boolean;
  minutes: number | null;
  goals: number;
  assists: number;
  rating: number | null;
  motm: boolean;
}

export interface Streak {
  current: number;
  best: number;
}

export interface SplitLine {
  key: string;
  label: string;
  apps: number;
  goals: number;
  assists: number;
  motm: number;
  avgRating: number | null;
  wins: number;
  draws: number;
  losses: number;
}

export interface TimelinePoint {
  matchId: string;
  date: string;
  opponent: string;
  competitionName: string | null;
  venue: Venue;
  result: Result;
  goalsFor: number | null;
  goalsAgainst: number | null;
  rating: number | null;
  goals: number;
  assists: number;
  motm: boolean;
  started: boolean;
  minutes: number | null;
  rollingRating: number | null;
  cumulativeGoals: number;
  cumulativeAssists: number;
  matchScore: number;
}

export interface RatingProfile {
  rated: number;
  avg: number | null;
  median: number | null;
  best: number | null;
  worst: number | null;
  stdDev: number | null;
  last5: number | null;
  last10: number | null;
  /** Rating change per match from a least-squares fit; positive = improving. */
  trend: number | null;
  sevenPlusPct: number | null;
  eightPlus: number;
  ninePlus: number;
  perfectTens: number;
  subSix: number;
  distribution: { label: string; min: number; max: number; count: number }[];
}

export interface Milestone {
  metric: "goals" | "assists" | "ga" | "apps" | "motm";
  label: string;
  current: number;
  target: number;
  remaining: number;
}

export interface PlayerProfile {
  apps: number;
  starts: number;
  subApps: number;
  minutes: number | null;
  goals: number;
  assists: number;
  ga: number;
  motm: number;
  perApp: { goals: number; assists: number; ga: number; motm: number } | null;
  per90: { goals: number; assists: number; ga: number } | null;
  minutesPerGoal: number | null;
  minutesPerGA: number | null;
  rating: RatingProfile;
  record: {
    wins: number;
    draws: number;
    losses: number;
    known: number;
    winRate: number | null;
    ppg: number | null;
    ratingByResult: Record<"W" | "D" | "L", number | null>;
    goalsByResult: Record<"W" | "D" | "L", number>;
    matchWinners: number;
    consolationGoals: number;
    drawScorer: number;
  };
  teamShare: { teamGoals: number; involvement: number | null; goalShare: number | null };
  /**
   * Team defending while the player was on the pitch. A clean sheet only counts
   * when the player started or played 60+ minutes, so cameo subs don't collect them.
   */
  defence: {
    games: number;
    cleanSheets: number;
    cleanSheetRate: number | null;
    conceded: number;
    concededPerApp: number | null;
  };
  hauls: {
    goals: { one: number; two: number; three: number; four: number; fivePlus: number };
    assists: { one: number; two: number; three: number; fourPlus: number };
    fullPackage: number;
    gaHauls: number;
    blanks: number;
    scoredIn: number;
    assistedIn: number;
    contributedIn: number;
  };
  streaks: {
    scoring: Streak;
    assisting: Streak;
    contributing: Streak;
    blank: Streak;
    motm: Streak;
    rating7: Streak;
    rating8: Streak;
    unbeaten: Streak;
    winning: Streak;
    cleanSheet: Streak;
  };
  splits: {
    venue: SplitLine[];
    role: SplitLine[];
    competition: SplitLine[];
    season: SplitLine[];
    opponent: SplitLine[];
    month: SplitLine[];
    weekday: SplitLine[];
  };
  superSub: { goals: number; assists: number; motm: number };
  bounceBacks: number;
  silentMaestro: number;
  bestPerformances: TimelinePoint[];
  worstPerformance: TimelinePoint | null;
  timeline: TimelinePoint[];
  form: TimelinePoint[];
  milestones: Milestone[];
  firsts: {
    debut: TimelinePoint | null;
    firstGoal: TimelinePoint | null;
    firstAssist: TimelinePoint | null;
    firstMotm: TimelinePoint | null;
    latest: TimelinePoint | null;
  };
  distinct: { opponents: number; opponentsScoredAgainst: number; competitions: number; seasons: number; monthsWithGoal: number };
  bests: {
    seasonGoals: number;
    seasonAssists: number;
    seasonMotm: number;
    monthGoals: number;
    matchGoals: number;
    matchAssists: number;
    matchGA: number;
  };
  weekendGoals: number;
  midweekGoals: number;
  bigWins: number;
  thrillers: number;
}

// ----- helpers -----

const round = (n: number, dp = 2) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

export function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function stdDev(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const m = mean(xs)!;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
}

/** Least-squares slope of ys over their index. */
export function slope(ys: number[]): number | null {
  if (ys.length < 3) return null;
  const n = ys.length;
  const mx = (n - 1) / 2;
  const my = mean(ys)!;
  let num = 0;
  let den = 0;
  ys.forEach((y, i) => {
    num += (i - mx) * (y - my);
    den += (i - mx) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

export function resultOf(goalsFor: number | null, goalsAgainst: number | null): Result {
  if (goalsFor === null || goalsAgainst === null) return null;
  if (goalsFor > goalsAgainst) return "W";
  if (goalsFor < goalsAgainst) return "L";
  return "D";
}

/**
 * Map stored home/away scores to the player's team perspective.
 * Away fixtures flip the score; home and neutral read as recorded.
 */
export function teamScore(
  venue: Venue,
  scoreHome: number | null,
  scoreAway: number | null,
): { goalsFor: number | null; goalsAgainst: number | null } {
  if (scoreHome === null || scoreAway === null) return { goalsFor: null, goalsAgainst: null };
  return venue === "AWAY"
    ? { goalsFor: scoreAway, goalsAgainst: scoreHome }
    : { goalsFor: scoreHome, goalsAgainst: scoreAway };
}

/** Single number used to rank individual performances. */
export function matchScore(r: Pick<MatchRecord, "rating" | "goals" | "assists" | "motm">): number {
  const base = r.rating !== null ? r.rating * 10 : 62;
  return round(base + r.goals * 9 + r.assists * 6 + (r.motm ? 8 : 0), 1);
}

const countsForDefence = (t: TimelinePoint) => t.started || (t.minutes ?? 0) >= 60;

function streak(flags: boolean[]): Streak {
  let best = 0;
  let run = 0;
  for (const f of flags) {
    run = f ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current: run, best };
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Season key ("2026-10") and label ("Oct 2026") for a match date. */
export function seasonOf(date: string | Date): { key: string; label: string } {
  const d = new Date(date);
  return { key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`, label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` };
}

function splitBy(
  rows: TimelinePoint[],
  keyOf: (r: TimelinePoint) => { key: string; label: string } | null,
): SplitLine[] {
  const map = new Map<string, { label: string; rows: TimelinePoint[] }>();
  for (const r of rows) {
    const k = keyOf(r);
    if (!k) continue;
    const entry = map.get(k.key) ?? { label: k.label, rows: [] };
    entry.rows.push(r);
    map.set(k.key, entry);
  }
  return [...map.entries()].map(([key, { label, rows: rs }]) => {
    const ratings = rs.map((r) => r.rating).filter((x): x is number => x !== null);
    const avg = mean(ratings);
    return {
      key,
      label,
      apps: rs.length,
      goals: rs.reduce((a, r) => a + r.goals, 0),
      assists: rs.reduce((a, r) => a + r.assists, 0),
      motm: rs.filter((r) => r.motm).length,
      avgRating: avg === null ? null : round(avg),
      wins: rs.filter((r) => r.result === "W").length,
      draws: rs.filter((r) => r.result === "D").length,
      losses: rs.filter((r) => r.result === "L").length,
    };
  });
}

const MILESTONE_STEPS = [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

function nextMilestone(metric: Milestone["metric"], label: string, current: number): Milestone {
  const target = MILESTONE_STEPS.find((s) => s > current) ?? Math.ceil((current + 1) / 500) * 500;
  return { metric, label, current, target, remaining: target - current };
}

// ----- main -----

/**
 * Build the full profile. `records` may be in any order; they are sorted
 * chronologically (oldest first) internally.
 */
export function buildProfile(records: MatchRecord[]): PlayerProfile {
  const sorted = [...records].sort((a, b) =>
    a.date === b.date ? a.matchId.localeCompare(b.matchId) : a.date < b.date ? -1 : 1,
  );

  // Timeline with rolling 5-match rating & cumulative totals
  let cg = 0;
  let ca = 0;
  const timeline: TimelinePoint[] = sorted.map((r, i) => {
    cg += r.goals;
    ca += r.assists;
    const window = sorted
      .slice(Math.max(0, i - 4), i + 1)
      .map((x) => x.rating)
      .filter((x): x is number => x !== null);
    const rolling = mean(window);
    return {
      matchId: r.matchId,
      date: r.date,
      opponent: r.opponent,
      competitionName: r.competitionName,
      venue: r.venue,
      result: resultOf(r.goalsFor, r.goalsAgainst),
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      rating: r.rating,
      goals: r.goals,
      assists: r.assists,
      motm: r.motm,
      started: r.started,
      minutes: r.minutes,
      rollingRating: rolling === null ? null : round(rolling),
      cumulativeGoals: cg,
      cumulativeAssists: ca,
      matchScore: matchScore(r),
    };
  });

  const apps = sorted.length;
  const goals = cg;
  const assists = ca;
  const ga = goals + assists;
  const motm = sorted.filter((r) => r.motm).length;
  const starts = sorted.filter((r) => r.started).length;

  const withMinutes = sorted.filter((r) => r.minutes !== null);
  const minutes = withMinutes.length > 0 ? withMinutes.reduce((a, r) => a + (r.minutes ?? 0), 0) : null;
  const minGoals = withMinutes.reduce((a, r) => a + r.goals, 0);
  const minAssists = withMinutes.reduce((a, r) => a + r.assists, 0);
  const per90 =
    minutes && minutes >= 90
      ? {
          goals: round((minGoals / minutes) * 90),
          assists: round((minAssists / minutes) * 90),
          ga: round(((minGoals + minAssists) / minutes) * 90),
        }
      : null;

  // Ratings
  const ratings = sorted.map((r) => r.rating).filter((x): x is number => x !== null);
  const recentRatings = [...ratings].reverse();
  const buckets = [
    { label: "<5", min: 0, max: 5 },
    { label: "5", min: 5, max: 6 },
    { label: "6", min: 6, max: 7 },
    { label: "7", min: 7, max: 8 },
    { label: "8", min: 8, max: 9 },
    { label: "9", min: 9, max: 10 },
    { label: "10", min: 10, max: 11 },
  ];
  const avgRating = mean(ratings);
  const sd = stdDev(ratings);
  const rating: RatingProfile = {
    rated: ratings.length,
    avg: avgRating === null ? null : round(avgRating),
    median: ratings.length ? round(median(ratings)!) : null,
    best: ratings.length ? Math.max(...ratings) : null,
    worst: ratings.length ? Math.min(...ratings) : null,
    stdDev: sd === null ? null : round(sd),
    last5: recentRatings.length ? round(mean(recentRatings.slice(0, 5))!) : null,
    last10: recentRatings.length ? round(mean(recentRatings.slice(0, 10))!) : null,
    trend: (() => {
      const s = slope(ratings.slice(-15));
      return s === null ? null : round(s, 3);
    })(),
    sevenPlusPct: ratings.length ? round(ratings.filter((x) => x >= 7).length / ratings.length, 3) : null,
    eightPlus: ratings.filter((x) => x >= 8).length,
    ninePlus: ratings.filter((x) => x >= 9).length,
    perfectTens: ratings.filter((x) => x >= 10).length,
    subSix: ratings.filter((x) => x < 6).length,
    distribution: buckets.map((b) => ({
      ...b,
      count: ratings.filter((x) => x >= b.min && x < b.max).length,
    })),
  };

  // Results
  const withResult = timeline.filter((t) => t.result !== null);
  const wins = withResult.filter((t) => t.result === "W").length;
  const draws = withResult.filter((t) => t.result === "D").length;
  const losses = withResult.filter((t) => t.result === "L").length;
  const ratingIn = (res: "W" | "D" | "L") => {
    const m = mean(
      timeline.filter((t) => t.result === res && t.rating !== null).map((t) => t.rating as number),
    );
    return m === null ? null : round(m);
  };
  const goalsIn = (res: "W" | "D" | "L") =>
    timeline.filter((t) => t.result === res).reduce((a, t) => a + t.goals, 0);

  const teamGoals = withResult.reduce((a, t) => a + (t.goalsFor ?? 0), 0);
  const gaInScored = withResult.reduce((a, t) => a + t.goals + t.assists, 0);
  const goalsInScored = withResult.reduce((a, t) => a + t.goals, 0);

  // Defence: only games the player meaningfully featured in
  const defGames = withResult.filter(countsForDefence);
  const conceded = defGames.reduce((a, t) => a + (t.goalsAgainst ?? 0), 0);
  const cleanSheets = defGames.filter((t) => t.goalsAgainst === 0).length;

  // Streaks (chronological)
  const streaks = {
    scoring: streak(timeline.map((t) => t.goals > 0)),
    assisting: streak(timeline.map((t) => t.assists > 0)),
    contributing: streak(timeline.map((t) => t.goals + t.assists > 0)),
    blank: streak(timeline.map((t) => t.goals + t.assists === 0)),
    motm: streak(timeline.map((t) => t.motm)),
    rating7: streak(timeline.filter((t) => t.rating !== null).map((t) => (t.rating as number) >= 7)),
    rating8: streak(timeline.filter((t) => t.rating !== null).map((t) => (t.rating as number) >= 8)),
    unbeaten: streak(withResult.map((t) => t.result !== "L")),
    winning: streak(withResult.map((t) => t.result === "W")),
    cleanSheet: streak(withResult.filter(countsForDefence).map((t) => t.goalsAgainst === 0)),
  };

  const count = (pred: (t: TimelinePoint) => boolean) => timeline.filter(pred).length;

  // Splits
  const venue = splitBy(timeline, (t) =>
    t.venue ? { key: t.venue, label: t.venue === "HOME" ? "Home" : t.venue === "AWAY" ? "Away" : "Neutral" } : null,
  );
  const role = splitBy(timeline, (t) =>
    t.started ? { key: "START", label: "Starter" } : { key: "SUB", label: "Off the bench" },
  );
  const competition = splitBy(timeline, (t) => {
    const r = sorted.find((s) => s.matchId === t.matchId)!;
    return r.competitionId
      ? { key: r.competitionId, label: r.competitionName + (r.season ? ` ${r.season}` : "") }
      : { key: "none", label: "Friendlies & other" };
  });
  // A season is one calendar month, matching eFootball's division cycle.
  const season = splitBy(timeline, (t) => seasonOf(t.date));
  const opponent = splitBy(timeline, (t) => ({ key: t.opponent.trim().toLowerCase(), label: t.opponent.trim() }));
  const month = splitBy(timeline, (t) => {
    const d = new Date(t.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { key, label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` };
  });
  const weekday = splitBy(timeline, (t) => {
    const d = new Date(t.date).getUTCDay();
    return { key: String(d), label: WEEKDAYS[d]! };
  }).sort((a, b) => Number(a.key) - Number(b.key));

  let bounceBacks = 0;
  const rated = timeline.filter((t) => t.rating !== null);
  for (let i = 1; i < rated.length; i++) {
    if ((rated[i]!.rating as number) - (rated[i - 1]!.rating as number) >= 2) bounceBacks++;
  }

  const byScore = [...timeline].sort((a, b) => b.matchScore - a.matchScore);
  const weekendGoals = timeline
    .filter((t) => [0, 6].includes(new Date(t.date).getUTCDay()))
    .reduce((a, t) => a + t.goals, 0);

  return {
    apps,
    starts,
    subApps: apps - starts,
    minutes,
    goals,
    assists,
    ga,
    motm,
    perApp: apps
      ? { goals: round(goals / apps), assists: round(assists / apps), ga: round(ga / apps), motm: round(motm / apps, 3) }
      : null,
    per90,
    minutesPerGoal: minutes && minGoals ? Math.round(minutes / minGoals) : null,
    minutesPerGA: minutes && minGoals + minAssists ? Math.round(minutes / (minGoals + minAssists)) : null,
    rating,
    record: {
      wins,
      draws,
      losses,
      known: withResult.length,
      winRate: withResult.length ? round(wins / withResult.length, 3) : null,
      ppg: withResult.length ? round((wins * 3 + draws) / withResult.length) : null,
      ratingByResult: { W: ratingIn("W"), D: ratingIn("D"), L: ratingIn("L") },
      goalsByResult: { W: goalsIn("W"), D: goalsIn("D"), L: goalsIn("L") },
      matchWinners: count(
        (t) => t.result === "W" && t.goals > 0 && (t.goalsFor ?? 0) - (t.goalsAgainst ?? 0) === 1,
      ),
      consolationGoals: goalsIn("L"),
      drawScorer: count((t) => t.result === "D" && t.goals > 0),
    },
    teamShare: {
      teamGoals,
      involvement: teamGoals ? round(Math.min(1, gaInScored / teamGoals), 3) : null,
      goalShare: teamGoals ? round(Math.min(1, goalsInScored / teamGoals), 3) : null,
    },
    defence: {
      games: defGames.length,
      cleanSheets,
      cleanSheetRate: defGames.length ? round(cleanSheets / defGames.length, 3) : null,
      conceded,
      concededPerApp: defGames.length ? round(conceded / defGames.length) : null,
    },
    hauls: {
      goals: {
        one: count((t) => t.goals === 1),
        two: count((t) => t.goals === 2),
        three: count((t) => t.goals === 3),
        four: count((t) => t.goals === 4),
        fivePlus: count((t) => t.goals >= 5),
      },
      assists: {
        one: count((t) => t.assists === 1),
        two: count((t) => t.assists === 2),
        three: count((t) => t.assists === 3),
        fourPlus: count((t) => t.assists >= 4),
      },
      fullPackage: count((t) => t.goals > 0 && t.assists > 0),
      gaHauls: count((t) => t.goals + t.assists >= 3),
      blanks: count((t) => t.goals + t.assists === 0),
      scoredIn: count((t) => t.goals > 0),
      assistedIn: count((t) => t.assists > 0),
      contributedIn: count((t) => t.goals + t.assists > 0),
    },
    streaks,
    splits: { venue, role, competition, season, opponent, month, weekday },
    superSub: {
      goals: timeline.filter((t) => !t.started).reduce((a, t) => a + t.goals, 0),
      assists: timeline.filter((t) => !t.started).reduce((a, t) => a + t.assists, 0),
      motm: count((t) => !t.started && t.motm),
    },
    bounceBacks,
    silentMaestro: count((t) => (t.rating ?? 0) >= 9 && t.goals + t.assists === 0),
    bestPerformances: byScore.slice(0, 5),
    worstPerformance: byScore.length > 1 ? byScore[byScore.length - 1]! : null,
    timeline,
    form: timeline.slice(-10).reverse(),
    milestones: [
      nextMilestone("goals", "Goals", goals),
      nextMilestone("assists", "Assists", assists),
      nextMilestone("ga", "Goal involvements", ga),
      nextMilestone("apps", "Appearances", apps),
      nextMilestone("motm", "Man of the Match", motm),
    ],
    firsts: {
      debut: timeline[0] ?? null,
      firstGoal: timeline.find((t) => t.goals > 0) ?? null,
      firstAssist: timeline.find((t) => t.assists > 0) ?? null,
      firstMotm: timeline.find((t) => t.motm) ?? null,
      latest: timeline[timeline.length - 1] ?? null,
    },
    distinct: {
      opponents: opponent.length,
      opponentsScoredAgainst: opponent.filter((o) => o.goals > 0).length,
      competitions: competition.filter((c) => c.key !== "none").length,
      seasons: season.length,
      monthsWithGoal: month.filter((m) => m.goals > 0).length,
    },
    bests: {
      seasonGoals: Math.max(0, ...season.map((s) => s.goals)),
      seasonAssists: Math.max(0, ...season.map((s) => s.assists)),
      seasonMotm: Math.max(0, ...season.map((s) => s.motm)),
      monthGoals: Math.max(0, ...month.map((s) => s.goals)),
      matchGoals: Math.max(0, ...timeline.map((t) => t.goals)),
      matchAssists: Math.max(0, ...timeline.map((t) => t.assists)),
      matchGA: Math.max(0, ...timeline.map((t) => t.goals + t.assists)),
    },
    weekendGoals,
    midweekGoals: goals - weekendGoals,
    bigWins: count((t) => t.result === "W" && (t.goalsFor ?? 0) - (t.goalsAgainst ?? 0) >= 4),
    thrillers: count((t) => (t.goalsFor ?? 0) + (t.goalsAgainst ?? 0) >= 6),
  };
}
