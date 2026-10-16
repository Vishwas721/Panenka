"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/ui/avatar";
import { PositionBadge } from "@/components/players/player-card";
import type { BraceMaster } from "@/server/services/stats.service";
import type { DrillDownTarget } from "./milestone-drilldown-dialog";
import { Target, Flame, ChevronRight } from "lucide-react";

interface BraceMastersCardProps {
  masters: BraceMaster[];
  onSelectMilestone: (target: DrillDownTarget) => void;
}

export function BraceMastersCard({
  masters,
  onSelectMilestone,
}: BraceMastersCardProps) {
  return (
    <Card className="flex flex-col border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="font-display text-base tracking-tight flex items-center gap-1.5">
                Brace Masters
              </CardTitle>
              <CardDescription className="text-xs">
                Ranked by matches with exactly 2 goals.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[11px]">
            {masters.length} {masters.length === 1 ? "Player" : "Players"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-1">
        {masters.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
            <Target className="h-7 w-7 mb-1.5 opacity-30" />
            <p>No braces (2 goals) recorded in the database yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {masters.map((master, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={master.player.id}
                  className="group flex items-center justify-between rounded-lg border border-border/60 bg-secondary/15 p-3 transition-colors hover:border-orange-500/40 hover:bg-secondary/35 cursor-pointer"
                  onClick={() =>
                    onSelectMilestone({
                      playerId: master.player.id,
                      playerName: master.player.fullName,
                      milestoneKey: "brace",
                      milestoneTitle: "Braces (2 Goals)",
                    })
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                        rank === 1
                          ? "bg-orange-500 text-orange-950 shadow-xs"
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
                      name={master.player.fullName}
                      imageUrl={master.player.imageUrl}
                      size="sm"
                      className="h-8 w-8 shrink-0 ring-1 ring-border"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {master.player.fullName}
                        </span>
                        <PositionBadge position={master.player.position} />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        {master.player.team && <span>{master.player.team}</span>}
                        <span>·</span>
                        <span>{master.goals} goals in {master.appearances} apps</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <Badge
                      variant="warning"
                      className="font-mono text-xs font-bold px-2 py-0.5"
                    >
                      {master.braces} {master.braces === 1 ? "Brace" : "Braces"}
                    </Badge>
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
