import { getGoalAssistBreakdown } from "@/server/services/stats.service";
import { getCompetitions } from "@/server/services/competition.service";
import { getPlayerTeams } from "@/server/services/player.service";
import { BreakdownView } from "@/components/breakdown/breakdown-view";
import { env } from "@/config/env";
import type { Position } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Goal & Assist Breakdown | Panenka",
  description:
    "Tactical milestone analysis, Hat-trick Kings, Brace Masters, assists per appearance, and detailed milestone matrix.",
};

export const dynamic = "force-dynamic";

interface BreakdownPageProps {
  searchParams: Promise<{
    search?: string;
    position?: string;
    competitionId?: string;
    team?: string;
    minAppearances?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
    pageSize?: string;
  }> | {
    search?: string;
    position?: string;
    competitionId?: string;
    team?: string;
    minAppearances?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
    pageSize?: string;
  };
}

export default async function BreakdownPage({ searchParams }: BreakdownPageProps) {
  const resolvedParams = await Promise.resolve(searchParams);

  const defaultMinApps = env.MIN_APPEARANCES_FOR_RATE || 3;
  const minAppearances = resolvedParams.minAppearances
    ? Number(resolvedParams.minAppearances)
    : defaultMinApps;

  const validPositions: string[] = [
    "GK",
    "CB",
    "LB",
    "RB",
    "CDM",
    "CM",
    "CAM",
    "LW",
    "RW",
    "ST",
    "UNKNOWN",
  ];

  const positionFilter =
    resolvedParams.position &&
    resolvedParams.position !== "ALL" &&
    validPositions.includes(resolvedParams.position)
      ? (resolvedParams.position as Position)
      : undefined;

  const [breakdownData, competitions, teams] = await Promise.all([
    getGoalAssistBreakdown({
      search: resolvedParams.search || undefined,
      position: positionFilter,
      competitionId:
        resolvedParams.competitionId && resolvedParams.competitionId !== "ALL"
          ? resolvedParams.competitionId
          : undefined,
      team:
        resolvedParams.team && resolvedParams.team !== "ALL"
          ? resolvedParams.team
          : undefined,
      minAppearances,
      page: resolvedParams.page ? Number(resolvedParams.page) : 1,
      pageSize: resolvedParams.pageSize ? Number(resolvedParams.pageSize) : 10,
      sortBy: resolvedParams.sortBy || "goals",
      sortOrder: (resolvedParams.sortOrder as "asc" | "desc") || "desc",
    }),
    getCompetitions(),
    getPlayerTeams(),
  ]);

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BreakdownView
        initialData={breakdownData}
        competitions={competitions}
        teams={teams}
        currentMinAppearances={minAppearances}
      />
    </main>
  );
}
