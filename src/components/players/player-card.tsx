"use client";

import * as React from "react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PlayerWithStats } from "@/server/services/player.service";
import {
  MoreVertical,
  Edit,
  Eye,
  Archive,
  RotateCcw,
  Trash2,
  ShieldAlert,
  Globe,
  Footprints,
} from "lucide-react";

export function PositionBadge({ position }: { position: string }) {
  let color = "bg-secondary text-secondary-foreground border-border";
  if (position === "GK") {
    color = "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30";
  } else if (["CB", "LB", "RB"].includes(position)) {
    color = "bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/30";
  } else if (["CDM", "CM", "CAM"].includes(position)) {
    color = "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30";
  } else if (["LW", "RW", "ST"].includes(position)) {
    color = "bg-primary/20 text-primary border-primary/30";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${color}`}
    >
      {position}
    </span>
  );
}

export interface PlayerCardProps {
  player: PlayerWithStats;
  onEdit?: (player: PlayerWithStats) => void;
  onView?: (player: PlayerWithStats) => void;
  onArchive?: (player: PlayerWithStats) => void;
  onRestore?: (player: PlayerWithStats) => void;
  onDelete?: (player: PlayerWithStats) => void;
}

export function PlayerCard({
  player,
  onEdit,
  onView,
  onArchive,
  onRestore,
  onDelete,
}: PlayerCardProps) {
  const isArchived = Boolean(player.archivedAt);
  const { stats } = player;

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md">
      {/* Top Banner Accent */}
      <div
        className={`h-1.5 w-full ${
          isArchived ? "bg-muted-foreground/30" : "bg-primary"
        }`}
      />

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar & Identifiers */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <PlayerAvatar
                name={player.fullName}
                imageUrl={player.imageUrl}
                size="lg"
              />
              {player.squadNumber !== null && player.squadNumber !== undefined && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground shadow">
                  {player.squadNumber}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/players/${player.id}`}
                  className="truncate font-display text-base font-bold text-foreground transition-colors hover:text-primary"
                >
                  {player.fullName}
                </Link>
                {player.displayName &&
                  player.displayName !== player.fullName && (
                    <span className="truncate text-xs text-muted-foreground">
                      ({player.displayName})
                    </span>
                  )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <PositionBadge position={player.position} />
                {player.team && (
                  <span className="truncate max-w-[130px] font-medium text-foreground/80">
                    {player.team}
                  </span>
                )}
                {isArchived && (
                  <Badge variant="secondary" className="text-[10px]">
                    Archived
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onView?.(player)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit?.(player)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isArchived ? (
                <DropdownMenuItem
                  onClick={() => onRestore?.(player)}
                  className="cursor-pointer text-emerald-500 focus:text-emerald-500"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore to Squad
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => onArchive?.(player)}
                  className="cursor-pointer text-amber-500 focus:text-amber-500"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Player
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete?.(player)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Player Meta Info */}
        {(player.nationality || player.preferredFoot !== "UNKNOWN") && (
          <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
            {player.nationality && (
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {player.nationality}
              </span>
            )}
            {player.preferredFoot !== "UNKNOWN" && (
              <span className="inline-flex items-center gap-1">
                <Footprints className="h-3 w-3" />
                {player.preferredFoot.toLowerCase()} foot
              </span>
            )}
          </div>
        )}

        {/* Key Statistics Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg bg-secondary/30 p-2.5 text-center">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Apps
            </div>
            <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-foreground">
              {stats.appearances}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Goals
            </div>
            <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-primary">
              {stats.goals}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Assists
            </div>
            <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-sky-400">
              {stats.assists}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              G+A
            </div>
            <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-purple-400">
              {stats.goalContributions}
            </div>
          </div>
        </div>

        {/* View Details Link */}
        <div className="mt-4 flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onView?.(player)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
