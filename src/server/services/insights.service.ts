import { prisma } from "@/server/db/client";
import { didAppear } from "@/lib/validation";
import { buildProfile, teamScore, type MatchRecord, type PlayerProfile } from "@/lib/stats/profile";
import {
  cardTier,
  archetype,
  type Attributes,
  type CardTier,
} from "@/lib/stats/attributes";
import {
  evaluateKeywords,
  squadKeywords,
  type Keyword,
  type KeywordResult,
} from "@/lib/stats/keywords";
import { buildRatingModel, ratePlayer, type ComponentZ } from "@/lib/stats/rating-model";
import type { Position, PreferredFoot } from "@prisma/client";

export interface PlayerIdentity {
  id: string;
  fullName: string;
  displayName: string | null;
  position: Position;
  preferredFoot: PreferredFoot;
  squadNumber: number | null;
  team: string | null;
  nationality: string | null;
  imageUrl: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface PlayerInsight {
  player: PlayerIdentity;
  profile: PlayerProfile;
  attrs: Attributes | null;
  ovr: number | null;
  /** How the overall was built: standardised score and per-metric contributions. */
  rating: { z: number | null; breakdown: ComponentZ[]; squadSize: number };
  tier: CardTier;
  archetype: ReturnType<typeof archetype>;
  keywords: KeywordResult;
}

export interface SquadRank {
  metric: string;
  label: string;
  value: number | null;
  rank: number | null;
  of: number;
  percentile: number | null;
}

export interface PlayerInsightDetail extends PlayerInsight {
  ranks: SquadRank[];
  squadSize: number;
}

const performanceInclude = {
  performances: {
    where: { match: { status: "COMPLETED" as const } },
    include: { match: { include: { competition: { select: { id: true, name: true, season: true } } } } },
  },
};

type PlayerRow = Awaited<ReturnType<typeof loadPlayers>>[number];

async function loadPlayers(includeArchived: boolean) {
  return prisma.player.findMany({
    where: includeArchived ? {} : { archivedAt: null },
    include: performanceInclude,
    orderBy: { fullName: "asc" },
  });
}

function toRecords(row: PlayerRow): MatchRecord[] {
  return row.performances
    .filter((p) => didAppear(p.appearanceStatus))
    .map((p) => {
      const { goalsFor, goalsAgainst } = teamScore(p.match.venue, p.match.scoreHome, p.match.scoreAway);
      return {
        matchId: p.match.id,
        date: p.match.date.toISOString(),
        opponent: p.match.opponent,
        competitionId: p.match.competition?.id ?? null,
        competitionName: p.match.competition?.name ?? null,
        season: p.match.competition?.season ?? null,
        venue: p.match.venue,
        goalsFor,
        goalsAgainst,
        started: p.appearanceStatus === "STARTED",
        minutes: p.minutesPlayed,
        goals: p.goals,
        assists: p.assists,
        rating: p.rating,
        motm: p.isMotm,
      };
    });
}

function identity(row: PlayerRow): PlayerIdentity {
  return {
    id: row.id,
    fullName: row.fullName,
    displayName: row.displayName,
    position: row.position,
    preferredFoot: row.preferredFoot,
    squadNumber: row.squadNumber,
    team: row.team,
    nationality: row.nationality,
    imageUrl: row.imageUrl,
    notes: row.notes,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function buildInsights(rows: PlayerRow[]): PlayerInsight[] {
  const profiled = rows.map((row) => ({ row, profile: buildProfile(toRecords(row)) }));
  // One model per squad: active players define what "average" means for each role.
  const model = buildRatingModel(
    profiled.filter((x) => !x.row.archivedAt).map((x) => ({ id: x.row.id, position: x.row.position, profile: x.profile })),
  );
  const base = profiled.map(({ row, profile }) => {
    const rated = ratePlayer(model, profile, row.position);
    return { row, profile, attrs: rated.attrs, ovr: rated.ovr, rating: { z: rated.z, breakdown: rated.breakdown, squadSize: model.squadSize } };
  });
  const squad = squadKeywords(
    base.filter((b) => !b.row.archivedAt).map((b) => ({ id: b.row.id, profile: b.profile, ovr: b.ovr })),
  );
  return base.map(({ row, profile, attrs, ovr, rating }) => ({
    player: identity(row),
    profile,
    attrs,
    ovr,
    rating,
    tier: cardTier(ovr),
    archetype: archetype(attrs, row.position),
    keywords: evaluateKeywords({ profile, attrs, ovr, position: row.position, squad: squad.get(row.id) ?? [] }),
  }));
}

/** Every player with full derived insight. Squad honours use active players only. */
export async function getSquadInsights(opts: { includeArchived?: boolean } = {}): Promise<PlayerInsight[]> {
  const rows = await loadPlayers(true);
  const all = buildInsights(rows);
  return opts.includeArchived ? all : all.filter((i) => !i.player.archivedAt);
}

function rankOf(
  all: PlayerInsight[],
  id: string,
  metric: string,
  label: string,
  get: (i: PlayerInsight) => number | null,
  lowerIsBetter = false,
): SquadRank {
  const vals = all.map((i) => ({ id: i.player.id, v: get(i) })).filter((x): x is { id: string; v: number } => x.v !== null);
  const mine = vals.find((x) => x.id === id);
  if (!mine) return { metric, label, value: null, rank: null, of: vals.length, percentile: null };
  const better = vals.filter((x) => (lowerIsBetter ? x.v < mine.v : x.v > mine.v)).length;
  const rank = better + 1;
  const percentile = vals.length > 1 ? Math.round((1 - (rank - 1) / (vals.length - 1)) * 100) : 100;
  return { metric, label, value: mine.v, rank, of: vals.length, percentile };
}

export async function getPlayerInsight(id: string): Promise<PlayerInsightDetail | null> {
  const all = await getSquadInsights({ includeArchived: true });
  const me = all.find((i) => i.player.id === id);
  if (!me) return null;
  const pool = all.filter((i) => !i.player.archivedAt && i.profile.apps > 0);
  if (!pool.some((i) => i.player.id === id) && me.profile.apps > 0) pool.push(me);
  const ranks: SquadRank[] = [
    rankOf(pool, id, "ovr", "Overall", (i) => i.ovr),
    rankOf(pool, id, "avgRating", "Avg rating", (i) => i.profile.rating.avg),
    rankOf(pool, id, "goals", "Goals", (i) => i.profile.goals),
    rankOf(pool, id, "assists", "Assists", (i) => i.profile.assists),
    rankOf(pool, id, "motm", "MOTM", (i) => i.profile.motm),
    rankOf(pool, id, "gaPerApp", "G+A / app", (i) => i.profile.perApp?.ga ?? null),
    rankOf(pool, id, "form", "Last-5 rating", (i) => i.profile.rating.last5),
    rankOf(pool, id, "apps", "Appearances", (i) => i.profile.apps),
  ];
  return { ...me, ranks, squadSize: pool.length };
}

export interface TickerItem {
  id: string;
  date: string;
  opponent: string;
  venue: "HOME" | "AWAY" | "NEUTRAL" | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: "W" | "D" | "L" | null;
  scorers: { name: string; goals: number }[];
  motm: string | null;
}

/** Latest completed fixtures for the scrolling results ticker. */
export async function getTicker(limit = 8): Promise<TickerItem[]> {
  const matches = await prisma.match.findMany({
    where: { status: "COMPLETED" },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { performances: { include: { player: { select: { fullName: true, displayName: true } } } } },
  });
  return matches.map((m) => {
    const { goalsFor, goalsAgainst } = teamScore(m.venue, m.scoreHome, m.scoreAway);
    const name = (p: { fullName: string; displayName: string | null }) => p.displayName || p.fullName.split(" ").slice(-1)[0]!;
    const motm = m.performances.find((p) => p.isMotm);
    return {
      id: m.id,
      date: m.date.toISOString(),
      opponent: m.opponent,
      venue: m.venue,
      goalsFor,
      goalsAgainst,
      result: goalsFor === null || goalsAgainst === null ? null : goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D",
      scorers: m.performances.filter((p) => p.goals > 0).map((p) => ({ name: name(p.player), goals: p.goals })),
      motm: motm ? name(motm.player) : null,
    };
  });
}

export type { Keyword };
