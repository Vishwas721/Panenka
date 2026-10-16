import { prisma } from "@/server/db/client";
import {
  didAppear,
  type CreateMatchInput,
  type UpdateMatchInput,
  type PlayerPerformanceInput,
} from "@/lib/validation";
import type {
  Match,
  MatchStatus,
  MatchVenue,
  AppearanceStatus,
  Position,
  Prisma,
} from "@prisma/client";

export interface MatchScorer {
  playerId: string;
  fullName: string;
  displayName: string | null;
  goals: number;
}

export interface MatchSummary {
  totalGoals: number;
  totalAssists: number;
  appearancesCount: number;
  scorers: MatchScorer[];
}

export interface MatchListItem extends Match {
  competition: {
    id: string;
    name: string;
    season: string | null;
  } | null;
  performanceCount: number;
  summary: MatchSummary;
}

export interface PaginatedMatches {
  data: MatchListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MatchPerformanceDetail {
  id: string;
  playerId: string;
  appearanceStatus: AppearanceStatus;
  minutesPlayed: number | null;
  goals: number;
  assists: number;
  notes: string | null;
  player: {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    squadNumber: number | null;
    imageUrl: string | null;
    team: string | null;
  };
}

export interface MatchDetail extends Match {
  competition: {
    id: string;
    name: string;
    season: string | null;
    notes: string | null;
  } | null;
  performanceCount: number;
  summary: MatchSummary;
  performances: MatchPerformanceDetail[];
}

export interface GetMatchesParams {
  competitionId?: string;
  status?: MatchStatus;
  page?: number;
  pageSize?: number;
}

/**
 * Returns paginated matches with performance counts and summary.
 */
export async function getMatches(
  params: GetMatchesParams = {},
): Promise<PaginatedMatches> {
  const { competitionId, status, page = 1, pageSize = 10 } = params;

  const where: Prisma.MatchWhereInput = {
    ...(competitionId ? { competitionId } : {}),
    ...(status ? { status } : {}),
  };

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const skip = (safePage - 1) * safePageSize;

  const [total, rawMatches] = await Promise.all([
    prisma.match.count({ where }),
    prisma.match.findMany({
      where,
      skip,
      take: safePageSize,
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            season: true,
          },
        },
        _count: {
          select: { performances: true },
        },
        performances: {
          select: {
            id: true,
            playerId: true,
            appearanceStatus: true,
            goals: true,
            assists: true,
            minutesPlayed: true,
            player: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const data: MatchListItem[] = rawMatches.map((match) => {
    const { performances, _count, ...baseMatch } = match;

    const appearancesCount = performances.filter((p) =>
      didAppear(p.appearanceStatus),
    ).length;
    const totalGoals = performances.reduce((sum, p) => sum + p.goals, 0);
    const totalAssists = performances.reduce((sum, p) => sum + p.assists, 0);

    const scorers: MatchScorer[] = performances
      .filter((p) => p.goals > 0)
      .map((p) => ({
        playerId: p.playerId,
        fullName: p.player.fullName,
        displayName: p.player.displayName,
        goals: p.goals,
      }))
      .sort((a, b) => b.goals - a.goals);

    return {
      ...baseMatch,
      performanceCount: _count.performances,
      summary: {
        totalGoals,
        totalAssists,
        appearancesCount,
        scorers,
      },
    };
  });

  return {
    data,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  };
}

/**
 * Returns match with all associated player performances and player names.
 */
export async function getMatchById(id: string): Promise<MatchDetail | null> {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      competition: {
        select: {
          id: true,
          name: true,
          season: true,
          notes: true,
        },
      },
      performances: {
        include: {
          player: {
            select: {
              id: true,
              fullName: true,
              displayName: true,
              position: true,
              squadNumber: true,
              imageUrl: true,
              team: true,
            },
          },
        },
        orderBy: [
          { appearanceStatus: "asc" },
          { goals: "desc" },
          { assists: "desc" },
        ],
      },
    },
  });

  if (!match) return null;

  const appearancesCount = match.performances.filter((p) =>
    didAppear(p.appearanceStatus),
  ).length;
  const totalGoals = match.performances.reduce((sum, p) => sum + p.goals, 0);
  const totalAssists = match.performances.reduce((sum, p) => sum + p.assists, 0);

  const scorers: MatchScorer[] = match.performances
    .filter((p) => p.goals > 0)
    .map((p) => ({
      playerId: p.playerId,
      fullName: p.player.fullName,
      displayName: p.player.displayName,
      goals: p.goals,
    }))
    .sort((a, b) => b.goals - a.goals);

  return {
    ...match,
    performanceCount: match.performances.length,
    summary: {
      totalGoals,
      totalAssists,
      appearancesCount,
      scorers,
    },
  };
}

/**
 * Saves match and all performances atomically in one Prisma transaction ($transaction).
 */
export async function createMatch(data: CreateMatchInput): Promise<MatchDetail> {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: {
        date: data.date,
        opponent: data.opponent.trim(),
        team: data.team?.trim() || null,
        competitionId: data.competitionId?.trim() || null,
        venue: data.venue ?? null,
        venueName: data.venueName?.trim() || null,
        scoreHome: data.scoreHome ?? null,
        scoreAway: data.scoreAway ?? null,
        status: data.status,
        notes: data.notes?.trim() || null,
      },
    });

