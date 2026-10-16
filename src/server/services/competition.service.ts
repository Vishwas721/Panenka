import { prisma } from "@/server/db/client";
import type { Competition } from "@prisma/client";

export interface CompetitionWithCount extends Competition {
  _count: {
    matches: number;
  };
}

/**
 * Get all competitions for dropdowns, filters, and management.
 */
export async function getCompetitions(): Promise<CompetitionWithCount[]> {
  return prisma.competition.findMany({
    orderBy: [
      { season: "desc" },
      { name: "asc" },
    ],
    include: {
      _count: {
        select: { matches: true },
      },
    },
  });
}

/**
 * Get a single competition by its unique ID, including match count.
 */
export async function getCompetitionById(
  id: string,
): Promise<CompetitionWithCount | null> {
  return prisma.competition.findUnique({
    where: { id },
    include: {
      _count: {
        select: { matches: true },
      },
    },
  });
}
