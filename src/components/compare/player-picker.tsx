"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PositionBadge } from "@/components/players/player-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlayerWithStats } from "@/server/services/player.service";
import { Users, X, Scale, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlayerPickerProps {
  allPlayers: PlayerWithStats[];
  selectedIds?: string[];
  selectedPlayerIds?: string[];
  onSelect?: (ids: string[]) => void;
}

const SLOT_THEMES = [
  {
    border: "border-emerald-500/40 bg-emerald-500/5",
    badge: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    label: "Player 1",
  },
  {
    border: "border-sky-500/40 bg-sky-500/5",
    badge: "bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30",
    label: "Player 2",
  },
  {
    border: "border-amber-500/40 bg-amber-500/5",
    badge: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    label: "Player 3",
  },
];

export function PlayerPicker({
  allPlayers,
  selectedIds,
  selectedPlayerIds,
  onSelect,
}: PlayerPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentIds = React.useMemo(
    () => selectedIds ?? selectedPlayerIds ?? [],
    [selectedIds, selectedPlayerIds],
  );

  const selectedPlayers = React.useMemo(() => {
    return currentIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is PlayerWithStats => Boolean(p));
  }, [allPlayers, currentIds]);

  const availablePlayers = React.useMemo(() => {
    const set = new Set(currentIds);
    return allPlayers.filter((p) => !set.has(p.id));
  }, [allPlayers, currentIds]);

  const updateSelected = (newIds: string[]) => {
    if (onSelect) {
      onSelect(newIds);
    }
    const params = new URLSearchParams(searchParams.toString());
    if (newIds.length === 0) {
      params.delete("ids");
    } else {
      params.set("ids", newIds.join(","));
    }
    router.push(`/compare?${params.toString()}`);
  };

  const handleAddPlayer = (playerId: string) => {
    if (currentIds.length >= 3) return;
    if (currentIds.includes(playerId)) return;
    updateSelected([...currentIds, playerId]);
  };

  const handleRemovePlayer = (playerId: string) => {
    updateSelected(currentIds.filter((id) => id !== playerId));
  };

  const handleClear = () => {
    updateSelected([]);
  };

  // Top suggestions: pick top 2 or 3 goal scorers for instant comparison
  const topPlayers = React.useMemo(() => {
    return [...allPlayers]
      .sort((a, b) => b.stats.goals - a.stats.goals)
      .slice(0, 3);
  }, [allPlayers]);

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Select Players to Compare
            </h3>
            <p className="text-xs text-muted-foreground">
              Choose 2 or 3 players for head-to-head metric benchmarking.
            </p>
          </div>
        </div>

        {currentIds.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto h-8"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear Selection
          </Button>
        )}
      </div>

      {/* Selected Players Slots (Up to 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((slotIndex) => {
          const player = selectedPlayers[slotIndex];
          const theme = SLOT_THEMES[slotIndex]!;

          if (player) {
            return (
              <div
                key={player.id}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl border p-3.5 shadow-2xs transition-all",
                  theme.border
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PlayerAvatar
                    name={player.fullName}
                    imageUrl={player.imageUrl}
                    size="md"
                    className="h-10 w-10 ring-1 ring-primary/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <Badge className={cn("text-[9px] font-mono px-1.5 py-0 uppercase", theme.badge)}>
                        {theme.label}
                      </Badge>
                      <span className="font-semibold text-xs text-foreground truncate">
                        {player.displayName || player.fullName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                      <PositionBadge position={player.position} />
                      {player.team && <span>{player.team}</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {player.stats.appearances} apps | {player.stats.goals}G | {player.stats.assists}A
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePlayer(player.id)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors ml-2 shrink-0"
                  title="Remove player"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          }

          // Empty slot: Player selector
          return (
            <div
              key={`empty-slot-${slotIndex}`}
              className="flex items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 min-h-[68px]"
            >
              <Select onValueChange={handleAddPlayer}>
                <SelectTrigger className="w-full text-xs h-9 bg-card">
                  <SelectValue placeholder={`+ Add Player ${slotIndex + 1}`} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availablePlayers.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <span className="font-semibold">{p.displayName || p.fullName}</span>{" "}
                      <span className="text-muted-foreground font-mono">
                        ({p.position}
                        {p.team ? ` · ${p.team}` : ""})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {/* Suggested Quick Matchups */}
      {currentIds.length < 2 && topPlayers.length >= 2 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
          <span className="text-muted-foreground font-mono text-[11px] flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" /> Quick Matchups:
          </span>
          <button
            type="button"
            onClick={() => updateSelected(topPlayers.slice(0, 2).map((p) => p.id))}
            className="rounded-md bg-secondary/70 hover:bg-secondary px-2.5 py-1 text-xs font-medium text-foreground transition-colors border border-border/60"
          >
            {topPlayers[0]?.fullName} vs {topPlayers[1]?.fullName}
          </button>
          {topPlayers.length >= 3 && (
            <button
              type="button"
              onClick={() => updateSelected(topPlayers.slice(0, 3).map((p) => p.id))}
              className="rounded-md bg-secondary/70 hover:bg-secondary px-2.5 py-1 text-xs font-medium text-foreground transition-colors border border-border/60"
            >
              Top 3 Scorers Trio
            </button>
          )}
        </div>
      )}
    </div>
  );
}