    if (data.performances && data.performances.length > 0) {
      await tx.playerMatchPerformance.createMany({
        data: data.performances.map((p: PlayerPerformanceInput) => ({
          matchId: match.id,
          playerId: p.playerId,
          appearanceStatus: p.appearanceStatus,
          minutesPlayed: p.minutesPlayed ?? null,
          goals: p.goals ?? 0,
          assists: p.assists ?? 0,
          notes: p.notes?.trim() || null,
        })),
      });
    }

    const created = await tx.match.findUniqueOrThrow({
      where: { id: match.id },
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            season: true,
            notes: true,
          },
        },
        performances: {
          include: {
            player: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                position: true,
                squadNumber: true,
                imageUrl: true,
                team: true,
              },
            },
          },
          orderBy: [
            { appearanceStatus: "asc" },
            { goals: "desc" },
            { assists: "desc" },
          ],
        },
      },
    });

    const appearancesCount = created.performances.filter((p) =>
      didAppear(p.appearanceStatus),
    ).length;
    const totalGoals = created.performances.reduce((sum, p) => sum + p.goals, 0);
    const totalAssists = created.performances.reduce(
      (sum, p) => sum + p.assists,
      0,
    );
    const scorers: MatchScorer[] = created.performances
      .filter((p) => p.goals > 0)
      .map((p) => ({
        playerId: p.playerId,
        fullName: p.player.fullName,
        displayName: p.player.displayName,
        goals: p.goals,
      }))
      .sort((a, b) => b.goals - a.goals);

    return {
      ...created,
      performanceCount: created.performances.length,
      summary: {
        totalGoals,
        totalAssists,
        appearancesCount,
        scorers,
      },
    };
  });
}

/**
 * Reconciles performances atomically in $transaction:
 * updates existing, creates new, removes omitted.
 */
