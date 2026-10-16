"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayerList } from "@/components/players/player-list";
import { PlayerFormDialog } from "@/components/players/player-form-dialog";
import type { PlayerWithStats, PaginatedPlayers } from "@/server/services/player.service";
import type { CompetitionWithCount } from "@/server/services/competition.service";
import {
  Search,
  UserPlus,
  FilterX,
  ArrowUpDown,
  Archive,
  Users,
} from "lucide-react";

const POSITIONS = [
  { value: "ALL", label: "All Positions" },
  { value: "GK", label: "GK — Goalkeeper" },
  { value: "CB", label: "CB — Centre-Back" },
  { value: "LB", label: "LB — Left-Back" },
  { value: "RB", label: "RB — Right-Back" },
  { value: "CDM", label: "CDM — Def. Midfield" },
  { value: "CM", label: "CM — Central Midfield" },
  { value: "CAM", label: "CAM — Att. Midfield" },
  { value: "LW", label: "LW — Left Wing" },
  { value: "RW", label: "RW — Right Wing" },
  { value: "ST", label: "ST — Striker" },
  { value: "UNKNOWN", label: "UNKNOWN" },
];

const SORT_OPTIONS = [
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "name:desc", label: "Name (Z–A)" },
  { value: "appearances:desc", label: "Most Appearances" },
  { value: "appearances:asc", label: "Least Appearances" },
  { value: "goals:desc", label: "Most Goals" },
  { value: "goals:asc", label: "Least Goals" },
  { value: "assists:desc", label: "Most Assists" },
  { value: "assists:asc", label: "Least Assists" },
  { value: "goalContributions:desc", label: "Most Goal Contributions (G+A)" },
  { value: "goalContributions:asc", label: "Least Goal Contributions (G+A)" },
];

export interface PlayersViewProps {
  paginatedPlayers: PaginatedPlayers;
  teams: string[];
  competitions: CompetitionWithCount[];
  currentFilters: {
    search?: string;
    position?: string;
    team?: string;
    archived?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page: number;
  };
}

export function PlayersView({
  paginatedPlayers,
  teams,
  currentFilters,
}: PlayersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(
    currentFilters.search ?? ""
  );

  // Sync search input if URL changes externally
  React.useEffect(() => {
    setSearchInput(currentFilters.search ?? "");
  }, [currentFilters.search]);

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 whenever any non-page filter changes
    if (!updates.hasOwnProperty("page")) {
      params.delete("page");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({ search: searchInput.trim() || null });
  };

  const handlePositionChange = (value: string) => {
    updateQueryParams({ position: value === "ALL" ? null : value });
  };

  const handleTeamChange = (value: string) => {
    updateQueryParams({ team: value === "ALL" ? null : value });
  };

  const handleArchivedToggle = (archivedOnly: boolean) => {
    updateQueryParams({ archived: archivedOnly ? "true" : null });
  };

  const handleSortChange = (combinedValue: string) => {
    const [field, order] = combinedValue.split(":");
    updateQueryParams({ sortBy: field || null, sortOrder: order || null });
  };

  const handleTableHeaderSort = (field: string) => {
    let newOrder: "asc" | "desc" = "desc";
    if (currentFilters.sortBy === field) {
      newOrder = currentFilters.sortOrder === "asc" ? "desc" : "asc";
    } else if (field === "name") {
      newOrder = "asc";
    }
    updateQueryParams({ sortBy: field, sortOrder: newOrder });
  };

  const handlePageChange = (newPage: number) => {
    updateQueryParams({ page: newPage > 1 ? String(newPage) : null });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(
    currentFilters.search ||
      currentFilters.position ||
      currentFilters.team ||
      currentFilters.archived
  );

  const currentSortValue = `${currentFilters.sortBy ?? "name"}:${
    currentFilters.sortOrder ?? (currentFilters.sortBy === "name" ? "asc" : "desc")
  }`;

  return (
    <div className="space-y-6">
      {/* Top Header & Add Player Trigger */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Player Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register squad members, track appearances and goals, and manage squad status.
          </p>
        </div>

        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2 shadow-sm font-semibold"
        >
          <UserPlus className="h-4 w-4" />
          Add Player
        </Button>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative md:col-span-4"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search players by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-14"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateQueryParams({ search: null });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </form>

          {/* Position Filter */}
          <div className="md:col-span-3">
            <Select
              value={currentFilters.position ?? "ALL"}
              onValueChange={handlePositionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Filter */}
          <div className="md:col-span-3">
            <Select
              value={currentFilters.team ?? "ALL"}
              onValueChange={handleTeamChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Team / Club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Teams</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By Selector */}
          <div className="md:col-span-2">
            <Select
              value={currentSortValue}
              onValueChange={handleSortChange}
            >
              <SelectTrigger>
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second Row: Active / Archived Toggle & Clear Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
          {/* Active / Archived Toggle */}
          <div className="flex items-center space-x-1 rounded-md bg-secondary/50 p-1">
            <Button
              type="button"
              variant={!currentFilters.archived ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleArchivedToggle(false)}
            >
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Active Players
            </Button>
            <Button
              type="button"
              variant={currentFilters.archived ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleArchivedToggle(true)}
            >
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archived ({currentFilters.archived ? paginatedPlayers.total : "Archive"})
            </Button>
          </div>

          {/* Filter summary and reset */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClearFilters}
            >
              <FilterX className="mr-1.5 h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Players List Table / Cards */}
      <PlayerList
        players={paginatedPlayers.data}
        total={paginatedPlayers.total}
        page={paginatedPlayers.page}
        pageSize={paginatedPlayers.pageSize}
        totalPages={paginatedPlayers.totalPages}
        sortBy={currentFilters.sortBy}
        sortOrder={currentFilters.sortOrder}
        onSortChange={handleTableHeaderSort}
        onPageChange={handlePageChange}
      />

      {/* Add Player Dialog */}
      <PlayerFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
