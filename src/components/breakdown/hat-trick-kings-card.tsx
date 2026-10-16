"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/ui/avatar";
import { PositionBadge } from "@/components/players/player-card";
import type { HatTrickKing } from "@/server/services/stats.service";
import type { DrillDownTarget } from "./milestone-drilldown-dialog";
import { Trophy, Crown, Flame, ChevronRight } from "lucide-react";

interface HatTrickKingsCardProps {
  kings: HatTrickKing[];
  onSelectMilestone: (target: DrillDownTarget) => void;
}

export function HatTrickKingsCard({
  kings,
  onSelectMilestone,
}: HatTrickKingsCardProps) {
  return (
    <Card className="flex flex-col border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="font-display text-base tracking-tight flex items-center gap-1.5">
                Hat-trick Kings
              </CardTitle>
              <CardDescription className="text-xs">
                Ranked by matches with exactly 3 goals.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[11px]">
            {kings.length} {kings.length === 1 ? "Player" : "Players"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-1">
        {kings.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
            <Trophy className="h-7 w-7 mb-1.5 opacity-30" />
            <p>No hat-tricks (3 goals) recorded in the database yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {kings.map((king, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={king.player.id}
                  className="group flex items-center justify-between rounded-lg border border-border/60 bg-secondary/15 p-3 transition-colors hover:border-primary/40 hover:bg-secondary/35 cursor-pointer"
                  onClick={() =>
                    onSelectMilestone({
                      playerId: king.player.id,
                      playerName: king.player.fullName,
                      milestoneKey: "hat_trick",
                      milestoneTitle: "Hat-tricks (3 Goals)",
                    })
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank indicator */}
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                        rank === 1
                          ? "bg-amber-500 text-amber-950 shadow-xs"
                          : rank === 2
                          ? "bg-slate-300 text-slate-900"
                          : rank === 3
                          ? "bg-amber-700/80 text-amber-100"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {rank}
                    </span>

                    <PlayerAvatar
                      name={king.player.fullName}
                      imageUrl={king.player.imageUrl}
                      size="sm"
                      className="h-8 w-8 shrink-0 ring-1 ring-border"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {king.player.fullName}
                        </span>
                        <PositionBadge position={king.player.position} />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        {king.player.team && <span>{king.player.team}</span>}
                        <span>·</span>
                        <span>{king.goals} goals in {king.appearances} apps</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <Badge
                      variant="goals"
                      className="font-mono text-xs font-bold px-2 py-0.5 shadow-2xs"
                    >
                      {king.hatTricks} {king.hatTricks === 1 ? "Hat-trick" : "Hat-tricks"}
                    </Badge>
                    {(king.fourGoalMatches > 0 || king.fiveOrMoreGoalMatches > 0) && (
                      <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                        (+{king.fourGoalMatches + king.fiveOrMoreGoalMatches} other 4+G)
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
