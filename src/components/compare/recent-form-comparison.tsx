"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/ui/avatar";
import { PositionBadge } from "@/components/players/player-card";
import type { PlayerComparisonData } from "@/server/services/stats.service";
import { Flame, AlertCircle, TrendingUp } from "lucide-react";

interface RecentFormComparisonProps {
  players: PlayerComparisonData[];
}

export function RecentFormComparison({ players }: RecentFormComparisonProps) {
  if (players.length < 2) return null;

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="font-display text-base tracking-tight">
                Recent Form Comparison
              </CardTitle>
              <CardDescription className="text-xs">
                Trajectory and output across the last 5 competitive appearances.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            Max 5 Fixtures
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-${players.length}`}>
          {players.map((p) => {
            const { player, stats, recentForm } = p;
            const isSufficient = recentForm.sufficient;

            return (
              <div
                key={player.id}
                className="flex flex-col justify-between rounded-lg border border-border/70 bg-secondary/15 p-4 space-y-3"
              >
                {/* Player identity */}
                <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                  <PlayerAvatar
                    name={player.fullName}
                    imageUrl={player.imageUrl}
                    size="sm"
                    className="h-8 w-8 ring-1 ring-border"
                  />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate">
                      {player.fullName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <PositionBadge position={player.position} />
                      {player.team && <span>· {player.team}</span>}
                    </div>
                  </div>
                </div>

                {/* Form state */}
                {!isSufficient ? (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                    <AlertCircle className="h-5 w-5 text-amber-500 mb-1" />
                    <span className="font-mono font-bold text-xs text-amber-500">
                      Insufficient data
                    </span>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Requires at least 3 appearances to calculate form trend.
                    </p>
                    <p className="mt-1 text-[10px] font-mono text-muted-foreground">
                      Current sample: {recentForm.sampleSize} of 3
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Sample Size:</span>
                      <span className="font-semibold text-foreground">
                        Last {recentForm.sampleSize} appearances
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="rounded bg-secondary/40 p-2">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                          Goals
                        </span>
                        <span className="font-mono text-xl font-bold text-primary tabular-nums">
                          {recentForm.goals}
                        </span>
                      </div>

                      <div className="rounded bg-secondary/40 p-2">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                          Assists
                        </span>
                        <span className="font-mono text-xl font-bold text-sky-400 tabular-nums">
                          {recentForm.assists}
                        </span>
                      </div>

                      <div className="rounded bg-secondary/40 p-2">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                          G+A
                        </span>
                        <span className="font-mono text-xl font-bold text-purple-400 tabular-nums">
                          {recentForm.goalContributions}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                      <span>Rate in spell:</span>
                      <span className="font-bold text-foreground tabular-nums">
                        {(recentForm.goalContributions / recentForm.sampleSize).toFixed(2)} G+A / match
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
