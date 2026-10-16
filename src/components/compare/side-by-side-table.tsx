"use client";

import * as React from "react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PositionBadge } from "@/components/players/player-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ComparisonResult,
  PlayerComparisonData,
} from "@/server/services/stats.service";
import { Check, Trophy, ExternalLink, Award } from "lucide-react";

interface SideBySideTableProps {
  comparisonResult: ComparisonResult;
}

export function SideBySideTable({ comparisonResult }: SideBySideTableProps) {
  const { players, comparison } = comparisonResult;

  if (players.length < 2) return null;

  // Helper to determine row leader
  const getLeaderId = (
    getValue: (p: PlayerComparisonData) => number | null
  ): string | null => {
    let max: number | null = null;
    let leader: string | null = null;
    let isTie = false;

    for (const p of players) {
      const v = getValue(p);
      if (v === null || v === 0) continue;
      if (max === null || v > max) {
        max = v;
        leader = p.player.id;
        isTie = false;
      } else if (v === max) {
        isTie = true;
      }
    }

    return isTie ? null : leader;
  };

  const renderMetricRow = (
    label: string,
    getValue: (p: PlayerComparisonData) => number | null,
    format: (val: number | null) => string = (v) =>
      v !== null ? String(v) : "—",
    explicitLeaderId?: string | null,
    categoryStyle?: "goals" | "assists" | "contributions" | "default"
  ) => {
    const leaderId =
      explicitLeaderId !== undefined
        ? explicitLeaderId
        : getLeaderId(getValue);

    return (
      <TableRow className="border-b border-border/60 hover:bg-secondary/20">
        <TableCell className="font-mono text-xs font-semibold text-muted-foreground w-48">
          {label}
        </TableCell>
        {players.map((p) => {
          const val = getValue(p);
          const isLeader = leaderId && leaderId === p.player.id;

          let colorClass = "text-foreground";
          if (categoryStyle === "goals") colorClass = "text-primary";
          else if (categoryStyle === "assists") colorClass = "text-sky-400";
          else if (categoryStyle === "contributions") colorClass = "text-purple-400";

          return (
            <TableCell
              key={p.player.id}
              className={`text-center font-mono text-sm tabular-nums ${
                isLeader ? "bg-primary/5 font-bold" : ""
              }`}
            >
              <div className="inline-flex items-center justify-center gap-1.5">
                <span className={colorClass}>{format(val)}</span>
                {isLeader && (
                  <span
                    className="inline-flex items-center text-[10px] text-primary"
                    title="Category Leader"
                  >
                    ★
                  </span>
                )}
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  const SectionHeaderRow = ({ title }: { title: string }) => (
    <TableRow className="bg-secondary/40 border-y border-border">
      <TableCell
        colSpan={players.length + 1}
        className="py-2 px-4 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground"
      >
        {title}
      </TableCell>
    </TableRow>
  );

  return (
    <Card className="border-border bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-base">
              Side-by-Side Metric Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Direct metric-by-metric comparison with category leader indicators (★).
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-b border-border">
                <TableHead className="w-48 font-mono text-xs">Metric</TableHead>
                {players.map((p) => (
                  <TableHead
                    key={p.player.id}
                    className="text-center min-w-[180px] p-4"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <PlayerAvatar
                        name={p.player.fullName}
                        imageUrl={p.player.imageUrl}
                        size="md"
                        className="h-12 w-12 ring-2 ring-border"
                      />
                      <div className="text-center">
                        <Link
                          href={`/players/${p.player.id}`}
                          className="font-semibold text-sm text-foreground hover:text-primary transition-colors block"
                        >
                          {p.player.fullName}
                        </Link>
                        {p.player.displayName &&
                          p.player.displayName !== p.player.fullName && (
                            <span className="text-[11px] text-muted-foreground italic block">
                              &ldquo;{p.player.displayName}&rdquo;
                            </span>
                          )}
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          <PositionBadge position={p.player.position} />
                          {p.player.team && (
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {p.player.team}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Profile Details */}
              <SectionHeaderRow title="Player Background" />
              <TableRow className="border-b border-border/60">
                <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                  Squad Number
                </TableCell>
                {players.map((p) => (
                  <TableCell
                    key={p.player.id}
                    className="text-center font-mono text-xs"
                  >
                    {p.player.squadNumber !== null ? `#${p.player.squadNumber}` : "—"}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="border-b border-border/60">
                <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                  Preferred Foot
                </TableCell>
                {players.map((p) => (
                  <TableCell
                    key={p.player.id}
                    className="text-center font-mono text-xs capitalize"
                  >
                    {p.player.preferredFoot !== "UNKNOWN"
                      ? `${p.player.preferredFoot.toLowerCase()} foot`
                      : "—"}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="border-b border-border/60">
                <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                  Nationality
                </TableCell>
                {players.map((p) => (
                  <TableCell
                    key={p.player.id}
                    className="text-center font-mono text-xs"
                  >
                    {p.player.nationality || "—"}
                  </TableCell>
                ))}
              </TableRow>

              {/* Career Totals */}
              <SectionHeaderRow title="Cumulative Career Totals" />
              {renderMetricRow(
                "Appearances",
                (p) => p.stats.appearances,
                (v) => (v !== null ? `${v} apps` : "—"),
                comparison.appearances.maxPlayerId
              )}
              {renderMetricRow(
                "Total Minutes",
                (p) => p.totalMinutes,
                (v) => (v !== null ? `${v}'` : "—")
              )}
              {renderMetricRow(
                "Goals",
                (p) => p.stats.goals,
                undefined,
                comparison.goals.maxPlayerId,
                "goals"
              )}
              {renderMetricRow(
                "Assists",
                (p) => p.stats.assists,
                undefined,
                comparison.assists.maxPlayerId,
                "assists"
              )}
              {renderMetricRow(
                "Goal Contributions (G+A)",
                (p) => p.stats.goalContributions,
                undefined,
                comparison.contributions.maxPlayerId,
                "contributions"
              )}

              {/* Per-Appearance Efficiency Rates */}
              <SectionHeaderRow title="Per-Appearance Rates" />
              {renderMetricRow(
                "Goals / Appearance",
                (p) => p.stats.goalsPerAppearance,
                (v) => (v !== null ? `${v.toFixed(2)} / app` : "—"),
                comparison.goalsPerAppearance.maxPlayerId,
                "goals"
              )}
              {renderMetricRow(
                "Assists / Appearance",
                (p) => p.stats.assistsPerAppearance,
                (v) => (v !== null ? `${v.toFixed(2)} / app` : "—"),
                comparison.assistsPerAppearance.maxPlayerId,
                "assists"
              )}
              {renderMetricRow(
                "Contributions / Appearance",
                (p) => p.stats.contributionsPerAppearance,
                (v) => (v !== null ? `${v.toFixed(2)} / app` : "—"),
                undefined,
                "contributions"
              )}

              {/* Goal Breakdown Milestones */}
              <SectionHeaderRow title="Goal Milestones Breakdown" />
              {renderMetricRow(
                "Single-Goal Matches (1)",
                (p) => p.goalBreakdown.singleGoalMatches
              )}
              {renderMetricRow(
                "Braces (2)",
                (p) => p.goalBreakdown.braces,
                undefined,
                undefined,
                "goals"
              )}
              {renderMetricRow(
                "Hat-tricks (3)",
                (p) => p.goalBreakdown.hatTricks,
                undefined,
                undefined,
                "goals"
              )}
              {renderMetricRow(
                "Four-Goal Matches (4)",
                (p) => p.goalBreakdown.fourGoalMatches,
                undefined,
                undefined,
                "goals"
              )}
              {renderMetricRow(
                "Five+ Goal Matches (5+)",
                (p) => p.goalBreakdown.fiveOrMoreGoalMatches,
                undefined,
                undefined,
                "goals"
              )}

              {/* Assist Breakdown Milestones */}
              <SectionHeaderRow title="Assist Milestones Breakdown" />
              {renderMetricRow(
                "Single-Assist Matches (1)",
                (p) => p.assistBreakdown.singleAssistMatches
              )}
              {renderMetricRow(
                "Two-Assist Matches (2)",
                (p) => p.assistBreakdown.twoAssistMatches,
                undefined,
                undefined,
                "assists"
              )}
              {renderMetricRow(
                "Three-Assist Matches (3)",
                (p) => p.assistBreakdown.threeAssistMatches,
                undefined,
                undefined,
                "assists"
              )}
              {renderMetricRow(
                "Four+ Assist Matches (4+)",
                (p) => p.assistBreakdown.fourOrMoreAssistMatches,
                undefined,
                undefined,
                "assists"
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
