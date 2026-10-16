"use client";

import * as React from "react";
import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Flame, Sparkles, Trophy, ChevronRight, Filter } from "lucide-react";
import type {
  HatTrickKing,
  BraceMaster,
  AssistRankingEntry,
} from "@/server/services/stats.service";
import { formatRate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface MilestoneCardsProps {
  hatTrickKings: HatTrickKing[];
  braceMasters: BraceMaster[];
  assistsRanking: AssistRankingEntry[];
  minAppearances: number;
  onThresholdChange?: (minAppearances: number) => void;
  onSelectMilestone?: (playerId: string, milestoneKey: string) => void;
}

export function MilestoneCards({
  hatTrickKings,
  braceMasters,
  assistsRanking,
  minAppearances,
  onThresholdChange,
  onSelectMilestone,
}: MilestoneCardsProps) {
  // Sort Hat-trick Kings primarily by matches with exactly 3 goals (hatTricks)
  const sortedHatTrickKings = React.useMemo(() => {
    return [...hatTrickKings].sort((a, b) => {
      if (b.hatTricks !== a.hatTricks) return b.hatTricks - a.hatTricks;
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.appearances - b.appearances;
    });
  }, [hatTrickKings]);

  // Sort Brace Masters by matches with exactly 2 goals (braces)
  const sortedBraceMasters = React.useMemo(() => {
    return [...braceMasters].sort((a, b) => {
      if (b.braces !== a.braces) return b.braces - a.braces;
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.appearances - b.appearances;
    });
  }, [braceMasters]);

  const thresholdOptions = [1, 2, 3, 5, 10];

  const getRankBadgeClass = (index: number) => {
    if (index === 0) return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    if (index === 1) return "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30";
    if (index === 2) return "bg-amber-700/15 text-amber-700 dark:text-amber-600 border-amber-700/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 1. Hat-trick Kings */}
      <Card className="flex flex-col border-border/60 shadow-xs hover:border-amber-500/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-display tracking-tight flex items-center gap-1.5">
                  Hat-trick Kings
                </CardTitle>
                <CardDescription className="text-xs">
                  Matches with exactly 3 goals
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono border-amber-500/30 text-amber-600 dark:text-amber-400">
              3 Goals
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-1 flex-1 flex flex-col justify-between">
          {sortedHatTrickKings.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center text-sm">
              <Trophy className="h-8 w-8 stroke-1 text-muted-foreground/40 mb-2" />
              <p className="font-medium">No Hat-tricks Recorded</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                No player has scored 3 goals in a single match yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedHatTrickKings.slice(0, 5).map((king, index) => (
                <div
                  key={king.player.id}
                  onClick={() => onSelectMilestone?.(king.player.id, "hatTricks")}
                  className={cn(
                    "group flex items-center justify-between p-2 rounded-lg border border-border/40 hover:border-border hover:bg-muted/40 transition-all",
                    onSelectMilestone && "cursor-pointer"
                  )}
                  role="button"
                  tabIndex={0}
                  title="Click to view match drill-down"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-bold",
                        getRankBadgeClass(index)
                      )}
                    >
                      {index + 1}
                    </span>
                    <PlayerAvatar
                      name={king.player.fullName}
                      imageUrl={king.player.imageUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex flex-col">
                      <span className="truncate text-xs font-semibold group-hover:text-primary transition-colors">
                        {king.player.displayName || king.player.fullName}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {king.player.position} {king.player.team ? `• ${king.player.team}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <div className="text-right">
                      <div className="font-display font-bold text-sm text-foreground tabular-nums">
                        {king.hatTricks} <span className="text-[11px] font-normal text-muted-foreground">HT</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        {king.goals}G in {king.appearances} app{king.appearances === 1 ? "" : "s"}
                      </div>
                    </div>
                    {onSelectMilestone && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Brace Masters */}
      <Card className="flex flex-col border-border/60 shadow-xs hover:border-emerald-500/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-display tracking-tight flex items-center gap-1.5">
                  Brace Masters
                </CardTitle>
                <CardDescription className="text-xs">
                  Matches with exactly 2 goals
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              2 Goals
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-1 flex-1 flex flex-col justify-between">
          {sortedBraceMasters.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center text-sm">
              <Flame className="h-8 w-8 stroke-1 text-muted-foreground/40 mb-2" />
              <p className="font-medium">No Braces Recorded</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                No player has scored a brace (2 goals) in a single match yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedBraceMasters.slice(0, 5).map((brace, index) => (
                <div
                  key={brace.player.id}
                  onClick={() => onSelectMilestone?.(brace.player.id, "braces")}
                  className={cn(
                    "group flex items-center justify-between p-2 rounded-lg border border-border/40 hover:border-border hover:bg-muted/40 transition-all",
                    onSelectMilestone && "cursor-pointer"
                  )}
                  role="button"
                  tabIndex={0}
                  title="Click to view match drill-down"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-bold",
                        getRankBadgeClass(index)
                      )}
                    >
                      {index + 1}
                    </span>
                    <PlayerAvatar
                      name={brace.player.fullName}
                      imageUrl={brace.player.imageUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex flex-col">
                      <span className="truncate text-xs font-semibold group-hover:text-primary transition-colors">
                        {brace.player.displayName || brace.player.fullName}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {brace.player.position} {brace.player.team ? `• ${brace.player.team}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <div className="text-right">
                      <div className="font-display font-bold text-sm text-foreground tabular-nums">
                        {brace.braces} <span className="text-[11px] font-normal text-muted-foreground">Braces</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        {brace.goals}G in {brace.appearances} app{brace.appearances === 1 ? "" : "s"}
                      </div>
                    </div>
                    {onSelectMilestone && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Assists per Appearance */}
      <Card className="flex flex-col border-border/60 shadow-xs hover:border-sky-500/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-display tracking-tight flex items-center gap-1.5">
                  Assists / Appearance
                </CardTitle>
                <CardDescription className="text-xs">
                  Efficiency ranking (Min. {minAppearances} apps)
                </CardDescription>
              </div>
            </div>
            {onThresholdChange && (
              <div className="flex items-center gap-1 bg-muted/70 p-0.5 rounded-md border border-border/50">
                <span className="text-[10px] font-mono px-1 text-muted-foreground flex items-center gap-0.5">
                  <Filter className="h-2.5 w-2.5" />
                  Min:
                </span>
                {thresholdOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onThresholdChange(opt)}
                    className={cn(
                      "px-1.5 py-0.5 text-[10px] font-mono font-medium rounded transition-colors",
                      minAppearances === opt
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-1 flex-1 flex flex-col justify-between">
          {assistsRanking.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center text-sm">
              <Sparkles className="h-8 w-8 stroke-1 text-muted-foreground/40 mb-2" />
              <p className="font-medium">No Eligible Players</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                No players with ≥ {minAppearances} appearance{minAppearances === 1 ? "" : "s"} have recorded assists.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {assistsRanking.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.player.id}
                  onClick={() => onSelectMilestone?.(entry.player.id, "assists")}
                  className={cn(
                    "group flex items-center justify-between p-2 rounded-lg border border-border/40 hover:border-border hover:bg-muted/40 transition-all",
                    onSelectMilestone && "cursor-pointer"
                  )}
                  role="button"
                  tabIndex={0}
                  title="Click to view match drill-down"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-bold",
                        getRankBadgeClass(index)
                      )}
                    >
                      {index + 1}
                    </span>
                    <PlayerAvatar
                      name={entry.player.fullName}
                      imageUrl={entry.player.imageUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex flex-col">
                      <span className="truncate text-xs font-semibold group-hover:text-primary transition-colors">
                        {entry.player.displayName || entry.player.fullName}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {entry.player.position} {entry.player.team ? `• ${entry.player.team}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <div className="text-right">
                      <div className="font-display font-bold text-sm text-sky-600 dark:text-sky-400 tabular-nums">
                        {formatRate(entry.assistsPerAppearance)} <span className="text-[11px] font-normal text-muted-foreground">/app</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        {entry.assists}A in {entry.appearances} app{entry.appearances === 1 ? "" : "s"}
                      </div>
                    </div>
                    {onSelectMilestone && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
