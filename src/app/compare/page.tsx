import { getPlayers } from "@/server/services/player.service";
import { comparePlayers, type ComparisonResult } from "@/server/services/stats.service";
import { PlayerComparisonView } from "@/components/compare/player-comparison-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Comparison | Panenka",
  description:
    "Head-to-head tactical comparison of players, per-appearance efficiency, milestone breakdowns, and recent form.",
};

export const dynamic = "force-dynamic";

interface ComparePageProps {
  searchParams: Promise<{
    ids?: string;
  }> | {
    ids?: string;
  };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const resolvedParams = await Promise.resolve(searchParams);

  // Fetch all active players for picker
  const allPlayersRes = await getPlayers({
    includeArchived: false,
    pageSize: 200,
    sortBy: "goals",
    sortOrder: "desc",
  });

  const rawIds = resolvedParams.ids;
  let selectedIds: string[] = [];

  if (rawIds !== undefined) {
    selectedIds = rawIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (allPlayersRes.data.length >= 2) {
    // Default to the top 2 goal scorers for instant comparison preview
    selectedIds = allPlayersRes.data.slice(0, 2).map((p) => p.id);
  }

  let comparisonResult: ComparisonResult | null = null;

  if (selectedIds.length >= 2 && selectedIds.length <= 3) {
    try {
      comparisonResult = await comparePlayers(selectedIds);
    } catch (err) {
      console.error("comparePlayers error:", err);
      // Fallback: If one ID was invalid, clear comparison
      comparisonResult = null;
    }
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PlayerComparisonView
        allPlayers={allPlayersRes.data}
        initialComparison={comparisonResult}
        initialSelectedIds={selectedIds}
      />
    </main>
  );
}
