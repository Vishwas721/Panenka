"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/ui/avatar";
import { PositionBadge } from "@/components/players/player-card";
import type { AssistRankingEntry } from "@/server/services/stats.service";
import type { DrillDownTarget } from "./milestone-drilldown-dialog";
import { Sparkles, Compass, ChevronRight, AlertCircle, Sliders } from "lucide-react";

interface AssistsRankingCardProps {
  rankings: AssistRankingEntry[];
  minAppearances: number;
  onMinAppearancesChange: (min: number) => void;
  onSelectMilestone: (target: DrillDownTarget) => void;
}

export function AssistsRankingCard({
  rankings,
  minAppearances,
  onMinAppearancesChange,
  onSelectMilestone,
}: AssistsRankingCardProps) {
  const thresholdOptions = [1, 2, 3, 5, 8];

  return (
    <Card className="flex flex-col border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/10 text-sky-500 ring-1 ring-sky-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="font-display text-base tracking-tight flex items-center gap-1.5">
                Assists per Appearance
              </CardTitle>
              <CardDescription className="text-xs">
                Efficiency ranking filtered by minimum appearance threshold.
              </CardDescription>
            </div>
          </div>

          {/* Configurable threshold selector */}
          <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/30 p-1 self-start sm:self-auto">
            <span className="text-[10px] font-mono text-muted-foreground px-1.5 font-semibold">
              Min Apps:
            </span>
            {thresholdOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onMinAppearancesChange(opt)}
                className={`rounded px-1.5 py-0.5 text-[11px] font-mono font-bold transition-all ${
                  minAppearances === opt
                    ? "bg-sky-500 text-sky-950 shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {opt}+
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-1">
        {rankings.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
            <AlertCircle className="h-7 w-7 mb-1.5 text-amber-500/60" />
            <p className="font-semibold text-foreground">Insufficient data</p>
            <p className="mt-0.5">
              No players meet the minimum threshold of {minAppearances} completed appearances.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((entry, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={entry.player.id}
                  className="group flex items-center justify-between rounded-lg border border-border/60 bg-secondary/15 p-3 transition-colors hover:border-sky-500/40 hover:bg-secondary/35 cursor-pointer"
                  onClick={() =>
                    onSelectMilestone({
                      playerId: entry.player.id,
                      playerName: entry.player.fullName,
                      milestoneKey: "assists",
                      milestoneTitle: "All Assisting Matches",
                    })
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                        rank === 1
                          ? "bg-sky-500 text-sky-950 shadow-xs"
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
                      name={entry.player.fullName}
                      imageUrl={entry.player.imageUrl}
                      size="sm"
                      className="h-8 w-8 shrink-0 ring-1 ring-border"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-sm text-foreground truncate group-hover:text-sky-400 transition-colors">
                          {entry.player.fullName}
                        </span>
                        <PositionBadge position={entry.player.position} />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        {entry.player.team && <span>{entry.player.team}</span>}
                        <span>·</span>
                        <span>{entry.assists} assists in {entry.appearances} apps</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-2">
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold tabular-nums text-sky-400">
                        {entry.assistsPerAppearance.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        ast / app
                      </div>
                    </div>
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
