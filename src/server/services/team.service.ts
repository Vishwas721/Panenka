import { prisma } from "@/server/db/client";
import { didAppear } from "@/lib/validation";
import { teamScore, resultOf, mean, type Result, type Venue } from "@/lib/stats/profile";
import type { AppearanceStatus, MatchStatus, Position } from "@prisma/client";

const round = (n: number | null, dp = 2) => (n === null ? null : Math.round(n * 10 ** dp) / 10 ** dp);

const matchInclude = {
  competition: { select: { id: true, name: true, season: true } },
  performances: {
    include: {
      player: {
        select: { id: true, fullName: true, displayName: true, position: true, squadNumber: true, imageUrl: true },
      },
    },
  },
} as const;

type MatchRow = Awaited<ReturnType<typeof loadMatches>>[number];

async function loadMatches(where: { status?: MatchStatus } = {}) {
  return prisma.match.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: matchInclude,
  });
}

const nameOf = (p: { fullName: string; displayName: string | null }) =>
  p.displayName || p.fullName.trim().split(/\s+/).slice(-1)[0]!;

export interface FixtureSummary {
  id: string;
  date: string;
  opponent: string;
  team: string | null;
  venue: Venue;
  venueName: string | null;
  status: MatchStatus;
  competition: { id: string; name: string; season: string | null } | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: Result;
  avgRating: number | null;
  appeared: number;
  scorers: { playerId: string; name: string; goals: number }[];
  assisters: { playerId: string; name: string; assists: number }[];
  motm: { playerId: string; name: string; rating: number | null } | null;
}

