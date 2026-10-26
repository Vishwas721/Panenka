import { prisma } from "@/server/db/client";
import {
  calcPlayerStats,
  calcGoalBreakdown,
  calcAssistBreakdown,
  calcRecentForm,
  compareForRanking,
  type PerformanceRecord,
  type PlayerStats,
  type GoalBreakdown,
  type AssistBreakdown,
  type RecentForm,
  type RankablePlayer,
} from "@/lib/stats";
import {
  didAppear,
  type CreatePlayerInput,
  type UpdatePlayerInput,
} from "@/lib/validation";
import type {
  Player,
  Position,
  PreferredFoot,
  MatchVenue,
  MatchStatus,
  AppearanceStatus,
  Prisma,
} from "@prisma/client";

export interface PlayerWithStats extends Player {
  stats: PlayerStats;
}

export interface PaginatedPlayers {
  data: PlayerWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PlayerMatchDetail {
  performanceId: string;
  appearanceStatus: AppearanceStatus;
  minutesPlayed: number | null;
  goals: number;
  assists: number;
  notes: string | null;
  match: {
    id: string;
    date: Date;
    opponent: string;
    team: string | null;
    venue: MatchVenue | null;
    venueName: string | null;
    scoreHome: number | null;
    scoreAway: number | null;
    status: MatchStatus;
    competition: {
      id: string;
      name: string;
      season: string | null;
    } | null;
  };
}

export interface PlayerDetail extends Player {
  stats: PlayerStats;
  goalBreakdown: GoalBreakdown;
  assistBreakdown: AssistBreakdown;
  recentForm: RecentForm;
  matches: PlayerMatchDetail[];
}

export interface GetPlayersParams {
  search?: string;
  position?: Position;
  team?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "appearances" | "goals" | "assists" | "goalContributions";
  sortOrder?: "asc" | "desc";
}

/**
 * Check if a player with the given name already exists in the same team.
 * Comparison is case- and whitespace-insensitive.
 */
export async function checkDuplicatePlayer(
  fullName: string,
  team?: string | null,
  excludeId?: string,
): Promise<boolean> {
  const normalizedName = fullName.trim().toLowerCase();
  const trimmedTeam = team?.trim();

  const candidates = await prisma.player.findMany({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      ...(trimmedTeam
        ? { team: { equals: trimmedTeam, mode: "insensitive" } }
        : { OR: [{ team: null }, { team: "" }] }),
    },
    select: { id: true, fullName: true },
  });

  return candidates.some(
    (p) => p.fullName.trim().toLowerCase() === normalizedName,
  );
}

/**
 * Returns a paginated list of players along with aggregated totals
 * derived from completed match performances using pure stats functions.
 */
