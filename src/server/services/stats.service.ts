import { prisma } from "@/server/db/client";
import { env } from "@/config/env";
import {
  calcPlayerStats,
  calcGoalBreakdown,
  calcAssistBreakdown,
  calcRecentForm,
  compareForRanking,
  isEligibleForRateRanking,
  type PerformanceRecord,
  type PlayerStats,
  type GoalBreakdown,
  type AssistBreakdown,
  type RecentForm,
  type RankablePlayer,
} from "@/lib/stats";
import { didAppear } from "@/lib/validation";
import type {
  Position,
  MatchStatus,
  MatchVenue,
  AppearanceStatus,
  Prisma,
} from "@prisma/client";

export interface LeaderboardEntry {
  id: string;
  fullName: string;
  displayName: string | null;
  position: Position;
  team: string | null;
  imageUrl: string | null;
  value: number;
  appearances: number;
  totalMinutes: number | null;
  stats: PlayerStats;
}

export interface DashboardSummary {
  totalPlayers: {
    registered: number;
    active: number;
    archived: number;
  };
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  totalContributions: number;
  bestGoalsPerAppearance: {
    player: {
      id: string;
      fullName: string;
      displayName: string | null;
      position: Position;
      team: string | null;
      imageUrl: string | null;
    };
    rate: number;
    appearances: number;
    goals: number;
  } | null;
  leaderboard: {
    topScorer: LeaderboardEntry[];
    topAssister: LeaderboardEntry[];
    mostContributions: LeaderboardEntry[];
    bestContributionsPerAppearance: LeaderboardEntry[];
  };
  recentActivity: {
    recentMatches: Array<{
      id: string;
      date: Date;
      opponent: string;
      team: string | null;
      venue: MatchVenue | null;
      scoreHome: number | null;
      scoreAway: number | null;
      status: MatchStatus;
      competition: {
        id: string;
        name: string;
        season: string | null;
      } | null;
      performances?: Array<{
        id: string;
        goals: number;
        assists: number;
        player: {
          id: string;
          fullName: string;
          displayName: string | null;
          position: Position;
        };
      }>;
    }>;
    recentPlayers: Array<{
      id: string;
      fullName: string;
      displayName: string | null;
      position: Position;
      team: string | null;
      imageUrl: string | null;
      createdAt: Date;
    }>;
  };
  chartPlayers: Array<{
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    team: string | null;
    imageUrl: string | null;
    goals: number;
    assists: number;
    goalContributions: number;
    appearances: number;
    totalMinutes: number | null;
    goalsPerAppearance: number | null;
    assistsPerAppearance: number | null;
    contributionsPerAppearance: number | null;
  }>;
}

export interface HatTrickKing {
  player: {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    team: string | null;
    imageUrl: string | null;
  };
  hatTricks: number;
  fourGoalMatches: number;
  fiveOrMoreGoalMatches: number;
  totalMultiGoalMatches: number;
  appearances: number;
  goals: number;
}

export interface BraceMaster {
  player: {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    team: string | null;
    imageUrl: string | null;
  };
  braces: number;
  appearances: number;
  goals: number;
}

export interface AssistRankingEntry {
  player: {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    team: string | null;
    imageUrl: string | null;
  };
  assistsPerAppearance: number;
  assists: number;
  appearances: number;
  breakdown: AssistBreakdown;
}

export interface BreakdownTableRow {
  player: {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    team: string | null;
    imageUrl: string | null;
    squadNumber: number | null;
  };
  stats: PlayerStats;
  goalBreakdown: GoalBreakdown;
  assistBreakdown: AssistBreakdown;
}

