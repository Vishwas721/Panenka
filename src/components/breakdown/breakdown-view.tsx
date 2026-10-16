"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HatTrickKingsCard } from "./hat-trick-kings-card";
import { BraceMastersCard } from "./brace-masters-card";
import { AssistsRankingCard } from "./assists-ranking-card";
import { BreakdownFilters, type BreakdownFilterValues } from "./breakdown-filters";
import { BreakdownTable } from "./breakdown-table";
import {
  MilestoneDrilldownDialog,
  type DrillDownTarget,
} from "./milestone-drilldown-dialog";
import type { GoalAssistBreakdownResult } from "@/server/services/stats.service";
import { Trophy, Layers, Filter } from "lucide-react";

interface BreakdownViewProps {
  initialData: GoalAssistBreakdownResult;
  competitions: Array<{ id: string; name: string; season: string | null }>;
  teams: string[];
  currentMinAppearances: number;
}

export function BreakdownView({
  initialData,
  competitions,
  teams,
  currentMinAppearances,
}: BreakdownViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active drilldown modal target
  const [drillDownTarget, setDrillDownTarget] =
    React.useState<DrillDownTarget | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = React.useState(false);

  // Extract filter state from searchParams
  const filters: BreakdownFilterValues = React.useMemo(() => {
    return {
      search: searchParams.get("search") || "",
      position: searchParams.get("position") || "ALL",
      competitionId: searchParams.get("competitionId") || "ALL",
      team: searchParams.get("team") || "ALL",
      minAppearances: Number(
        searchParams.get("minAppearances") || currentMinAppearances || 0
      ),
      sortBy: searchParams.get("sortBy") || "goals",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };
  }, [searchParams, currentMinAppearances]);

  const page = Number(searchParams.get("page") || initialData.table.page || 1);
  const pageSize = Number(
    searchParams.get("pageSize") || initialData.table.pageSize || 10
  );

  // Helper to push URL updates
  const updateUrl = React.useCallback(
    (paramsToUpdate: Record<string, string | number | undefined>) => {
      const current = new URLSearchParams(searchParams.toString());

      for (const [key, val] of Object.entries(paramsToUpdate)) {
        if (
          val === undefined ||
          val === "" ||
          val === "ALL" ||
          (key === "page" && val === 1) ||
          (key === "pageSize" && val === 10) ||
          (key === "sortOrder" && val === "desc" && !paramsToUpdate.sortBy)
        ) {
          current.delete(key);
        } else {
          current.set(key, String(val));
        }
      }

      const queryString = current.toString();
      router.push(queryString ? `/breakdown?${queryString}` : "/breakdown");
    },
    [router, searchParams]
  );

  const handleFilterChange = (updated: Partial<BreakdownFilterValues>) => {
    // Reset to page 1 whenever filters change
    updateUrl({
      ...updated,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    router.push("/breakdown");
  };

  const handleSortChange = (newSortBy: string) => {
    let newSortOrder: "asc" | "desc" = "desc";
    if (filters.sortBy === newSortBy) {
      newSortOrder = filters.sortOrder === "desc" ? "asc" : "desc";
    }
    updateUrl({
      sortBy: newSortBy,
      sortOrder: newSortOrder,
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateUrl({ pageSize: newPageSize, page: 1 });
  };

  const handleOpenMilestone = (target: DrillDownTarget) => {
    setDrillDownTarget({
      ...target,
      competitionId:
        filters.competitionId && filters.competitionId !== "ALL"
          ? filters.competitionId
          : undefined,
    });
    setIsDrillDownOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
            <Trophy className="h-3.5 w-3.5" />
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Signature Feature
          </span>
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Goal & Assist Breakdown
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
          Multi-goal milestone analysis, per-appearance efficiency rankings, and granular match-by-match production drill-down.
        </p>
      </div>

      {/* Visual Hierarchy Section: 3 Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* A. Hat-trick Kings */}
        <HatTrickKingsCard
          kings={initialData.hatTrickKings}
          onSelectMilestone={handleOpenMilestone}
        />

        {/* B. Brace Masters */}
        <BraceMastersCard
          masters={initialData.braceMasters}
          onSelectMilestone={handleOpenMilestone}
        />

        {/* C. Assists per Appearance */}
        <AssistsRankingCard
          rankings={initialData.assistsRanking}
          minAppearances={filters.minAppearances || currentMinAppearances || 3}
          onMinAppearancesChange={(min) => handleFilterChange({ minAppearances: min })}
          onSelectMilestone={handleOpenMilestone}
        />
      </div>

      {/* Section Divider & Filter Controls */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              Complete Breakdown Matrix
            </h2>
            <p className="text-xs text-muted-foreground">
              Filterable across positions, teams, and competitions. Click any milestone badge for exact match drill-down.
            </p>
          </div>
        </div>

        {/* Filters */}
        <BreakdownFilters
          filters={filters}
          competitions={competitions}
          teams={teams}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* D. Complete Breakdown Table */}
        <BreakdownTable
          rows={initialData.table.data}
          total={initialData.table.total}
          page={initialData.table.page}
          pageSize={initialData.table.pageSize}
          totalPages={initialData.table.totalPages}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSelectMilestone={handleOpenMilestone}
        />
      </div>

      {/* F. Drill-Down Dialog */}
      <MilestoneDrilldownDialog
        open={isDrillDownOpen}
        onOpenChange={setIsDrillDownOpen}
        target={drillDownTarget}
      />
    </div>
  );
}
