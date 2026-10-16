"use client";

import * as React from "react";
import { Position } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";

export interface BreakdownFilterValues {
  search: string;
  position: string;
  competitionId: string;
  team: string;
  minAppearances: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface BreakdownFiltersProps {
  filters: BreakdownFilterValues;
  competitions: Array<{ id: string; name: string; season: string | null }>;
  teams: string[];
  onChange: (updated: Partial<BreakdownFilterValues>) => void;
  onReset: () => void;
}

export const SORT_OPTIONS = [
  { value: "goals", label: "Goals (Total)" },
  { value: "assists", label: "Assists (Total)" },
  { value: "goalContributions", label: "G+A Contributions" },
  { value: "goalsPerAppearance", label: "Goals / App" },
  { value: "assistsPerAppearance", label: "Assists / App" },
  { value: "contributionsPerAppearance", label: "Contributions / App" },
  { value: "appearances", label: "Appearances" },
  { value: "hatTricks", label: "Hat-tricks (3)" },
  { value: "braces", label: "Braces (2)" },
  { value: "singleGoalMatches", label: "Single-Goal (1)" },
  { value: "fourGoalMatches", label: "Four-Goal (4)" },
  { value: "fiveOrMoreGoalMatches", label: "Five+ Goal (5+)" },
  { value: "singleAssistMatches", label: "Single-Assist (1)" },
  { value: "twoAssistMatches", label: "Two-Assist (2)" },
  { value: "threeAssistMatches", label: "Three-Assist (3)" },
  { value: "fourOrMoreAssistMatches", label: "Four+ Assist (4+)" },
  { value: "name", label: "Player Name" },
];

export function BreakdownFilters({
  filters,
  competitions,
  teams,
  onChange,
  onReset,
}: BreakdownFiltersProps) {
  const isFiltered =
    Boolean(filters.search) ||
    Boolean(filters.position && filters.position !== "ALL") ||
    Boolean(filters.competitionId && filters.competitionId !== "ALL") ||
    Boolean(filters.team && filters.team !== "ALL") ||
    filters.minAppearances > 0 ||
    filters.sortBy !== "goals" ||
    filters.sortOrder !== "desc";

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-2xs space-y-3">
      {/* Search and Top Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search player name..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="pl-8 text-xs h-9"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: "" })}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Position Select */}
        <Select
          value={filters.position || "ALL"}
          onValueChange={(val) => onChange({ position: val })}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Positions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Positions</SelectItem>
            <SelectItem value="GK">Goalkeeper (GK)</SelectItem>
            <SelectItem value="CB">Center Back (CB)</SelectItem>
            <SelectItem value="LB">Left Back (LB)</SelectItem>
            <SelectItem value="RB">Right Back (RB)</SelectItem>
            <SelectItem value="CDM">Defensive Mid (CDM)</SelectItem>
            <SelectItem value="CM">Central Mid (CM)</SelectItem>
            <SelectItem value="CAM">Attacking Mid (CAM)</SelectItem>
            <SelectItem value="LW">Left Wing (LW)</SelectItem>
            <SelectItem value="RW">Right Wing (RW)</SelectItem>
            <SelectItem value="ST">Striker (ST)</SelectItem>
          </SelectContent>
        </Select>

        {/* Competition Select */}
        <Select
          value={filters.competitionId || "ALL"}
          onValueChange={(val) => onChange({ competitionId: val })}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Competitions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Competitions</SelectItem>
            {competitions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} {c.season ? `(${c.season})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Team Select */}
        <Select
          value={filters.team || "ALL"}
          onValueChange={(val) => onChange({ team: val })}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Teams" />
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

      {/* Secondary Row: Min Apps, Sort Metric, Order, Clear */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-2">
          {/* Min Appearances */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-muted-foreground text-[11px]">Min Apps:</span>
            <Select
              value={String(filters.minAppearances)}
              onValueChange={(val) => onChange({ minAppearances: Number(val) })}
            >
              <SelectTrigger className="h-8 w-24 text-xs font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All (0+)</SelectItem>
                <SelectItem value="1">1+ app</SelectItem>
                <SelectItem value="2">2+ apps</SelectItem>
                <SelectItem value="3">3+ apps</SelectItem>
                <SelectItem value="5">5+ apps</SelectItem>
                <SelectItem value="8">8+ apps</SelectItem>
                <SelectItem value="10">10+ apps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Metric */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-muted-foreground text-[11px]">Sort By:</span>
            <Select
              value={filters.sortBy}
              onValueChange={(val) => onChange({ sortBy: val })}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
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

          {/* Sort Order Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
              })
            }
            className="h-8 gap-1.5 text-xs font-mono"
            title={`Toggle order (currently ${filters.sortOrder.toUpperCase()})`}
          >
            {filters.sortOrder === "desc" ? (
              <>
                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                <span>DESC</span>
              </>
            ) : (
              <>
                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                <span>ASC</span>
              </>
            )}
          </Button>
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
}
