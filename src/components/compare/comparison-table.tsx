"use client";

import * as React from "react";
import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Info,
  Crown,
  Trophy,
  Flame,
  Sparkles,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import type {
  ComparisonResult,
  PlayerComparisonData,
} from "@/server/services/stats.service";
import { formatRate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface ComparisonTableProps {
  comparisonResult: ComparisonResult;
}

const PLAYER_THEMES = [
  {
    border: "border-emerald-500/40",
    headerBg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    pill: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    leaderBadge: "bg-emerald-500 text-white dark:text-black",
  },
  {
    border: "border-sky-500/40",
    headerBg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    pill: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    leaderBadge: "bg-sky-500 text-white dark:text-black",
  },
  {
    border: "border-amber-500/40",
    headerBg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    pill: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    leaderBadge: "bg-amber-500 text-white dark:text-black",
  },
];

export function ComparisonTable({ comparisonResult }: ComparisonTableProps) {
  const { players, comparison } = comparisonResult;

  if (players.length < 2) {
    return null;
  }

  // Check appearance thresholds and disparities
  const minAppsThreshold = 3;
  const belowThresholdPlayers = players.filter(
    (p) => p.stats.appearances < minAppsThreshold
  );

  const appCounts = players.map((p) => p.stats.appearances);
  const maxApps = Math.max(...appCounts);
  const minApps = Math.min(...appCounts);
  const hasAppDisparity =
    maxApps - minApps >= 5 || (minApps > 0 && maxApps / minApps >= 2);

  // Helper to determine if player is the leader for a given metric
  const isLeader = (metricKey: keyof typeof comparison, playerId: string) => {
    return comparison[metricKey]?.maxPlayerId === playerId;
  };

  // Helper for minutes per goal / contribution
  const getMinutesPerStat = (minutes: number | null, stat: number) => {
    if (minutes === null || stat <= 0) return "—";
    return `${Math.round(minutes / stat)}m`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Warning Banners */}
      {(belowThresholdPlayers.length > 0 || hasAppDisparity) && (
        <div className="space-y-3">
          {belowThresholdPlayers.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  Small Sample Size Warning
                </p>
                <p className="leading-relaxed">
                  {belowThresholdPlayers.map((p, idx) => (
                    <React.Fragment key={p.player.id}>
                      <span className="font-semibold">
                        {p.player.displayName || p.player.fullName} ({p.stats.appearances} appearance{p.stats.appearances === 1 ? "" : "s"})
                      </span>
                      {idx < belowThresholdPlayers.length - 1 ? ", " : " "}
                    </React.Fragment>
                  ))}
                  has fewer than {minAppsThreshold} appearances. Per-appearance rate metrics (Goals/App, Assists/App) are subject to significant variance.
                </p>
              </div>
            </div>
          )}

          {hasAppDisparity && (
            <div className="flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sky-800 dark:text-sky-300 text-xs">
              <Info className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  Appearance Disparity Detected
                </p>
                <p className="leading-relaxed">
                  Selected players have a notable gap in total appearances ({maxApps} vs {minApps}). Direct comparisons of total goals or assists will inherently favor players with greater minutes; rely on per-appearance rate metrics to evaluate tactical efficiency.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Plain-Language Note on Total Output vs Per-Appearance Efficiency */}
      <div className="flex items-start gap-3.5 rounded-xl border border-border/80 bg-muted/30 p-4.5 text-xs text-muted-foreground shadow-xs">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Info className="h-4 w-4" />
        </div>
        <div className="space-y-1.5 leading-relaxed">
          <p className="font-bold font-display text-sm text-foreground">
            Understanding Total Output vs. Per-Appearance Efficiency
          </p>
          <p>
            <strong>Total Output (Volume)</strong> reflects cumulative season production (goals, assists, minutes), rewarding availability, stamina, and consistent starting roles. <strong>Per-Appearance Efficiency (Rate)</strong> normalizes performance across playing time, highlighting clinical match-by-match impact. High volume alongside high efficiency indicates an indispensable talisman; high efficiency across limited appearances signals a potent impact option.
          </p>
        </div>
      </div>

      {/* 3. Side-by-Side Detailed Comparison Table */}
      <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            {/* Table Header: Player Profiles */}
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/80">
                <TableHead className="w-[240px] font-bold text-foreground py-4 pl-4 text-sm font-display">
                  Metric / Dimension
                </TableHead>
                {players.map((p, idx) => {
                  const theme = PLAYER_THEMES[idx]!;
                  return (
                    <TableHead
                      key={p.player.id}
                      className={cn(
                        "py-4 px-4 text-center border-l border-border/60 transition-colors",
                        theme.headerBg
                      )}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <PlayerAvatar
                          name={p.player.fullName}
                          imageUrl={p.player.imageUrl}
                          size="lg"
                          className="border-2 border-background shadow-xs"
                        />
                        <div className="text-center">
                          <Link
                            href={`/players/${p.player.id}`}
                            className="font-display font-bold text-sm text-foreground hover:text-primary transition-colors block"
                          >
                            {p.player.displayName || p.player.fullName}
                          </Link>
                          <div className="flex items-center justify-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] font-mono py-0 px-1">
                              {p.player.position}
                            </Badge>
                            {p.player.squadNumber !== null && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                #{p.player.squadNumber}
                              </span>
                            )}
                          </div>
                          {p.player.team && (
                            <span className="text-[11px] text-muted-foreground block truncate max-w-[150px] mx-auto mt-0.5">
                              {p.player.team}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody className="text-xs">
              {/* SECTION: General Info */}
              <TableRow className="bg-muted/30 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-y border-border/60">
                <TableCell colSpan={players.length + 1} className="py-2 pl-4">
                  Player Profile &amp; Attributes
                </TableCell>
              </TableRow>

              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Preferred Foot</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-medium border-l border-border/50">
                    {p.player.preferredFoot}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Nationality</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center text-muted-foreground border-l border-border/50">
                    {p.player.nationality || "—"}
                  </TableCell>
                ))}
              </TableRow>

              {/* SECTION: Volume / Totals */}
              <TableRow className="bg-muted/30 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-y border-border/60">
                <TableCell colSpan={players.length + 1} className="py-2 pl-4">
                  Match Output (Volume)
                </TableCell>
              </TableRow>

              {/* Appearances */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Appearances</TableCell>
                {players.map((p) => {
                  const leader = isLeader("appearances", p.player.id);
                  return (
                    <TableCell
                      key={p.player.id}
                      className={cn(
                        "text-center font-mono text-sm font-bold border-l border-border/50 tabular-nums",
                        leader && "text-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{p.stats.appearances}</span>
                        {leader && <Crown className="h-3 w-3 text-primary inline" />}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Total Minutes */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Total Minutes</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono border-l border-border/50 tabular-nums">
                    {p.totalMinutes !== null ? `${p.totalMinutes}'` : "—"}
                  </TableCell>
                ))}
              </TableRow>

              {/* Total Goals */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Total Goals</TableCell>
                {players.map((p) => {
                  const leader = isLeader("goals", p.player.id);
                  return (
                    <TableCell
                      key={p.player.id}
                      className={cn(
                        "text-center font-mono text-sm font-bold text-goals border-l border-border/50 tabular-nums",
                        leader && "bg-goals/10"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{p.stats.goals}</span>
                        {leader && <Crown className="h-3.5 w-3.5 text-goals" />}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Total Assists */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Total Assists</TableCell>
                {players.map((p) => {
                  const leader = isLeader("assists", p.player.id);
                  return (
                    <TableCell
                      key={p.player.id}
                      className={cn(
                        "text-center font-mono text-sm font-bold text-assists border-l border-border/50 tabular-nums",
                        leader && "bg-assists/10"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{p.stats.assists}</span>
                        {leader && <Crown className="h-3.5 w-3.5 text-assists" />}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Goal Contributions */}
              <TableRow className="hover:bg-muted/30 bg-muted/15">
                <TableCell className="font-bold text-foreground pl-4">Goal Contributions (G+A)</TableCell>
                {players.map((p) => {
                  const leader = isLeader("contributions", p.player.id);
                  return (
                    <TableCell
                      key={p.player.id}
                      className={cn(
                        "text-center font-mono text-base font-black text-contributions border-l border-border/50 tabular-nums",
                        leader && "bg-contributions/15"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{p.stats.goalContributions}</span>
                        {leader && <Trophy className="h-4 w-4 text-contributions" />}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* SECTION: Rates / Efficiency */}
              <TableRow className="bg-muted/30 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-y border-border/60">
                <TableCell colSpan={players.length + 1} className="py-2 pl-4">
                  Per-Appearance Efficiency
                </TableCell>
              </TableRow>

              {/* Goals / App */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Goals per Appearance</TableCell>
                {players.map((p) => {
                  const leader = isLeader("goalsPerAppearance", p.player.id);
                  return (
                    <TableCell
                      key={p.player.id}
                      className={cn(
                        "text-center font-mono text-xs font-bold border-l border-border/50 tabular-nums",
                        leader && "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{formatRate(p.stats.goalsPerAppearance)}</span>
                        {leader && <Crown className="h-3 w-3 text-emerald-500" />}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Assists / App */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Assists per Appearance</TableCell>
                {players.map((p) => {
                  const leader = isLeader("assistsPerAppearance", p.player.id);
                  return (
                    <TableCell
                      key={p.player.id}
                      className={cn(
                        "text-center font-mono text-xs font-bold border-l border-border/50 tabular-nums",
                        leader && "text-sky-600 dark:text-sky-400 bg-sky-500/10"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{formatRate(p.stats.assistsPerAppearance)}</span>
                        {leader && <Crown className="h-3 w-3 text-sky-500" />}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Contributions / App */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Contributions / Appearance</TableCell>
                {players.map((p) => (
                  <TableCell
                    key={p.player.id}
                    className="text-center font-mono text-xs font-bold border-l border-border/50 tabular-nums"
                  >
                    {formatRate(p.stats.contributionsPerAppearance)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Minutes per Goal */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Minutes per Goal</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono text-xs border-l border-border/50 tabular-nums">
                    {getMinutesPerStat(p.totalMinutes, p.stats.goals)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Minutes per Contribution */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Minutes per Goal Contribution</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono text-xs border-l border-border/50 tabular-nums">
                    {getMinutesPerStat(p.totalMinutes, p.stats.goalContributions)}
                  </TableCell>
                ))}
              </TableRow>

              {/* SECTION: Scoring Breakdown */}
              <TableRow className="bg-muted/30 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-y border-border/60">
                <TableCell colSpan={players.length + 1} className="py-2 pl-4">
                  Multi-Goal Milestones
                </TableCell>
              </TableRow>

              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Single Goal Matches (1)</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono border-l border-border/50 tabular-nums">
                    {p.goalBreakdown.singleGoalMatches}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Braces (2 goals)</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono border-l border-border/50 tabular-nums font-bold">
                    {p.goalBreakdown.braces}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Hat-tricks (3 goals)</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono border-l border-border/50 tabular-nums font-bold text-amber-600 dark:text-amber-400">
                    {p.goalBreakdown.hatTricks}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">4+ Goal Matches</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono border-l border-border/50 tabular-nums font-bold">
                    {p.goalBreakdown.fourGoalMatches + p.goalBreakdown.fiveOrMoreGoalMatches}
                  </TableCell>
                ))}
              </TableRow>

              {/* SECTION: Recent Form (Last 5 appearances) */}
              <TableRow className="bg-muted/30 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-y border-border/60">
                <TableCell colSpan={players.length + 1} className="py-2 pl-4">
                  Recent Form (Last 5 Appearances)
                </TableCell>
              </TableRow>

              {/* Form Sequence Chips */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Match Form (Latest first)</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center border-l border-border/50 py-3">
                    {p.recentForm.performances.length === 0 ? (
                      <span className="text-muted-foreground text-xs">No recent apps</span>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {p.recentForm.performances.map((perf, i) => {
                          const total = perf.goals + perf.assists;
                          return (
                            <span
                              key={i}
                              className={cn(
                                "flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border",
                                total >= 3
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                  : total > 0
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : "bg-muted text-muted-foreground border-border/60"
                              )}
                              title={`${perf.goals}G, ${perf.assists}A (${perf.minutesPlayed ?? "?"}m)`}
                            >
                              {perf.goals > 0 && `⚽${perf.goals}`}
                              {perf.assists > 0 && `🎯${perf.assists}`}
                              {total === 0 && "—"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </TableCell>
                ))}
              </TableRow>

              {/* Recent Form Totals */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Goals in Last 5 Apps</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono font-bold border-l border-border/50 tabular-nums">
                    {p.recentForm.goals}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Assists in Last 5 Apps</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono font-bold border-l border-border/50 tabular-nums">
                    {p.recentForm.assists}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Total G+A in Last 5 Apps</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center font-mono font-black text-contributions border-l border-border/50 tabular-nums">
                    {p.recentForm.goalContributions}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium text-foreground pl-4">Form Sample Reliability</TableCell>
                {players.map((p) => (
                  <TableCell key={p.player.id} className="text-center border-l border-border/50">
                    <Badge
                      variant={p.recentForm.sufficient ? "outline" : "warning"}
                      className="text-[10px] font-mono"
                    >
                      {p.recentForm.sufficient
                        ? `${p.recentForm.sampleSize}/5 apps (Sufficient)`
                        : `${p.recentForm.sampleSize} apps (Limited)`}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
