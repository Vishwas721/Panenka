"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/avatar";
import { PositionBadge } from "@/components/players/player-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BreakdownTableRow } from "@/server/services/stats.service";
import type { DrillDownTarget } from "./milestone-drilldown-dialog";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
} from "lucide-react";

interface BreakdownTableProps {
  rows: BreakdownTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: string) => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onSelectMilestone: (target: DrillDownTarget) => void;
}

export function BreakdownTable({
  rows,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onSelectMilestone,
}: BreakdownTableProps) {
  // Sort header helper component
  const SortableHead = ({
    column,
    label,
    align = "left",
    className = "",
  }: {
    column: string;
    label: string;
    align?: "left" | "center" | "right";
    className?: string;
  }) => {
    const isCurrent = sortBy === column;
    return (
      <TableHead
        onClick={() => onSortChange(column)}
        className={`cursor-pointer select-none transition-colors hover:bg-secondary/40 ${
          align === "right"
            ? "text-right"
            : align === "center"
            ? "text-center"
            : "text-left"
        } ${className}`}
      >
        <div
          className={`inline-flex items-center gap-1 font-mono text-xs ${
            align === "right"
              ? "justify-end"
              : align === "center"
              ? "justify-center"
              : "justify-start"
          } ${isCurrent ? "font-bold text-foreground" : "text-muted-foreground"}`}
        >
          <span>{label}</span>
          {isCurrent ? (
            sortOrder === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : (
              <ArrowDown className="h-3 w-3 text-primary" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <div className="space-y-4">
      {/* Table Container with Sticky Column & Headers */}
      <div className="relative rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <Table className="border-collapse">
            <TableHeader className="bg-secondary/35 sticky top-0 z-20 backdrop-blur-xs">
              <TableRow className="border-b border-border">
                {/* Sticky Left: Rank & Player Column */}
                <TableHead className="w-12 text-center sticky left-0 z-30 bg-card border-r border-border/60">
                  <span className="font-mono text-xs">#</span>
                </TableHead>
                <TableHead
                  onClick={() => onSortChange("name")}
                  className="min-w-[200px] cursor-pointer sticky left-12 z-30 bg-card border-r border-border shadow-xs"
                >
                  <div className="inline-flex items-center gap-1 font-mono text-xs">
                    <span>Player</span>
                    {sortBy === "name" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </TableHead>

                {/* Core Stats */}
                <SortableHead column="appearances" label="Apps" align="right" />
                <SortableHead column="goals" label="Goals" align="right" />
                <SortableHead column="assists" label="Assists" align="right" />
                <SortableHead column="goalContributions" label="G+A" align="right" />

                {/* Rate Metrics */}
                <SortableHead column="goalsPerAppearance" label="Goals/App" align="right" />
                <SortableHead column="assistsPerAppearance" label="Ast/App" align="right" />
                <SortableHead column="contributionsPerAppearance" label="G+A/App" align="right" />

                {/* Goal Milestones Header */}
                <SortableHead column="singleGoalMatches" label="1 Goal" align="center" />
                <SortableHead column="braces" label="Brace (2)" align="center" />
                <SortableHead column="hatTricks" label="Hat-trick (3)" align="center" />
                <SortableHead column="fourGoalMatches" label="4 Goals" align="center" />
                <SortableHead column="fiveOrMoreGoalMatches" label="5+ Goals" align="center" />

                {/* Assist Milestones Header */}
                <SortableHead column="singleAssistMatches" label="1 Ast" align="center" />
                <SortableHead column="twoAssistMatches" label="2 Ast" align="center" />
                <SortableHead column="threeAssistMatches" label="3 Ast" align="center" />
                <SortableHead column="fourOrMoreAssistMatches" label="4+ Ast" align="center" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={17}
                    className="h-36 text-center text-sm text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 opacity-30" />
                      <span>No players found matching the current criteria.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => {
                  const rankNumber = (page - 1) * pageSize + idx + 1;
                  const { player, stats, goalBreakdown, assistBreakdown } = row;

                  return (
                    <TableRow
                      key={player.id}
                      className="group hover:bg-secondary/25 transition-colors border-b border-border/60"
                    >
                      {/* Sticky Rank # */}
                      <TableCell className="w-12 text-center font-mono text-xs tabular-nums text-muted-foreground sticky left-0 z-10 bg-card border-r border-border/60 group-hover:bg-card">
                        {rankNumber}
                      </TableCell>

                      {/* Sticky Player Info */}
                      <TableCell className="sticky left-12 z-10 bg-card border-r border-border shadow-xs group-hover:bg-card py-2.5">
                        <div className="flex items-center gap-2.5 min-w-[200px]">
                          <PlayerAvatar
                            name={player.fullName}
                            imageUrl={player.imageUrl}
                            size="sm"
                            className="h-7 w-7 ring-1 ring-border shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <Link
                                href={`/players/${player.id}`}
                                className="font-semibold text-xs text-foreground hover:text-primary transition-colors truncate"
                                title={player.fullName}
                              >
                                {player.fullName}
                              </Link>
                              <PositionBadge position={player.position} />
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono truncate">
                              {player.team && <span>{player.team}</span>}
                              {player.squadNumber !== null && (
                                <span>#{player.squadNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Appearances */}
                      <TableCell
                        onClick={() =>
                          onSelectMilestone({
                            playerId: player.id,
                            playerName: player.fullName,
                            milestoneKey: "appearances",
                            milestoneTitle: "All Match Appearances",
                          })
                        }
                        className="text-right font-mono text-xs tabular-nums text-foreground cursor-pointer hover:text-primary"
                        title="Click to view all match appearances"
                      >
                        {stats.appearances}
                      </TableCell>

                      {/* Goals */}
                      <TableCell
                        onClick={() =>
                          onSelectMilestone({
                            playerId: player.id,
                            playerName: player.fullName,
                            milestoneKey: "goals",
                            milestoneTitle: "All Goalscoring Matches",
                          })
                        }
                        className="text-right font-mono text-sm font-bold tabular-nums text-primary cursor-pointer hover:underline"
                        title="Click to view scoring matches"
                      >
                        {stats.goals}
                      </TableCell>

                      {/* Assists */}
                      <TableCell
                        onClick={() =>
                          onSelectMilestone({
                            playerId: player.id,
                            playerName: player.fullName,
                            milestoneKey: "assists",
                            milestoneTitle: "All Assisting Matches",
                          })
                        }
                        className="text-right font-mono text-sm font-bold tabular-nums text-sky-400 cursor-pointer hover:underline"
                        title="Click to view assisting matches"
                      >
                        {stats.assists}
                      </TableCell>

                      {/* G+A */}
                      <TableCell
                        onClick={() =>
                          onSelectMilestone({
                            playerId: player.id,
                            playerName: player.fullName,
                            milestoneKey: "contributions",
                            milestoneTitle: "All Contribution Matches (G+A)",
                          })
                        }
                        className="text-right font-mono text-sm font-bold tabular-nums text-purple-400 cursor-pointer hover:underline"
                        title="Click to view contribution matches"
                      >
                        {stats.goalContributions}
                      </TableCell>

                      {/* Goals / App */}
                      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {stats.goalsPerAppearance !== null
                          ? stats.goalsPerAppearance.toFixed(2)
                          : "—"}
                      </TableCell>

                      {/* Assists / App */}
                      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {stats.assistsPerAppearance !== null
                          ? stats.assistsPerAppearance.toFixed(2)
                          : "—"}
                      </TableCell>

                      {/* Contributions / App */}
                      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {stats.contributionsPerAppearance !== null
                          ? stats.contributionsPerAppearance.toFixed(2)
                          : "—"}
                      </TableCell>

                      {/* Milestone: Single Goal */}
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {goalBreakdown.singleGoalMatches > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectMilestone({
                                playerId: player.id,
                                playerName: player.fullName,
                                milestoneKey: "single_goal",
                                milestoneTitle: "Single-Goal Matches (1)",
                              })
                            }
                            className="inline-flex items-center justify-center rounded bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                            title={`Click to inspect ${goalBreakdown.singleGoalMatches} single-goal match(es)`}
                          >
                            {goalBreakdown.singleGoalMatches}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Milestone: Brace (2) */}
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {goalBreakdown.braces > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectMilestone({
                                playerId: player.id,
                                playerName: player.fullName,
                                milestoneKey: "brace",
                                milestoneTitle: "Braces (2 Goals)",
                              })
                            }
                            className="inline-flex items-center justify-center rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 text-xs font-bold hover:bg-orange-500/25 transition-colors cursor-pointer"
                            title={`Click to inspect ${goalBreakdown.braces} brace(s)`}
                          >
                            {goalBreakdown.braces}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Milestone: Hat-trick (3) */}
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {goalBreakdown.hatTricks > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectMilestone({
                                playerId: player.id,
                                playerName: player.fullName,
                                milestoneKey: "hat_trick",
                                milestoneTitle: "Hat-tricks (3 Goals)",
                              })
                            }
                            className="inline-flex items-center justify-center rounded bg-goals/25 text-goals border border-goals/40 px-2 py-0.5 text-xs font-bold hover:bg-goals/35 transition-colors cursor-pointer shadow-2xs"
                            title={`Click to inspect ${goalBreakdown.hatTricks} hat-trick(s)`}
                          >
                            {goalBreakdown.hatTricks}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Milestone: Four-Goal (4) */}
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {goalBreakdown.fourGoalMatches > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectMilestone({
                                playerId: player.id,
                                playerName: player.fullName,
                                milestoneKey: "four_goal",
                                milestoneTitle: "Four-Goal Performances (4)",
                              })
                            }
                            className="inline-flex items-center justify-center rounded bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2 py-0.5 text-xs font-bold hover:bg-purple-500/30 transition-colors cursor-pointer"
                            title={`Click to inspect ${goalBreakdown.fourGoalMatches} 4-goal match(es)`}
                          >
                            {goalBreakdown.fourGoalMatches}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Milestone: Five+ (5+) */}
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {goalBreakdown.fiveOrMoreGoalMatches > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectMilestone({
                                playerId: player.id,
                                playerName: player.fullName,
                                milestoneKey: "five_plus_goal",
                                milestoneTitle: "Five+ Goal Performances (5+)",
                              })
                            }
                            className="inline-flex items-center justify-center rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
                            title={`Click to inspect ${goalBreakdown.fiveOrMoreGoalMatches} 5+ goal match(es)`}
                          >
                            {goalBreakdown.fiveOrMoreGoalMatches}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Assist: 1 Assist */}
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {assistBreakdown.singleAssistMatches > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectMilestone({
                                playerId: player.id,
                                playerName: player.fullName,
                                milestoneKey: "single_assist",
                                milestoneTitle: "Single-Assist Matches (1)",
                              })
                            }
                            className="inline-flex items-center justify-center rounded bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-sky-500/20 hover:text-sky-400 transition-colors cursor-pointer"
                            title={`Click to inspect ${assistBreakdown.singleAssistMatches} 1-assist match(es)`}
                          >
                            {assistBreakdown.singleAssistMatches}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Assist: 2 Assists */}
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {assistBreakdown.twoAssistMatches > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectMilestone({
                                playerId: player.id,
                                playerName: player.fullName,
                                milestoneKey: "two_assist",
                                milestoneTitle: "Two-Assist Matches (2)",
                              })
                            }
                            className="inline-flex items-center justify-center rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2 py-0.5 text-xs font-bold hover:bg-sky-500/25 transition-colors cursor-pointer"
                            title={`Click to inspect ${assistBreakdown.twoAssistMatches} 2-assist match(es)`}
                          >
                            {assistBreakdown.twoAssistMatches}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Assist: 3 Assists */}
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {assistBreakdown.threeAssistMatches > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectMilestone({
                                playerId: player.id,
                                playerName: player.fullName,
                                milestoneKey: "three_assist",
                                milestoneTitle: "Three-Assist Matches (3)",
                              })
                            }
                            className="inline-flex items-center justify-center rounded bg-assists/25 text-assists border border-assists/40 px-2 py-0.5 text-xs font-bold hover:bg-assists/35 transition-colors cursor-pointer"
                            title={`Click to inspect ${assistBreakdown.threeAssistMatches} 3-assist match(es)`}
                          >
                            {assistBreakdown.threeAssistMatches}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Assist: 4+ Assists */}
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {assistBreakdown.fourOrMoreAssistMatches > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectMilestone({
                                playerId: player.id,
                                playerName: player.fullName,
                                milestoneKey: "four_plus_assist",
                                milestoneTitle: "Four+ Assist Matches (4+)",
                              })
                            }
                            className="inline-flex items-center justify-center rounded bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2 py-0.5 text-xs font-bold hover:bg-purple-500/30 transition-colors cursor-pointer"
                            title={`Click to inspect ${assistBreakdown.fourOrMoreAssistMatches} 4+ assist match(es)`}
                          >
                            {assistBreakdown.fourOrMoreAssistMatches}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, total)} of {total} players
          </span>
          <div className="flex items-center gap-1.5 ml-4">
            <span className="text-[11px] font-mono text-muted-foreground">Per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-7 w-16 text-xs font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <span className="text-xs font-mono text-muted-foreground px-1">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-8 gap-1 text-xs"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
