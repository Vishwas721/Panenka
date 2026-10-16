import { prisma } from "@/server/db/client";
import {
  calcPlayerStats,
  calcGoalBreakdown,
  calcAssistBreakdown,
  calcRecentForm,
  compareForRanking,
  type PlayerStats,
  type GoalBreakdown,
  type AssistBreakdown,
  type RecentForm,
  type PerformanceRecord,
} from "@/lib/stats";
import {
  type CreatePlayerInput,
  type UpdatePlayerInput,
} from "@/lib/validation";
import { Position, PreferredFoot } from "@prisma/client";

export interface PlayerWithStats {
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
  isDemo: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  stats: PlayerStats;
}

export interface PlayerDetail extends PlayerWithStats {
  goalBreakdown: GoalBreakdown;
  assistBreakdown: AssistBreakdown;
  recentForm: RecentForm;
  matches: {
    matchId: string;
    date: Date;
    opponent: string;
    team: string | null;
    status: string;
    appearanceStatus: string;
    minutesPlayed: number | null;
    goals: number;
    assists: number;
    contributions: number;
  }[];
}

export async function checkDuplicatePlayer(
  fullName: string,
  team?: string | null,
  excludeId?: string,
): Promise<boolean> {
  const normalizedName = fullName.trim().toLowerCase();
  const normalizedTeam = team?.trim().toLowerCase() || null;

  const candidates = await prisma.player.findMany({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      team: normalizedTeam ? { equals: team?.trim(), mode: "insensitive" } : null,
    },
    select: { id: true, fullName: true },
  });

  return candidates.some(
    (p) => p.fullName.trim().toLowerCase() === normalizedName,
  );
}

export async function createPlayer(data: CreatePlayerInput) {
  const isDuplicate = await checkDuplicatePlayer(data.fullName, data.team);
  if (isDuplicate) {
    throw new Error(
      `A player named "${data.fullName}" already exists in team "${data.team || "None"}".`,
    );
  }

  return prisma.player.create({
    data: {
      fullName: data.fullName,
      displayName: data.displayName || null,
      position: data.position,
      preferredFoot: data.preferredFoot,
      squadNumber: data.squadNumber ?? null,
      team: data.team || null,
      nationality: data.nationality || null,
      imageUrl: data.imageUrl || null,
      notes: data.notes || null,
    },
  });
}

export async function updatePlayer(id: string, data: UpdatePlayerInput) {
  if (data.fullName) {
    const isDuplicate = await checkDuplicatePlayer(data.fullName, data.team, id);
    if (isDuplicate) {
      throw new Error(
        `A player named "${data.fullName}" already exists in team "${data.team || "None"}".`,
      );
    }
  }

  return prisma.player.update({
    where: { id },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.displayName !== undefined ? { displayName: data.displayName || null } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
      ...(data.preferredFoot !== undefined ? { preferredFoot: data.preferredFoot } : {}),
      ...(data.squadNumber !== undefined ? { squadNumber: data.squadNumber } : {}),
      ...(data.team !== undefined ? { team: data.team || null } : {}),
      ...(data.nationality !== undefined ? { nationality: data.nationality || null } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
    },
  });
}

export async function archivePlayer(id: string) {
  return prisma.player.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
}

export async function restorePlayer(id: string) {
  return prisma.player.update({
    where: { id },
    data: { archivedAt: null },
  });
}

export async function deletePlayer(id: string) {
  const performanceCount = await prisma.playerMatchPerformance.count({
    where: { playerId: id },
  });

  if (performanceCount > 0) {
    throw new Error(
      "Cannot delete player with recorded performances. Archive them instead.",
    );
  }

  return prisma.player.delete({
    where: { id },
  });
}

export async function getPlayers(params: {
  search?: string;
  position?: Position;
  team?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "appearances" | "goals" | "assists" | "goalContributions";
  sortOrder?: "asc" | "desc";
}): Promise<{ data: PlayerWithStats[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const {
    search,
    position,
    team,
    includeArchived = false,
    page = 1,
    pageSize = 25,
    sortBy = "name",
    sortOrder = "asc",
  } = params;

  const whereClause: any = {
    ...(!includeArchived ? { archivedAt: null } : {}),
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
  };

  const players = await prisma.player.findMany({
    where: whereClause,
    include: {
      performances: {
        include: {
          match: {
            select: { status: true, date: true, createdAt: true },
          },
        },
      },
    },
  });

  const playersWithStats: PlayerWithStats[] = players.map((player) => {
    const perfRecords: PerformanceRecord[] = player.performances.map((perf) => ({
      goals: perf.goals,
      assists: perf.assists,
      minutesPlayed: perf.minutesPlayed,
      appeared: perf.appearanceStatus === "STARTED" || perf.appearanceStatus === "SUBSTITUTE_USED",
      matchCompleted: perf.match.status === "COMPLETED",
    }));

    const stats = calcPlayerStats(perfRecords);
    const { performances, ...playerFields } = player;

    return {
      ...playerFields,
      stats,
    };
  });

  // Sort
  playersWithStats.sort((a, b) => {
    let comp = 0;
    if (sortBy === "name") {
      comp = a.fullName.localeCompare(b.fullName);
    } else if (sortBy === "appearances") {
      comp = a.stats.appearances - b.stats.appearances;
    } else if (sortBy === "goals") {
      comp = a.stats.goals - b.stats.goals;
    } else if (sortBy === "assists") {
      comp = a.stats.assists - b.stats.assists;
    } else if (sortBy === "goalContributions") {
      comp = a.stats.goalContributions - b.stats.goalContributions;
    }

    return sortOrder === "desc" ? -comp : comp;
  });

  const total = playersWithStats.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedData = playersWithStats.slice(startIndex, startIndex + pageSize);

  return {
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function getPlayerById(id: string): Promise<PlayerDetail | null> {
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      performances: {
        include: {
          match: true,
        },
        orderBy: [
          { match: { date: "desc" } },
          { match: { createdAt: "desc" } },
        ],
      },
    },
  });

  if (!player) return null;

  const perfRecords: PerformanceRecord[] = player.performances.map((perf) => ({
    goals: perf.goals,
    assists: perf.assists,
    minutesPlayed: perf.minutesPlayed,
    appeared: perf.appearanceStatus === "STARTED" || perf.appearanceStatus === "SUBSTITUTE_USED",
    matchCompleted: perf.match.status === "COMPLETED",
  }));

  const stats = calcPlayerStats(perfRecords);
  const goalBreakdown = calcGoalBreakdown(perfRecords);
  const assistBreakdown = calcAssistBreakdown(perfRecords);
  const recentForm = calcRecentForm(perfRecords);

  const matches = player.performances.map((perf) => ({
    matchId: perf.matchId,
    date: perf.match.date,
    opponent: perf.match.opponent,
    team: perf.match.team,
    status: perf.match.status,
    appearanceStatus: perf.appearanceStatus,
    minutesPlayed: perf.minutesPlayed,
    goals: perf.goals,
    assists: perf.assists,
    contributions: perf.goals + perf.assists,
  }));

  const { performances, ...playerFields } = player;

  return {
    ...playerFields,
    stats,
    goalBreakdown,
    assistBreakdown,
    recentForm,
    matches,
  };
}
