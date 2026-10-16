"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlayerPicker } from "./player-picker";
import { SampleSizeWarning } from "./sample-size-warning";
import { EfficiencyCallout } from "./efficiency-callout";
import { GroupedBarChart } from "./grouped-bar-chart";
import { SideBySideTable } from "./side-by-side-table";
import { RecentFormComparison } from "./recent-form-comparison";
import type { ComparisonResult } from "@/server/services/stats.service";
import type { PlayerWithStats } from "@/server/services/player.service";
import { Scale, Users2, ArrowRight } from "lucide-react";

interface PlayerComparisonViewProps {
  allPlayers: PlayerWithStats[];
  initialComparison: ComparisonResult | null;
  initialSelectedIds: string[];
}

export function PlayerComparisonView({
  allPlayers,
  initialComparison,
  initialSelectedIds,
}: PlayerComparisonViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedIds = React.useMemo(() => {
    const fromQuery = searchParams.get("ids");
    if (fromQuery) {
      return fromQuery.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return initialSelectedIds;
  }, [searchParams, initialSelectedIds]);

  const handleSelectionChange = (newIds: string[]) => {
    if (newIds.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?ids=${encodeURIComponent(newIds.join(","))}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
            <Scale className="h-3.5 w-3.5" />
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Tactical Comparison
          </span>
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Player Head-to-Head Comparison
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
          Benchmarking cumulative output, per-appearance scoring and playmaking rates, milestone frequencies, and recent competitive form.
        </p>
      </div>

      {/* Player Picker */}
      <PlayerPicker
        allPlayers={allPlayers}
        selectedIds={selectedIds}
        onSelect={handleSelectionChange}
      />

      {/* Empty State when fewer than 2 players selected */}
      {(!initialComparison || initialComparison.players.length < 2) && (
        <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-12 text-center space-y-3">
          <Users2 className="h-10 w-10 mx-auto opacity-30 text-muted-foreground" />
          <h3 className="font-display text-lg font-semibold text-foreground">
            Select at least 2 players to start comparison
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Pick 2 or 3 squad members from the dropdown above, or click a Quick Matchup suggestion to inspect side-by-side performance data.
          </p>
        </div>
      )}

      {/* Comparison Analysis Content */}
      {initialComparison && initialComparison.players.length >= 2 && (
        <div className="space-y-6">
          {/* Sample Size Warning Banner */}
          <SampleSizeWarning players={initialComparison.players} />

          {/* Tactical Plain-Language Efficiency vs Output Callout */}
          <EfficiencyCallout players={initialComparison.players} />

          {/* Grouped Comparative Recharts Bar Chart */}
          <GroupedBarChart players={initialComparison.players} />

          {/* Side-by-Side Complete Metric Matrix */}
          <SideBySideTable comparisonResult={initialComparison} />

          {/* Recent Form Comparison */}
          <RecentFormComparison players={initialComparison.players} />
        </div>
      )}
    </div>
  );
}