export async function getPlayers(
  params: GetPlayersParams = {},
): Promise<PaginatedPlayers> {
  const {
    search,
    position,
    team,
    includeArchived = false,
    page = 1,
    pageSize = 10,
    sortBy = "name",
    sortOrder = sortBy === "name" ? "asc" : "desc",
  } = params;

  const where: Prisma.PlayerWhereInput = {
    ...(!includeArchived ? { archivedAt: null } : {}),
    ...(position ? { position } : {}),
    ...(team ? { team: { equals: team, mode: "insensitive" } } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Fetch matching players with their performance records
  const players = await prisma.player.findMany({
    where,
    include: {
      performances: {
        select: {
          goals: true,
          assists: true,
          minutesPlayed: true,
          appearanceStatus: true,
          match: {
            select: {
              status: true,
              date: true,
            },
          },
        },
      },
    },
  });

  // Derive stats for each player using pure functions
  const playersWithStats: PlayerWithStats[] = players.map((player) => {
    const { performances, ...playerFields } = player;
    const records: PerformanceRecord[] = performances.map((perf) => ({
      goals: perf.goals,
      assists: perf.assists,
      minutesPlayed: perf.minutesPlayed,
      appeared: didAppear(perf.appearanceStatus),
      matchCompleted: perf.match.status === "COMPLETED",
    }));

    return {
      ...playerFields,
      stats: calcPlayerStats(records),
    };
  });

  // Calculate total minutes for tie-breaking
  const minutesByPlayerId = new Map<string, number | null>();
  for (const player of players) {
    const completedApps = player.performances.filter(
      (perf) =>
        perf.match.status === "COMPLETED" && didAppear(perf.appearanceStatus),
    );
    const hasAnyMinutes = completedApps.some((p) => p.minutesPlayed !== null);
    const totalMinutes = hasAnyMinutes
      ? completedApps.reduce((sum, p) => sum + (p.minutesPlayed ?? 0), 0)
      : null;
    minutesByPlayerId.set(player.id, totalMinutes);
  }

  // Sort based on sortBy & sortOrder
  playersWithStats.sort((a, b) => {
    let result = 0;

    if (sortBy === "name") {
      result = a.fullName.localeCompare(b.fullName);
    } else {
      let metricA = 0;
      let metricB = 0;

      if (sortBy === "appearances") {
        metricA = a.stats.appearances;
        metricB = b.stats.appearances;
      } else if (sortBy === "goals") {
        metricA = a.stats.goals;
        metricB = b.stats.goals;
      } else if (sortBy === "assists") {
        metricA = a.stats.assists;
        metricB = b.stats.assists;
      } else if (sortBy === "goalContributions") {
        metricA = a.stats.goalContributions;
        metricB = b.stats.goalContributions;
      }

      const rankableA: RankablePlayer = {
        id: a.id,
        fullName: a.fullName,
        primaryMetric: metricA,
        appearances: a.stats.appearances,
        totalMinutes: minutesByPlayerId.get(a.id) ?? null,
      };

      const rankableB: RankablePlayer = {
        id: b.id,
        fullName: b.fullName,
        primaryMetric: metricB,
        appearances: b.stats.appearances,
        totalMinutes: minutesByPlayerId.get(b.id) ?? null,
      };

      result = compareForRanking(rankableA, rankableB);

      // If sortOrder is asc, invert the ranking result
      if (sortOrder === "asc") {
        result = -result;
      }
      return result;
    }

    return sortOrder === "asc" ? result : -result;
  });

  // Apply pagination in memory after sorting
  const total = playersWithStats.length;
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(total / safePageSize);
  const startIndex = (safePage - 1) * safePageSize;
  const paginatedData = playersWithStats.slice(
    startIndex,
    startIndex + safePageSize,
  );

  return {
    data: paginatedData,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

/**
 * Returns player details with full aggregated stats, goal breakdown,
 * assist breakdown, recent form, and match history.
 */
export async function getPlayerById(id: string): Promise<PlayerDetail | null> {
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      performances: {
        include: {
          match: {
            include: {
              competition: {
                select: {
                  id: true,
                  name: true,
                  season: true,
                },
              },
            },
          },
        },
        orderBy: [
          { match: { date: "desc" } },
          { createdAt: "desc" },
        ],
      },
    },
  });

  if (!player) return null;

  const { performances, ...playerFields } = player;

  // Map to PerformanceRecord[] in chronological descending order
  const records: PerformanceRecord[] = performances.map((perf) => ({
    goals: perf.goals,
    assists: perf.assists,
    minutesPlayed: perf.minutesPlayed,
    appeared: didAppear(perf.appearanceStatus),
    matchCompleted: perf.match.status === "COMPLETED",
  }));

  const stats = calcPlayerStats(records);
  const goalBreakdown = calcGoalBreakdown(records);
  const assistBreakdown = calcAssistBreakdown(records);
  const recentForm = calcRecentForm(records, 5, 3);

  const matches: PlayerMatchDetail[] = performances.map((perf) => ({
    performanceId: perf.id,
    appearanceStatus: perf.appearanceStatus,
    minutesPlayed: perf.minutesPlayed,
    goals: perf.goals,
    assists: perf.assists,
    notes: perf.notes,
    match: {
      id: perf.match.id,
      date: perf.match.date,
      opponent: perf.match.opponent,
      team: perf.match.team,
      venue: perf.match.venue,
      venueName: perf.match.venueName,
      scoreHome: perf.match.scoreHome,
      scoreAway: perf.match.scoreAway,
      status: perf.match.status,
      competition: perf.match.competition,
    },
  }));

  return {
    ...playerFields,
    stats,
    goalBreakdown,
    assistBreakdown,
    recentForm,
    matches,
  };
}

/**
 * Creates a new player after verifying no duplicate exists in the same team.
 */
export async function createPlayer(data: CreatePlayerInput): Promise<Player> {
  const isDuplicate = await checkDuplicatePlayer(data.fullName, data.team);
  if (isDuplicate) {
    throw new Error(
      `A player with the name "${data.fullName.trim()}" already exists in ${
        data.team ? `team "${data.team.trim()}"` : "this team"
      }.`,
    );
  }

  return prisma.player.create({
    data: {
      fullName: data.fullName.trim(),
      displayName: data.displayName?.trim() || null,
      position: data.position,
      altPositions: (data.altPositions ?? []).filter((p) => p !== data.position),
      preferredFoot: data.preferredFoot,
      squadNumber: data.squadNumber ?? null,
      team: data.team?.trim() || null,
      nationality: data.nationality?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });
}

/**
 * Updates player attributes and validates duplicate names if modified.
 */
export async function updatePlayer(
  id: string,
  data: UpdatePlayerInput,
): Promise<Player> {
  const existing = await prisma.player.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Player with ID "${id}" not found.`);
  }

  const checkName =
    data.fullName !== undefined ? data.fullName : existing.fullName;
  const checkTeam =
    data.team !== undefined ? data.team : existing.team;

  if (data.fullName !== undefined || data.team !== undefined) {
    const isDuplicate = await checkDuplicatePlayer(checkName, checkTeam, id);
    if (isDuplicate) {
      throw new Error(
        `A player with the name "${checkName.trim()}" already exists in ${
          checkTeam ? `team "${checkTeam.trim()}"` : "this team"
        }.`,
      );
    }
  }

  return prisma.player.update({
    where: { id },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
      ...(data.displayName !== undefined
        ? { displayName: data.displayName?.trim() || null }
        : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
      ...(data.altPositions !== undefined
        ? { altPositions: data.altPositions.filter((p) => p !== (data.position ?? existing.position)) }
        : {}),
      ...(data.preferredFoot !== undefined
        ? { preferredFoot: data.preferredFoot }
        : {}),
      ...(data.squadNumber !== undefined
        ? { squadNumber: data.squadNumber }
        : {}),
      ...(data.team !== undefined
        ? { team: data.team?.trim() || null }
        : {}),
      ...(data.nationality !== undefined
        ? { nationality: data.nationality?.trim() || null }
        : {}),
      ...(data.imageUrl !== undefined
        ? { imageUrl: data.imageUrl?.trim() || null }
        : {}),
      ...(data.notes !== undefined
        ? { notes: data.notes?.trim() || null }
        : {}),
    },
  });
}

/**
 * Archives a player by setting their archivedAt timestamp.
 */
export async function archivePlayer(id: string): Promise<Player> {
  return prisma.player.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
}

/**
 * Restores an archived player by setting archivedAt to null.
 */
export async function restorePlayer(id: string): Promise<Player> {
  return prisma.player.update({
    where: { id },
    data: { archivedAt: null },
  });
}

/**
 * Hard deletes a player ONLY if they have zero recorded performances.
 * Otherwise throws an informative error recommending archival.
 */
export async function deletePlayer(id: string): Promise<Player> {
  const perfCount = await prisma.playerMatchPerformance.count({
    where: { playerId: id },
  });

  if (perfCount > 0) {
    throw new Error(
      "Cannot delete player with recorded performances. Archive them instead.",
    );
  }

  return prisma.player.delete({
    where: { id },
  });
}

/**
 * Returns distinct non-null team names across all players.
 */
export async function getPlayerTeams(): Promise<string[]> {
  const records = await prisma.player.findMany({
    where: { team: { not: null } },
    select: { team: true },
    distinct: ["team"],
    orderBy: { team: "asc" },
  });

  return records
    .map((r) => r.team)
    .filter((t): t is string => Boolean(t && t.trim().length > 0));
}


/**
 * Returns distinct non-null team names from players.
 */
export async function getDistinctTeams(): Promise<string[]> {
  const distinctTeams = await prisma.player.findMany({
    where: { team: { not: null } },
    select: { team: true },
    distinct: ["team"],
    orderBy: { team: "asc" },
  });

  return distinctTeams
    .map((p) => p.team)
    .filter((t): t is string => Boolean(t && t.trim().length > 0));
}