export async function updateMatch(
  id: string,
  data: UpdateMatchInput,
): Promise<MatchDetail> {
  return prisma.$transaction(async (tx) => {
    const existingMatch = await tx.match.findUnique({
      where: { id },
    });
    if (!existingMatch) {
      throw new Error(`Match with ID "${id}" not found.`);
    }

    const updateData: Prisma.MatchUpdateInput = {};
    if (data.date !== undefined) updateData.date = data.date;
    if (data.opponent !== undefined) updateData.opponent = data.opponent.trim();
    if (data.team !== undefined) {
      updateData.team = data.team ? data.team.trim() : null;
    }
    if (data.competitionId !== undefined) {
      updateData.competition = data.competitionId
        ? { connect: { id: data.competitionId } }
        : { disconnect: true };
    }
    if (data.venue !== undefined) updateData.venue = data.venue;
    if (data.venueName !== undefined) {
      updateData.venueName = data.venueName ? data.venueName.trim() : null;
    }
    if (data.scoreHome !== undefined) updateData.scoreHome = data.scoreHome;
    if (data.scoreAway !== undefined) updateData.scoreAway = data.scoreAway;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) {
      updateData.notes = data.notes ? data.notes.trim() : null;
    }

    if (Object.keys(updateData).length > 0) {
      await tx.match.update({
        where: { id },
        data: updateData,
      });
    }

    // Reconcile performances if provided
    if (data.performances !== undefined) {
      const existingPerformances = await tx.playerMatchPerformance.findMany({
        where: { matchId: id },
      });
      const existingPlayerIds = new Set(
        existingPerformances.map((p) => p.playerId),
      );
      const incomingPlayerIds = new Set(data.performances.map((p) => p.playerId));

      // 1. Delete removed performances
      const toDelete = existingPerformances.filter(
        (p) => !incomingPlayerIds.has(p.playerId),
      );
      if (toDelete.length > 0) {
        await tx.playerMatchPerformance.deleteMany({
          where: {
            matchId: id,
            playerId: { in: toDelete.map((p) => p.playerId) },
          },
        });
      }

      // 2. Update existing or create new performances
      for (const p of data.performances) {
        if (existingPlayerIds.has(p.playerId)) {
          await tx.playerMatchPerformance.update({
            where: {
              playerId_matchId: {
                matchId: id,
                playerId: p.playerId,
              },
            },
            data: {
              appearanceStatus: p.appearanceStatus,
              minutesPlayed: p.minutesPlayed ?? null,
              goals: p.goals ?? 0,
              assists: p.assists ?? 0,
              notes: p.notes?.trim() || null,
            },
          });
        } else {
          await tx.playerMatchPerformance.create({
            data: {
              matchId: id,
              playerId: p.playerId,
              appearanceStatus: p.appearanceStatus,
              minutesPlayed: p.minutesPlayed ?? null,
              goals: p.goals ?? 0,
              assists: p.assists ?? 0,
              notes: p.notes?.trim() || null,
            },
          });
        }
      }
    }

    const updated = await tx.match.findUniqueOrThrow({
      where: { id },
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            season: true,
            notes: true,
          },
        },
        performances: {
          include: {
            player: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                position: true,
                squadNumber: true,
                imageUrl: true,
                team: true,
              },
            },
          },
          orderBy: [
            { appearanceStatus: "asc" },
            { goals: "desc" },
            { assists: "desc" },
          ],
        },
      },
    });

    const appearancesCount = updated.performances.filter((p) =>
      didAppear(p.appearanceStatus),
    ).length;
    const totalGoals = updated.performances.reduce((sum, p) => sum + p.goals, 0);
    const totalAssists = updated.performances.reduce(
      (sum, p) => sum + p.assists,
      0,
    );
    const scorers: MatchScorer[] = updated.performances
      .filter((p) => p.goals > 0)
      .map((p) => ({
        playerId: p.playerId,
        fullName: p.player.fullName,
        displayName: p.player.displayName,
        goals: p.goals,
      }))
      .sort((a, b) => b.goals - a.goals);

    return {
      ...updated,
      performanceCount: updated.performances.length,
      summary: {
        totalGoals,
        totalAssists,
        appearancesCount,
        scorers,
      },
    };
  });
}

/**
 * Deletes match and cascades performances atomically.
 */
export async function deleteMatch(id: string): Promise<Match> {
  return prisma.$transaction(async (tx) => {
    await tx.playerMatchPerformance.deleteMany({
      where: { matchId: id },
    });
    return tx.match.delete({
      where: { id },
    });
  });
}
