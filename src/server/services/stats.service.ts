import { prisma } from "@/server/db/client";
import {
  calcPlayerStats,
  calcGoalBreakdown,
  calcAssistBreakdown,
  calcRecentForm,
  compareForRanking,
  isEligibleForRateRanking,
  type PerformanceRecord,
  type RankablePlayer,
} from "@/lib/stats";
import { Position } from "@prisma/client";

const DEFAULT_MIN_APPEARANCES = 3;

export async function getDashboardSummary() {
  const [totalPlayersRegistered, totalPlayersArchived, completedMatchesCount] =
    await Promise.all([
      prisma.player.count(),
      prisma.player.count({ where: { archivedAt: { not: null } } }),
      prisma.match.count({ where: { status: "COMPLETED" } }),
    ]);

  const activePlayersCount = totalPlayersRegistered - totalPlayersArchived;

  // Fetch all completed match performances
  const completedPerformances = await prisma.playerMatchPerformance.findMany({
    where: {
      appearanceStatus: { in: ["STARTED", "SUBSTITUTE_USED"] },
      match: { status: "COMPLETED" },
    },
    include: {
      player: {
        select: {
          id: true,
          fullName: true,
          displayName: true,
          position: true,
          team: true,
          imageUrl: true,
          archivedAt: true,
        },
      },
    },
  });

  const totalGoals = completedPerformances.reduce((acc, p) => acc + p.goals, 0);
  const totalAssists = completedPerformances.reduce((acc, p) => acc + p.assists, 0);
  const totalContributions = totalGoals + totalAssists;

  // Group by player for leaderboard
  const playerMap = new Map<
    string,
    {
      player: (typeof completedPerformances)[0]["player"];
      records: PerformanceRecord[];
      totalMinutes: number;
    }
  >();

  for (const p of completedPerformances) {
    let entry = playerMap.get(p.playerId);
    if (!entry) {
      entry = {
        player: p.player,
        records: [],
        totalMinutes: 0,
      };
      playerMap.set(p.playerId, entry);
    }
    entry.records.push({
      goals: p.goals,
      assists: p.assists,
      minutesPlayed: p.minutesPlayed,
      appeared: true,
      matchCompleted: true,
    });
    if (p.minutesPlayed) {
      entry.totalMinutes += p.minutesPlayed;
    }
  }

  const allPlayersStats = Array.from(playerMap.values()).map((item) => {
    const stats = calcPlayerStats(item.records);
    return {
      ...item.player,
      stats,
      totalMinutes: item.totalMinutes,
    };
  });

  // Top Scorer
  const topScorerList = [...allPlayersStats]
    .filter((p) => p.stats.goals > 0)
    .sort((a, b) =>
      compareForRanking(
        {
          id: a.id,
          fullName: a.fullName,
          primaryMetric: a.stats.goals,
          appearances: a.stats.appearances,
          totalMinutes: a.totalMinutes,
        },
        {
          id: b.id,
          fullName: b.fullName,
          primaryMetric: b.stats.goals,
          appearances: b.stats.appearances,
          totalMinutes: b.totalMinutes,
        },
      ),
    )
    .slice(0, 5);

  // Top Assister
  const topAssisterList = [...allPlayersStats]
    .filter((p) => p.stats.assists > 0)
    .sort((a, b) =>
      compareForRanking(
        {
          id: a.id,
          fullName: a.fullName,
          primaryMetric: a.stats.assists,
          appearances: a.stats.appearances,
          totalMinutes: a.totalMinutes,
        },
        {
          id: b.id,
          fullName: b.fullName,
          primaryMetric: b.stats.assists,
          appearances: b.stats.appearances,
          totalMinutes: b.totalMinutes,
        },
      ),
    )
    .slice(0, 5);

  // Most Contributions
  const topContributionsList = [...allPlayersStats]
    .filter((p) => p.stats.goalContributions > 0)
    .sort((a, b) =>
      compareForRanking(
        {
          id: a.id,
          fullName: a.fullName,
          primaryMetric: a.stats.goalContributions,
          appearances: a.stats.appearances,
          totalMinutes: a.totalMinutes,
        },
        {
          id: b.id,
          fullName: b.fullName,
          primaryMetric: b.stats.goalContributions,
          appearances: b.stats.appearances,
          totalMinutes: b.totalMinutes,
        },
      ),
    )
    .slice(0, 5);

  // Best Goals Per App (min appearances >= 3)
  const eligiblePlayers = allPlayersStats.filter((p) =>
    isEligibleForRateRanking(p.stats.appearances, DEFAULT_MIN_APPEARANCES),
  );

  const bestGoalsPerAppList = [...eligiblePlayers]
    .filter((p) => p.stats.goalsPerAppearance !== null)
    .sort((a, b) => (b.stats.goalsPerAppearance ?? 0) - (a.stats.goalsPerAppearance ?? 0))
    .slice(0, 5);

  const bestRate = bestGoalsPerAppList[0]?.stats.goalsPerAppearance ?? null;

  // Recent activity
  const recentMatches = await prisma.match.findMany({
    orderBy: { date: "desc" },
    take: 5,
    include: {
      competition: { select: { name: true } },
    },
  });

  const recentPlayers = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    totalPlayers: {
      registered: totalPlayersRegistered,
      active: activePlayersCount,
      archived: totalPlayersArchived,
    },
    totalMatches: completedMatchesCount,
    totalGoals,
    totalAssists,
    totalContributions,
    bestGoalsPerAppearance: bestRate,
    minAppearancesThreshold: DEFAULT_MIN_APPEARANCES,
    leaderboard: {
      topScorer: topScorerList,
      topAssister: topAssisterList,
      mostContributions: topContributionsList,
      bestGoalsPerApp: bestGoalsPerAppList,
    },
    recentActivity: {
      matches: recentMatches,
      players: recentPlayers,
    },
  };
}