function summarise(m: MatchRow): FixtureSummary {
  const { goalsFor, goalsAgainst } = teamScore(m.venue, m.scoreHome, m.scoreAway);
  const played = m.performances.filter((p) => didAppear(p.appearanceStatus));
  const ratings = played.map((p) => p.rating).filter((r): r is number => r !== null);
  const motm = m.performances.find((p) => p.isMotm);
  return {
    id: m.id,
    date: m.date.toISOString(),
    opponent: m.opponent,
    team: m.team,
    venue: m.venue,
    venueName: m.venueName,
    status: m.status,
    competition: m.competition,
    goalsFor,
    goalsAgainst,
    result: m.status === "COMPLETED" ? resultOf(goalsFor, goalsAgainst) : null,
    avgRating: round(mean(ratings)),
    appeared: played.length,
    scorers: played
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .map((p) => ({ playerId: p.playerId, name: nameOf(p.player), goals: p.goals })),
    assisters: played
      .filter((p) => p.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .map((p) => ({ playerId: p.playerId, name: nameOf(p.player), assists: p.assists })),
    motm: motm ? { playerId: motm.playerId, name: nameOf(motm.player), rating: motm.rating } : null,
  };
}

/** Every fixture (any status), newest first, from the team's perspective. */
export async function getFixtures(): Promise<FixtureSummary[]> {
  return (await loadMatches()).map(summarise);
}

export interface TeamOverview {
  matches: number;
  scored: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  winRate: number | null;
  ppg: number | null;
  playerGoals: number;
  playerAssists: number;
  motmAwarded: number;
  avgRating: number | null;
  unbeatenRun: number;
  winRun: number;
  biggestWin: FixtureSummary | null;
  last10: FixtureSummary[];
  trend: {
    id: string;
    label: string;
    opponent: string;
    avgRating: number | null;
    rolling: number | null;
    result: Result;
    goalsFor: number | null;
    goalsAgainst: number | null;
  }[];
  upcoming: FixtureSummary[];
}

/** Team-level aggregates over completed matches. */
export async function getTeamOverview(): Promise<TeamOverview> {
  const all = await loadMatches();
  const completed = all.filter((m) => m.status === "COMPLETED");
  const sums = completed.map(summarise);
  const withScore = sums.filter((s) => s.result !== null);

  const wins = withScore.filter((s) => s.result === "W").length;
  const draws = withScore.filter((s) => s.result === "D").length;
  const losses = withScore.filter((s) => s.result === "L").length;

  let unbeatenRun = 0;
  for (const s of withScore) {
    if (s.result === "L") break;
    unbeatenRun++;
  }
  let winRun = 0;
  for (const s of withScore) {
    if (s.result !== "W") break;
    winRun++;
  }

  const allPerfs = completed.flatMap((m) => m.performances.filter((p) => didAppear(p.appearanceStatus)));
  const allRatings = allPerfs.map((p) => p.rating).filter((r): r is number => r !== null);

  const chrono = [...sums].reverse();
  const trend = chrono.map((s, i) => {
    const window = chrono
      .slice(Math.max(0, i - 4), i + 1)
      .map((x) => x.avgRating)
      .filter((x): x is number => x !== null);
    return {
      id: s.id,
      label: new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      opponent: s.opponent,
      avgRating: s.avgRating,
      rolling: round(mean(window)),
      result: s.result,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
    };
  });

  const biggestWin =
    withScore
      .filter((s) => s.result === "W")
      .sort(
        (a, b) =>
          (b.goalsFor! - b.goalsAgainst!) - (a.goalsFor! - a.goalsAgainst!) || b.goalsFor! - a.goalsFor!,
      )[0] ?? null;

  return {
    matches: completed.length,
    scored: withScore.length,
    wins,
    draws,
    losses,
    goalsFor: withScore.reduce((a, s) => a + (s.goalsFor ?? 0), 0),
    goalsAgainst: withScore.reduce((a, s) => a + (s.goalsAgainst ?? 0), 0),
    cleanSheets: withScore.filter((s) => s.goalsAgainst === 0).length,
    winRate: withScore.length ? round(wins / withScore.length, 3) : null,
    ppg: withScore.length ? round((wins * 3 + draws) / withScore.length) : null,
    playerGoals: allPerfs.reduce((a, p) => a + p.goals, 0),
    playerAssists: allPerfs.reduce((a, p) => a + p.assists, 0),
    motmAwarded: allPerfs.filter((p) => p.isMotm).length,
    avgRating: round(mean(allRatings)),
    unbeatenRun,
    winRun,
    biggestWin,
    last10: sums.slice(0, 10),
    trend,
    upcoming: all
      .filter((m) => m.status === "SCHEDULED")
      .map(summarise)
      .reverse()
      .slice(0, 3),
  };
}

export interface ReportLine {
  performanceId: string;
  player: { id: string; fullName: string; displayName: string | null; position: Position; squadNumber: number | null; imageUrl: string | null };
  status: AppearanceStatus;
  appeared: boolean;
  started: boolean;
  minutes: number | null;
  goals: number;
  assists: number;
  rating: number | null;
  motm: boolean;
  notes: string | null;
}

export interface MatchReport extends FixtureSummary {
  notes: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  lines: ReportLine[];
  totals: { goals: number; assists: number; ratedPlayers: number; bestRating: number | null; worstRating: number | null };
}

export async function getMatchReport(id: string): Promise<MatchReport | null> {
  const m = await prisma.match.findUnique({ where: { id }, include: matchInclude });
  if (!m) return null;
  const base = summarise(m);
  const lines: ReportLine[] = m.performances
    .map((p) => ({
      performanceId: p.id,
      player: p.player,
      status: p.appearanceStatus,
      appeared: didAppear(p.appearanceStatus),
      started: p.appearanceStatus === "STARTED",
      minutes: p.minutesPlayed,
      goals: p.goals,
      assists: p.assists,
      rating: p.rating,
      motm: p.isMotm,
      notes: p.notes,
    }))
    .sort(
      (a, b) =>
        Number(b.appeared) - Number(a.appeared) ||
        (b.rating ?? -1) - (a.rating ?? -1) ||
        b.goals + b.assists - (a.goals + a.assists) ||
        a.player.fullName.localeCompare(b.player.fullName),
    );
  const ratings = lines.map((l) => l.rating).filter((r): r is number => r !== null);
  return {
    ...base,
    notes: m.notes,
    scoreHome: m.scoreHome,
    scoreAway: m.scoreAway,
    lines,
    totals: {
      goals: lines.reduce((a, l) => a + l.goals, 0),
      assists: lines.reduce((a, l) => a + l.assists, 0),
      ratedPlayers: ratings.length,
      bestRating: ratings.length ? Math.max(...ratings) : null,
      worstRating: ratings.length ? Math.min(...ratings) : null,
    },
  };
}
