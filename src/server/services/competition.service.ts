import { prisma } from "@/server/db/client";

export async function getCompetitions() {
  const competitions = await prisma.competition.findMany({
    include: {
      _count: {
        select: { matches: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return competitions.map((c) => ({
    id: c.id,
    name: c.name,
    season: c.season,
    notes: c.notes,
    matchCount: c._count.matches,
  }));
}

export async function getCompetitionById(id: string) {
  return prisma.competition.findUnique({
    where: { id },
    include: {
      matches: {
        orderBy: { date: "desc" },
      },
    },
  });
}