export async function getGoalAssistBreakdown(params: {
  search?: string;
  position?: Position;
  team?: string;
  competitionId?: string;
  minAppearances?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const {
    search,
    position,
    team,
    competitionId,
    minAppearances = 0,
    page = 1,
    pageSize = 25,
    sortBy = "goals",
    sortOrder = "desc",
  } = params;

  const players = await prisma.player.findMany({
    where: {
      ...(position ? { position } : {}),
      ...(team ? { team: { contains: team, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { displayName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      performances: {
        where: {
          appearanceStatus: { in: ["STARTED", "SUBSTITUTE_USED"] },
          match: {
            status: "COMPLETED",
            ...(competitionId ? { competitionId } : {}),
          },
        },
        include: {
          match: { select: { id: true, date: true, opponent: true, status: true } },
        },
      },
    },
  });

  const breakdownRows = players.map((p) => {
    const perfRecords: PerformanceRecord[] = p.performances.map((perf) => ({
      goals: perf.goals,
      assists: perf.assists,
      minutesPlayed: perf.minutesPlayed,
      appeared: true,
      matchCompleted: true,
    }));

    const stats = calcPlayerStats(perfRecords);
    const goalBreakdown = calcGoalBreakdown(perfRecords);
    const assistBreakdown = calcAssistBreakdown(perfRecords);

    return {
      player: {
        id: p.id,
        fullName: p.fullName,
        displayName: p.displayName,
        position: p.position,
        team: p.team,
        imageUrl: p.imageUrl,
        archivedAt: p.archivedAt,
      },
      stats,
      goalBreakdown,
      assistBreakdown,
      matches: p.performances.map((perf) => ({
        matchId: perf.matchId,
        date: perf.match.date,
        opponent: perf.match.opponent,
        goals: perf.goals,
        assists: perf.assists,
      })),
    };
  });

  // Filter by min appearances
  const filtered = breakdownRows.filter(
    (row) => row.stats.appearances >= minAppearances,
  );

  // Hat-trick Kings
  const hatTrickKings = [...breakdownRows]
    .filter((row) => row.goalBreakdown.hatTricks > 0)
    .sort((a, b) => b.goalBreakdown.hatTricks - a.goalBreakdown.hatTricks);

  // Brace Masters
  const braceMasters = [...breakdownRows]
    .filter((row) => row.goalBreakdown.braces > 0)
    .sort((a, b) => b.goalBreakdown.braces - a.goalBreakdown.braces);

  // Assists per Appearance (min 3 apps)
  const assistsPerAppRanking = [...breakdownRows]
    .filter(
      (row) =>
        row.stats.appearances >= DEFAULT_MIN_APPEARANCES &&
        row.stats.assistsPerAppearance !== null,
    )
    .sort(
      (a, b) =>
        (b.stats.assistsPerAppearance ?? 0) - (a.stats.assistsPerAppearance ?? 0),
    );

  // Sort full breakdown table
  filtered.sort((a, b) => {
    let comp = 0;
    switch (sortBy) {
      case "player":
        comp = a.player.fullName.localeCompare(b.player.fullName);
        break;
      case "appearances":
        comp = a.stats.appearances - b.stats.appearances;
        break;
      case "goals":
        comp = a.stats.goals - b.stats.goals;
        break;
      case "assists":
        comp = a.stats.assists - b.stats.assists;
        break;
      case "goalContributions":
        comp = a.stats.goalContributions - b.stats.goalContributions;
        break;
      case "goalsPerAppearance":
        comp = (a.stats.goalsPerAppearance ?? -1) - (b.stats.goalsPerAppearance ?? -1);
        break;
      case "assistsPerAppearance":
        comp = (a.stats.assistsPerAppearance ?? -1) - (b.stats.assistsPerAppearance ?? -1);
        break;
      case "singleGoalMatches":
        comp = a.goalBreakdown.singleGoalMatches - b.goalBreakdown.singleGoalMatches;
        break;
      case "braces":
        comp = a.goalBreakdown.braces - b.goalBreakdown.braces;
        break;
      case "hatTricks":
        comp = a.goalBreakdown.hatTricks - b.goalBreakdown.hatTricks;
        break;
      default:
        comp = a.stats.goals - b.stats.goals;
    }
    return sortOrder === "desc" ? -comp : comp;
  });

  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return {
    hatTrickKings: hatTrickKings.slice(0, 10),
    braceMasters: braceMasters.slice(0, 10),
    assistsPerAppRanking: assistsPerAppRanking.slice(0, 10),
    table: {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

export async function comparePlayers(playerIds: string[]) {
  if (playerIds.length < 2 || playerIds.length > 3) {
    throw new Error("Can only compare 2 or 3 players.");
  }

  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    include: {
      performances: {
        where: {
          appearanceStatus: { in: ["STARTED", "SUBSTITUTE_USED"] },
          match: { status: "COMPLETED" },
        },
        include: {
          match: { select: { date: true, createdAt: true, opponent: true } },
        },
        orderBy: [
          { match: { date: "desc" } },
          { match: { createdAt: "desc" } },
        ],
      },
    },
  });

  return players.map((p) => {
    const perfRecords: PerformanceRecord[] = p.performances.map((perf) => ({
      goals: perf.goals,
      assists: perf.assists,
      minutesPlayed: perf.minutesPlayed,
      appeared: true,
      matchCompleted: true,
    }));

    const stats = calcPlayerStats(perfRecords);
    const recentForm = calcRecentForm(perfRecords);

    return {
      id: p.id,
      fullName: p.fullName,
      displayName: p.displayName,
      position: p.position,
      team: p.team,
      imageUrl: p.imageUrl,
      stats,
      recentForm,
      isEligible: isEligibleForRateRanking(stats.appearances, DEFAULT_MIN_APPEARANCES),
    };
  });
}
