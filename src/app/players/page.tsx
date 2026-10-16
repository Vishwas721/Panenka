import { getPlayers, getDistinctTeams } from "@/server/services/player.service";
import { getCompetitions } from "@/server/services/competition.service";
import { PlayersView } from "@/components/players/players-view";
import type { Position } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Players | Panenka",
  description: "Manage players, track performance metrics, and view squad statistics.",
};

interface PlayersPageProps {
  searchParams: Promise<{
    search?: string;
    position?: string;
    team?: string;
    archived?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }> | {
    search?: string;
    position?: string;
    team?: string;
    archived?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  };
}

const VALID_POSITIONS: Position[] = [
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

type SortField = "name" | "appearances" | "goals" | "assists" | "goalContributions";
const VALID_SORTS: SortField[] = [
  "name",
  "appearances",
  "goals",
  "assists",
  "goalContributions",
];

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const resolvedParams = await Promise.resolve(searchParams);

  const search = resolvedParams.search?.trim() || undefined;

  const positionParam = resolvedParams.position?.toUpperCase();
  const position = VALID_POSITIONS.includes(positionParam as Position)
    ? (positionParam as Position)
    : undefined;

  const team = resolvedParams.team?.trim() || undefined;
  const includeArchived = resolvedParams.archived === "true";

  const sortByParam = resolvedParams.sortBy as SortField;
  const sortBy: SortField = VALID_SORTS.includes(sortByParam)
    ? sortByParam
    : "name";

  const sortOrderParam = resolvedParams.sortOrder?.toLowerCase();
  const sortOrder: "asc" | "desc" =
    sortOrderParam === "asc" || sortOrderParam === "desc"
      ? sortOrderParam
      : sortBy === "name"
      ? "asc"
      : "desc";

  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const pageSize = 25; // As specified in requirements

  // Call services in parallel
  const [paginatedPlayers, competitions, teams] = await Promise.all([
    getPlayers({
      search,
      position,
      team,
      includeArchived,
      page,
      pageSize,
      sortBy,
      sortOrder,
    }),
    getCompetitions(),
    getDistinctTeams(),
  ]);

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PlayersView
        paginatedPlayers={paginatedPlayers}
        teams={teams}
        competitions={competitions}
        currentFilters={{
          search,
          position,
          team,
          archived: includeArchived,
          sortBy,
          sortOrder,
          page,
        }}
      />
    </main>
  );
}
