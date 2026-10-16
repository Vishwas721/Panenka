import { prisma } from "@/server/db/client";
import {
  type CreateMatchInput,
  type UpdateMatchInput,
} from "@/lib/validation";
import { MatchStatus } from "@prisma/client";

export async function getMatches(params: {
  competitionId?: string;
  status?: MatchStatus;
  page?: number;
  pageSize?: number;
}) {
  const { competitionId, status, page = 1, pageSize = 25 } = params;

  const whereClause: any = {
    ...(competitionId ? { competitionId } : {}),
    ...(status ? { status } : {}),
  };

  const [total, matches] = await Promise.all([
    prisma.match.count({ where: whereClause }),
    prisma.match.findMany({
      where: whereClause,
      include: {
        competition: { select: { id: true, name: true, season: true } },
        performances: {
          select: {
            id: true,
            playerId: true,
            appearanceStatus: true,
            goals: true,
            assists: true,
            minutesPlayed: true,
            player: {
              select: { id: true, fullName: true, displayName: true, position: true },
            },
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = matches.map((m) => {
    const totalGoals = m.performances.reduce((acc, p) => acc + p.goals, 0);
    const totalAssists = m.performances.reduce((acc, p) => acc + p.assists, 0);
    const appearingCount = m.performances.filter(
      (p) => p.appearanceStatus === "STARTED" || p.appearanceStatus === "SUBSTITUTE_USED",
    ).length;

    return {
      ...m,
      totalGoals,
      totalAssists,
      appearingCount,
    };
  });

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function getMatchById(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      competition: true,
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
            },
          },
        },
        orderBy: [
          { appearanceStatus: "asc" },
          { minutesPlayed: "desc" },
        ],
      },
    },
  });
}

export async function createMatch(data: CreateMatchInput) {
  const { performances, competitionId, ...matchData } = data;

  return prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: {
        ...matchData,
        competitionId: competitionId || null,
        performances: {
          create: performances.map((p) => ({
            playerId: p.playerId,
            appearanceStatus: p.appearanceStatus,
            minutesPlayed: p.minutesPlayed ?? null,
            goals: p.goals ?? 0,
            assists: p.assists ?? 0,
            notes: p.notes || null,
          })),
        },
      },
      include: {
        performances: true,
      },
    });

    return match;
  });
}

export async function updateMatch(id: string, data: UpdateMatchInput) {
  const { performances, competitionId, ...matchData } = data;

  return prisma.$transaction(async (tx) => {
    // If performances are provided, reconcile them
    if (performances) {
      await tx.playerMatchPerformance.deleteMany({
        where: { matchId: id },
      });

      await tx.playerMatchPerformance.createMany({
        data: performances.map((p) => ({
          matchId: id,
          playerId: p.playerId,
          appearanceStatus: p.appearanceStatus,
          minutesPlayed: p.minutesPlayed ?? null,
          goals: p.goals ?? 0,
          assists: p.assists ?? 0,
          notes: p.notes || null,
        })),
      });
    }

    const updatedMatch = await tx.match.update({
      where: { id },
      data: {
        ...(matchData.date !== undefined ? { date: matchData.date } : {}),
        ...(matchData.opponent !== undefined ? { opponent: matchData.opponent } : {}),
        ...(matchData.team !== undefined ? { team: matchData.team || null } : {}),
        ...(competitionId !== undefined ? { competitionId: competitionId || null } : {}),
        ...(matchData.venue !== undefined ? { venue: matchData.venue } : {}),
        ...(matchData.venueName !== undefined ? { venueName: matchData.venueName || null } : {}),
        ...(matchData.scoreHome !== undefined ? { scoreHome: matchData.scoreHome } : {}),
        ...(matchData.scoreAway !== undefined ? { scoreAway: matchData.scoreAway } : {}),
        ...(matchData.status !== undefined ? { status: matchData.status } : {}),
        ...(matchData.notes !== undefined ? { notes: matchData.notes || null } : {}),
      },
      include: {
        performances: true,
      },
    });

    return updatedMatch;
  });
}

export async function deleteMatch(id: string) {
  return prisma.match.delete({
    where: { id },
  });
}