export interface GoalAssistBreakdownResult {
  hatTrickKings: HatTrickKing[];
  braceMasters: BraceMaster[];
  assistsRanking: AssistRankingEntry[];
  table: {
    data: BreakdownTableRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface PlayerComparisonData {
  player: {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    team: string | null;
    imageUrl: string | null;
    squadNumber: number | null;
    nationality: string | null;
    preferredFoot: string;
  };
  stats: PlayerStats;
  goalBreakdown: GoalBreakdown;
  assistBreakdown: AssistBreakdown;
  recentForm: RecentForm;
  totalMinutes: number | null;
}

export interface ComparisonResult {
  players: PlayerComparisonData[];
  comparison: {
    appearances: { maxPlayerId: string | null; values: Record<string, number> };
    goals: { maxPlayerId: string | null; values: Record<string, number> };
    assists: { maxPlayerId: string | null; values: Record<string, number> };
    contributions: {
      maxPlayerId: string | null;
      values: Record<string, number>;
    };
    goalsPerAppearance: {
      maxPlayerId: string | null;
      values: Record<string, number | null>;
    };
    assistsPerAppearance: {
      maxPlayerId: string | null;
      values: Record<string, number | null>;
    };
  };
}

export interface GetGoalAssistBreakdownParams {
  search?: string;
  position?: Position;
  team?: string;
  competitionId?: string;
  minAppearances?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Calculates dashboard summary metrics, leaderboards, and recent activity.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const minAppsThreshold = env.MIN_APPEARANCES_FOR_RATE ?? 3;

  // 1. Player counts
  const [registered, active, totalCompletedMatches, recentMatches, recentPlayers] =
    await Promise.all([
      prisma.player.count(),
      prisma.player.count({ where: { archivedAt: null } }),
      prisma.match.count({ where: { status: "COMPLETED" } }),
      prisma.match.findMany({
        take: 5,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          date: true,
          opponent: true,
          team: true,
          venue: true,
          scoreHome: true,
          scoreAway: true,
          status: true,
          competition: {
            select: {
              id: true,
              name: true,
              season: true,
            },
          },
          performances: {
            where: {
              OR: [
                { goals: { gt: 0 } },
                { assists: { gt: 0 } },
              ],
            },
            select: {
              id: true,
              goals: true,
              assists: true,
              player: {
                select: {
                  id: true,
                  fullName: true,
                  displayName: true,
                  position: true,
                },
              },
            },
          },
        },
      }),
      prisma.player.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          displayName: true,
          position: true,
          team: true,
          imageUrl: true,
          createdAt: true,
        },
      }),
    ]);

  const archived = registered - active;

  // 2. Fetch all players and their completed match performances
  const players = await prisma.player.findMany({
    include: {
      performances: {
        where: {
          match: { status: "COMPLETED" },
        },
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

  let totalGoals = 0;
  let totalAssists = 0;

  interface ComputedPlayer {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    team: string | null;
    imageUrl: string | null;
    stats: PlayerStats;
    totalMinutes: number | null;
  }

  const computedPlayers: ComputedPlayer[] = [];

  for (const player of players) {
    const records: PerformanceRecord[] = player.performances.map((perf) => ({
      goals: perf.goals,
      assists: perf.assists,
      minutesPlayed: perf.minutesPlayed,
      appeared: didAppear(perf.appearanceStatus),
      matchCompleted: perf.match.status === "COMPLETED",
    }));

    const stats = calcPlayerStats(records);
    totalGoals += stats.goals;
    totalAssists += stats.assists;

    const completedApps = player.performances.filter((p) =>
      didAppear(p.appearanceStatus),
    );
    const hasMinutes = completedApps.some((p) => p.minutesPlayed !== null);
    const totalMinutes = hasMinutes
      ? completedApps.reduce((sum, p) => sum + (p.minutesPlayed ?? 0), 0)
      : null;

    computedPlayers.push({
      id: player.id,
      fullName: player.fullName,
      displayName: player.displayName,
      position: player.position,
      team: player.team,
      imageUrl: player.imageUrl,
      stats,
      totalMinutes,
    });
  }

  const totalContributions = totalGoals + totalAssists;

  // Helper to sort players using compareForRanking
  function rankPlayersBy(
    getMetric: (p: ComputedPlayer) => number,
    filterFn: (p: ComputedPlayer) => boolean = () => true,
    limit = 5,
  ): LeaderboardEntry[] {
    const eligible = computedPlayers.filter(filterFn);

    eligible.sort((a, b) => {
      const rankableA: RankablePlayer = {
        id: a.id,
        fullName: a.fullName,
        primaryMetric: getMetric(a),
        appearances: a.stats.appearances,
        totalMinutes: a.totalMinutes,
      };
      const rankableB: RankablePlayer = {
        id: b.id,
        fullName: b.fullName,
        primaryMetric: getMetric(b),
        appearances: b.stats.appearances,
        totalMinutes: b.totalMinutes,
      };
      return compareForRanking(rankableA, rankableB);
    });

    return eligible.slice(0, limit).map((p) => ({
      id: p.id,
      fullName: p.fullName,
      displayName: p.displayName,
      position: p.position,
      team: p.team,
      imageUrl: p.imageUrl,
      value: getMetric(p),
      appearances: p.stats.appearances,
      totalMinutes: p.totalMinutes,
      stats: p.stats,
    }));
  }

  // 3. Leaderboards
  const topScorer = rankPlayersBy(
    (p) => p.stats.goals,
    (p) => p.stats.goals > 0,
    5,
  );

  const topAssister = rankPlayersBy(
    (p) => p.stats.assists,
    (p) => p.stats.assists > 0,
    5,
  );

  const mostContributions = rankPlayersBy(
    (p) => p.stats.goalContributions,
    (p) => p.stats.goalContributions > 0,
    5,
  );

  const bestContributionsPerAppearance = rankPlayersBy(
    (p) => p.stats.contributionsPerAppearance ?? 0,
    (p) =>
      isEligibleForRateRanking(p.stats.appearances, minAppsThreshold) &&
      p.stats.contributionsPerAppearance !== null &&
      p.stats.contributionsPerAppearance > 0,
    5,
  );

  // 4. Best goals per appearance among eligible players
  const eligibleGoalRatePlayers = computedPlayers.filter(
    (p) =>
      isEligibleForRateRanking(p.stats.appearances, minAppsThreshold) &&
      p.stats.goalsPerAppearance !== null &&
      p.stats.goalsPerAppearance > 0,
  );

  let bestGoalsPerAppearance: DashboardSummary["bestGoalsPerAppearance"] = null;

  if (eligibleGoalRatePlayers.length > 0) {
    eligibleGoalRatePlayers.sort((a, b) => {
      const rankableA: RankablePlayer = {
        id: a.id,
        fullName: a.fullName,
        primaryMetric: a.stats.goalsPerAppearance ?? 0,
        appearances: a.stats.appearances,
        totalMinutes: a.totalMinutes,
      };
      const rankableB: RankablePlayer = {
        id: b.id,
        fullName: b.fullName,
        primaryMetric: b.stats.goalsPerAppearance ?? 0,
        appearances: b.stats.appearances,
        totalMinutes: b.totalMinutes,
      };
      return compareForRanking(rankableA, rankableB);
    });

    const best = eligibleGoalRatePlayers[0];
    if (best && best.stats.goalsPerAppearance !== null) {
      bestGoalsPerAppearance = {
        player: {
          id: best.id,
          fullName: best.fullName,
          displayName: best.displayName,
          position: best.position,
          team: best.team,
          imageUrl: best.imageUrl,
        },
        rate: best.stats.goalsPerAppearance,
        appearances: best.stats.appearances,
        goals: best.stats.goals,
      };
    }
  }

  // Top players for main visualization chart (up to 15 rankable players)
  const chartPlayers = rankPlayersBy(
    (p) => p.stats.goalContributions,
    (p) => p.stats.appearances > 0 || p.stats.goalContributions > 0,
    15,
  ).map((p) => ({
    id: p.id,
    fullName: p.fullName,
    displayName: p.displayName,
    position: p.position,
    team: p.team,
    imageUrl: p.imageUrl,
    goals: p.stats.goals,
    assists: p.stats.assists,
    goalContributions: p.stats.goalContributions,
    appearances: p.stats.appearances,
    totalMinutes: p.totalMinutes,
    goalsPerAppearance: p.stats.goalsPerAppearance,
    assistsPerAppearance: p.stats.assistsPerAppearance,
    contributionsPerAppearance: p.stats.contributionsPerAppearance,
  }));

  return {
    totalPlayers: {
      registered,
      active,
      archived,
    },
    totalMatches: totalCompletedMatches,
    totalGoals,
    totalAssists,
    totalContributions,
    bestGoalsPerAppearance,
    leaderboard: {
      topScorer,
      topAssister,
      mostContributions,
      bestContributionsPerAppearance,
    },
    recentActivity: {
      recentMatches,
      recentPlayers,
    },
    chartPlayers,
  };
}

/**
 * Calculates Hat-trick Kings, Brace Masters, Assists per appearance ranking,
 * and the full breakdown table data with milestone counts.
 */
export async function getGoalAssistBreakdown(
  params: GetGoalAssistBreakdownParams = {},
): Promise<GoalAssistBreakdownResult> {
  const {
    search,
    position,
    team,
    competitionId,
    minAppearances,
    page = 1,
    pageSize = 10,
    sortBy = "goals",
    sortOrder = "desc",
  } = params;

  const minAppsThreshold = minAppearances ?? (env.MIN_APPEARANCES_FOR_RATE || 3);

  const where: Prisma.PlayerWhereInput = {
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

  const players = await prisma.player.findMany({
    where,
    include: {
      performances: {
        where: {
          match: {
            status: "COMPLETED",
            ...(competitionId ? { competitionId } : {}),
          },
        },
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

  interface PlayerAnalysis {
    player: {
      id: string;
      fullName: string;
      displayName: string | null;
      position: Position;
      team: string | null;
      imageUrl: string | null;
      squadNumber: number | null;
    };
    stats: PlayerStats;
    goalBreakdown: GoalBreakdown;
    assistBreakdown: AssistBreakdown;
    totalMinutes: number | null;
  }

  const analyses: PlayerAnalysis[] = [];

  for (const p of players) {
    const records: PerformanceRecord[] = p.performances.map((perf) => ({
      goals: perf.goals,
      assists: perf.assists,
      minutesPlayed: perf.minutesPlayed,
      appeared: didAppear(perf.appearanceStatus),
      matchCompleted: perf.match.status === "COMPLETED",
    }));

    const stats = calcPlayerStats(records);
    const goalBreakdown = calcGoalBreakdown(records);
    const assistBreakdown = calcAssistBreakdown(records);

    const completedApps = p.performances.filter((perf) =>
      didAppear(perf.appearanceStatus),
    );
    const hasMinutes = completedApps.some((perf) => perf.minutesPlayed !== null);
    const totalMinutes = hasMinutes
      ? completedApps.reduce((sum, perf) => sum + (perf.minutesPlayed ?? 0), 0)
      : null;

    analyses.push({
      player: {
        id: p.id,
        fullName: p.fullName,
        displayName: p.displayName,
        position: p.position,
        team: p.team,
        imageUrl: p.imageUrl,
        squadNumber: p.squadNumber,
      },
      stats,
      goalBreakdown,
      assistBreakdown,
      totalMinutes,
    });
  }

  // 1. Hat-trick Kings: Players with >= 1 hat-trick or 4-goal / 5+ matches
  const hatTrickKings: HatTrickKing[] = analyses
    .filter(
      (a) =>
        a.goalBreakdown.hatTricks > 0 ||
        a.goalBreakdown.fourGoalMatches > 0 ||
        a.goalBreakdown.fiveOrMoreGoalMatches > 0,
    )
    .map((a) => {
      const totalMultiGoalMatches =
        a.goalBreakdown.hatTricks +
        a.goalBreakdown.fourGoalMatches +
        a.goalBreakdown.fiveOrMoreGoalMatches;
      return {
        player: {
          id: a.player.id,
          fullName: a.player.fullName,
          displayName: a.player.displayName,
          position: a.player.position,
          team: a.player.team,
          imageUrl: a.player.imageUrl,
        },
        hatTricks: a.goalBreakdown.hatTricks,
        fourGoalMatches: a.goalBreakdown.fourGoalMatches,
        fiveOrMoreGoalMatches: a.goalBreakdown.fiveOrMoreGoalMatches,
        totalMultiGoalMatches,
        appearances: a.stats.appearances,
        goals: a.stats.goals,
      };
    })
    .sort((a, b) => {
      if (b.hatTricks !== a.hatTricks) {
        return b.hatTricks - a.hatTricks;
      }
      if (b.totalMultiGoalMatches !== a.totalMultiGoalMatches) {
        return b.totalMultiGoalMatches - a.totalMultiGoalMatches;
      }
      if (b.goals !== a.goals) {
        return b.goals - a.goals;
      }
      return b.appearances - a.appearances;
    });

  // 2. Brace Masters: Players with >= 1 brace
  const braceMasters: BraceMaster[] = analyses
    .filter((a) => a.goalBreakdown.braces > 0)
    .map((a) => ({
      player: {
        id: a.player.id,
        fullName: a.player.fullName,
        displayName: a.player.displayName,
        position: a.player.position,
        team: a.player.team,
        imageUrl: a.player.imageUrl,
      },
      braces: a.goalBreakdown.braces,
      appearances: a.stats.appearances,
      goals: a.stats.goals,
    }))
    .sort((a, b) => {
      if (b.braces !== a.braces) return b.braces - a.braces;
      if (b.goals !== a.goals) return b.goals - a.goals;
      return b.appearances - a.appearances;
    });

  // 3. Assists Ranking for eligible players
  const assistsRanking: AssistRankingEntry[] = analyses
    .filter(
      (a) =>
        isEligibleForRateRanking(a.stats.appearances, minAppsThreshold) &&
        a.stats.assistsPerAppearance !== null,
    )
    .map((a) => ({
      player: {
        id: a.player.id,
        fullName: a.player.fullName,
        displayName: a.player.displayName,
        position: a.player.position,
        team: a.player.team,
        imageUrl: a.player.imageUrl,
      },
      assistsPerAppearance: a.stats.assistsPerAppearance!,
      assists: a.stats.assists,
      appearances: a.stats.appearances,
      breakdown: a.assistBreakdown,
    }))
    .sort((a, b) => {
      if (b.assistsPerAppearance !== a.assistsPerAppearance) {
        return b.assistsPerAppearance - a.assistsPerAppearance;
      }
      return b.assists - a.assists;
    });

  // 4. Breakdown Table (filtered by minAppearances if specified)
  let tableRows: BreakdownTableRow[] = analyses.map((a) => ({
    player: a.player,
    stats: a.stats,
    goalBreakdown: a.goalBreakdown,
    assistBreakdown: a.assistBreakdown,
  }));

  if (minAppearances !== undefined && minAppearances > 0) {
    tableRows = tableRows.filter((row) => row.stats.appearances >= minAppearances);
  }

  // Sort breakdown table
  tableRows.sort((a, b) => {
    let result = 0;
    if (sortBy === "name") {
      result = a.player.fullName.localeCompare(b.player.fullName);
    } else if (sortBy === "appearances") {
      result = a.stats.appearances - b.stats.appearances;
    } else if (sortBy === "goals") {
      result = a.stats.goals - b.stats.goals;
    } else if (sortBy === "assists") {
      result = a.stats.assists - b.stats.assists;
    } else if (sortBy === "goalContributions") {
      result = a.stats.goalContributions - b.stats.goalContributions;
    } else if (sortBy === "goalsPerAppearance") {
      result = (a.stats.goalsPerAppearance ?? 0) - (b.stats.goalsPerAppearance ?? 0);
    } else if (sortBy === "assistsPerAppearance") {
      result =
        (a.stats.assistsPerAppearance ?? 0) - (b.stats.assistsPerAppearance ?? 0);
    } else if (sortBy === "contributionsPerAppearance") {
      result =
        (a.stats.contributionsPerAppearance ?? 0) -
        (b.stats.contributionsPerAppearance ?? 0);
    } else if (sortBy === "singleGoalMatches") {
      result = a.goalBreakdown.singleGoalMatches - b.goalBreakdown.singleGoalMatches;
    } else if (sortBy === "braces") {
      result = a.goalBreakdown.braces - b.goalBreakdown.braces;
    } else if (sortBy === "hatTricks") {
      result = a.goalBreakdown.hatTricks - b.goalBreakdown.hatTricks;
    } else if (sortBy === "fourGoalMatches") {
      result = a.goalBreakdown.fourGoalMatches - b.goalBreakdown.fourGoalMatches;
    } else if (sortBy === "fiveOrMoreGoalMatches") {
      result =
        a.goalBreakdown.fiveOrMoreGoalMatches -
        b.goalBreakdown.fiveOrMoreGoalMatches;
    } else if (sortBy === "singleAssistMatches") {
      result =
        a.assistBreakdown.singleAssistMatches -
        b.assistBreakdown.singleAssistMatches;
    } else if (sortBy === "twoAssistMatches") {
      result =
        a.assistBreakdown.twoAssistMatches - b.assistBreakdown.twoAssistMatches;
    } else if (sortBy === "threeAssistMatches") {
      result =
        a.assistBreakdown.threeAssistMatches -
        b.assistBreakdown.threeAssistMatches;
    } else if (sortBy === "fourOrMoreAssistMatches") {
      result =
        a.assistBreakdown.fourOrMoreAssistMatches -
        b.assistBreakdown.fourOrMoreAssistMatches;
    } else {
      // Default goals
      result = a.stats.goals - b.stats.goals;
    }

    if (result === 0) {
      result = a.player.fullName.localeCompare(b.player.fullName);
    }

    return sortOrder === "asc" ? result : -result;
  });

  const total = tableRows.length;
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(total / safePageSize);
  const startIndex = (safePage - 1) * safePageSize;
  const paginatedData = tableRows.slice(startIndex, startIndex + safePageSize);

  return {
    hatTrickKings,
    braceMasters,
    assistsRanking,
    table: {
      data: paginatedData,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    },
  };
}

/**
 * Takes 2 or 3 player IDs, fetches their stats and recent form (last 5 appearances),
 * and returns structured comparison data.
 */
export async function comparePlayers(
  playerIds: string[],
): Promise<ComparisonResult> {
  if (!playerIds || playerIds.length < 2 || playerIds.length > 3) {
    throw new Error(
      "Comparison requires between 2 and 3 player IDs.",
    );
  }

  // De-duplicate playerIds while preserving order
  const uniqueIds = Array.from(new Set(playerIds));
  if (uniqueIds.length < 2) {
    throw new Error("Comparison requires distinct player IDs.");
  }

  const players = await prisma.player.findMany({
    where: {
      id: { in: uniqueIds },
    },
    include: {
      performances: {
        include: {
          match: {
            select: {
              status: true,
              date: true,
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

  if (players.length !== uniqueIds.length) {
    throw new Error("One or more players could not be found.");
  }

  // Preserve requested order
  const orderedPlayers = uniqueIds.map((id) =>
    players.find((p) => p.id === id)!,
  );

  const playersData: PlayerComparisonData[] = orderedPlayers.map((p) => {
    const records: PerformanceRecord[] = p.performances.map((perf) => ({
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

    const completedApps = p.performances.filter(
      (perf) =>
        perf.match.status === "COMPLETED" && didAppear(perf.appearanceStatus),
    );
    const hasMinutes = completedApps.some((perf) => perf.minutesPlayed !== null);
    const totalMinutes = hasMinutes
      ? completedApps.reduce((sum, perf) => sum + (perf.minutesPlayed ?? 0), 0)
      : null;

    return {
      player: {
        id: p.id,
        fullName: p.fullName,
        displayName: p.displayName,
        position: p.position,
        team: p.team,
        imageUrl: p.imageUrl,
        squadNumber: p.squadNumber,
        nationality: p.nationality,
        preferredFoot: p.preferredFoot,
      },
      stats,
      goalBreakdown,
      assistBreakdown,
      recentForm,
      totalMinutes,
    };
  });

  // Calculate maximum/leader for each metric
  function getLeader<T extends number | null>(
    values: Record<string, T>,
  ): string | null {
    let maxVal: number | null = null;
    let leaderId: string | null = null;
    let isTie = false;

    for (const [id, val] of Object.entries(values)) {
      if (val === null) continue;
      if (maxVal === null || val > maxVal) {
        maxVal = val;
        leaderId = id;
        isTie = false;
      } else if (val === maxVal) {
        isTie = true;
      }
    }

    return isTie ? null : leaderId;
  }

  const appearancesValues: Record<string, number> = {};
  const goalsValues: Record<string, number> = {};
  const assistsValues: Record<string, number> = {};
  const contributionsValues: Record<string, number> = {};
  const goalsPerAppearanceValues: Record<string, number | null> = {};
  const assistsPerAppearanceValues: Record<string, number | null> = {};

  for (const item of playersData) {
    appearancesValues[item.player.id] = item.stats.appearances;
    goalsValues[item.player.id] = item.stats.goals;
    assistsValues[item.player.id] = item.stats.assists;
    contributionsValues[item.player.id] = item.stats.goalContributions;
    goalsPerAppearanceValues[item.player.id] = item.stats.goalsPerAppearance;
    assistsPerAppearanceValues[item.player.id] = item.stats.assistsPerAppearance;
  }

  return {
    players: playersData,
    comparison: {
      appearances: {
        maxPlayerId: getLeader(appearancesValues),
        values: appearancesValues,
      },
      goals: {
        maxPlayerId: getLeader(goalsValues),
        values: goalsValues,
      },
      assists: {
        maxPlayerId: getLeader(assistsValues),
        values: assistsValues,
      },
      contributions: {
        maxPlayerId: getLeader(contributionsValues),
        values: contributionsValues,
      },
      goalsPerAppearance: {
        maxPlayerId: getLeader(goalsPerAppearanceValues),
        values: goalsPerAppearanceValues,
      },
      assistsPerAppearance: {
        maxPlayerId: getLeader(assistsPerAppearanceValues),
        values: assistsPerAppearanceValues,
      },
    },
  };
}

export interface MilestoneMatchDetail {
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
  performance: {
    id: string;
    appearanceStatus: AppearanceStatus;
    minutesPlayed: number | null;
    goals: number;
    assists: number;
    notes: string | null;
  };
}

export interface PlayerMilestoneData {
  player: {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    team: string | null;
    imageUrl: string | null;
    squadNumber: number | null;
  };
  milestoneKey: string;
  milestoneTitle: string;
  description: string;
  matches: MilestoneMatchDetail[];
}

/**
 * Fetches match details behind a player's milestone for drill-down inspection.
 */
export async function getPlayerMilestoneMatches(
  playerId: string,
  milestoneKey: string,
  competitionId?: string,
): Promise<PlayerMilestoneData | null> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      fullName: true,
      displayName: true,
      position: true,
      team: true,
      imageUrl: true,
      squadNumber: true,
    },
  });

  if (!player) return null;

  const performances = await prisma.playerMatchPerformance.findMany({
    where: {
      playerId,
      match: {
        status: "COMPLETED",
        ...(competitionId ? { competitionId } : {}),
      },
    },
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
  });

  const appearedPerfs = performances.filter((p) =>
    didAppear(p.appearanceStatus),
  );

  let filtered = appearedPerfs;
  let title = "Contributing Matches";
  let description = "Matches recorded for this player";

  switch (milestoneKey) {
    case "hat_trick":
    case "hatTricks":
      filtered = appearedPerfs.filter((p) => p.goals === 3);
      title = "Hat-tricks (3 Goals)";
      description = "Matches where this player scored exactly 3 goals";
      break;
    case "brace":
    case "braces":
      filtered = appearedPerfs.filter((p) => p.goals === 2);
      title = "Braces (2 Goals)";
      description = "Matches where this player scored exactly 2 goals";
      break;
    case "single_goal":
    case "singleGoalMatches":
      filtered = appearedPerfs.filter((p) => p.goals === 1);
      title = "Single-Goal Matches";
      description = "Matches where this player scored exactly 1 goal";
      break;
    case "four_goal":
    case "fourGoalMatches":
      filtered = appearedPerfs.filter((p) => p.goals === 4);
      title = "Four-Goal Performances";
      description = "Matches where this player scored exactly 4 goals";
      break;
    case "five_plus_goal":
    case "fiveOrMoreGoalMatches":
      filtered = appearedPerfs.filter((p) => p.goals >= 5);
      title = "Five+ Goal Performances";
      description = "Matches where this player scored 5 or more goals";
      break;
    case "single_assist":
    case "singleAssistMatches":
      filtered = appearedPerfs.filter((p) => p.assists === 1);
      title = "Single-Assist Matches";
      description = "Matches where this player provided exactly 1 assist";
      break;
    case "two_assist":
    case "twoAssistMatches":
      filtered = appearedPerfs.filter((p) => p.assists === 2);
      title = "Two-Assist Matches";
      description = "Matches where this player provided exactly 2 assists";
      break;
    case "three_assist":
    case "threeAssistMatches":
      filtered = appearedPerfs.filter((p) => p.assists === 3);
      title = "Three-Assist Matches";
      description = "Matches where this player provided exactly 3 assists";
      break;
    case "four_plus_assist":
    case "fourOrMoreAssistMatches":
      filtered = appearedPerfs.filter((p) => p.assists >= 4);
      title = "Four+ Assist Matches";
      description = "Matches where this player provided 4 or more assists";
      break;
    case "goals":
      filtered = appearedPerfs.filter((p) => p.goals > 0);
      title = "All Scoring Matches";
      description = "Matches where this player scored at least 1 goal";
      break;
    case "assists":
      filtered = appearedPerfs.filter((p) => p.assists > 0);
      title = "All Assisting Matches";
      description = "Matches where this player provided at least 1 assist";
      break;
    case "goalContributions":
    case "contributions":
      filtered = appearedPerfs.filter((p) => p.goals > 0 || p.assists > 0);
      title = "Goal Contributions (G+A)";
      description = "Matches where this player scored or assisted";
      break;
    case "appearances":
    case "all":
    default:
      filtered = appearedPerfs;
      title = "All Match Appearances";
      description = "Completed matches in which the player appeared";
      break;
  }

  const matches: MilestoneMatchDetail[] = filtered.map((perf) => ({
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
    performance: {
      id: perf.id,
      appearanceStatus: perf.appearanceStatus,
      minutesPlayed: perf.minutesPlayed,
      goals: perf.goals,
      assists: perf.assists,
      notes: perf.notes,
    },
  }));

  return {
    player,
    milestoneKey,
    milestoneTitle: title,
    description,
    matches,
  };
}
