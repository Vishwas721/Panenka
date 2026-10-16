"use client";

import * as React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  getPlayerMilestoneMatchesAction,
} from "@/app/actions/stats";
import type {
  PlayerMilestoneData,
  MilestoneMatchDetail,
} from "@/server/services/stats.service";
import {
  Calendar,
  ExternalLink,
  Trophy,
  Target,
  Sparkles,
  Award,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";

export interface DrillDownTarget {
  playerId: string;
  playerName: string;
  milestoneKey: string;
  milestoneTitle?: string;
  competitionId?: string;
}

interface MilestoneDrilldownDialogProps {
  target: DrillDownTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MilestoneDrilldownDialog({
  target,
  open,
  onOpenChange,
}: MilestoneDrilldownDialogProps) {
  const [data, setData] = React.useState<PlayerMilestoneData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !target) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getPlayerMilestoneMatchesAction(
      target.playerId,
      target.milestoneKey,
      target.competitionId
    )
      .then((res) => {
        if (!isMounted) return;
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load milestone matches");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "Failed to load milestone matches");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, target]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl overflow-hidden p-0 max-h-[85vh] flex flex-col">
        {/* Header with Player and Milestone Title */}
        <div className="border-b border-border bg-card p-6 pb-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                Performance Drill-Down
              </span>
              {data && (
                <Badge variant="outline" className="font-mono text-xs">
                  {data.matches.length} Contributing{" "}
                  {data.matches.length === 1 ? "Match" : "Matches"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              {data?.player && (
                <PlayerAvatar
                  name={data.player.fullName}
                  imageUrl={data.player.imageUrl}
                  size="lg"
                  className="h-12 w-12 shrink-0 ring-1 ring-border"
                />
              )}
              <div className="space-y-0.5 min-w-0">
                <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground truncate">
                  {data?.player.fullName || target?.playerName || "Player Drill-Down"}
                  {data?.milestoneTitle && (
                    <span className="text-primary font-normal">
                      {" — "}
                      {data.milestoneTitle}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {data?.description ||
                    "Inspecting match records behind this statistical milestone."}
                </DialogDescription>
              </div>
            </div>

            {data?.player && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <PositionBadge position={data.player.position} />
                {data.player.team && (
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {data.player.team}
                  </Badge>
                )}
                {data.player.squadNumber !== null && (
                  <span className="font-mono text-xs text-muted-foreground">
                    #{data.player.squadNumber}
                  </span>
                )}
                <Link
                  href={`/players/${data.player.id}`}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                >
                  View Full Profile <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {isLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-mono">Loading milestone matches...</span>
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-center">
              <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-1.5" />
              <p className="text-sm font-semibold text-destructive">{error}</p>
            </div>
          ) : !data || data.matches.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No matching match appearances found for this milestone criteria.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/20">
                      <TableHead>Date</TableHead>
                      <TableHead>Opponent & Result</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Goals</TableHead>
                      <TableHead className="text-right">Assists</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.matches.map((m) => (
                      <TableRow key={m.id} className="hover:bg-secondary/30">
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {new Date(m.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-1.5">
                            <span>vs {m.opponent}</span>
                            {m.scoreHome !== null && m.scoreAway !== null && (
                              <span className="font-mono text-xs font-bold text-muted-foreground">
                                ({m.scoreHome} - {m.scoreAway})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.competition?.name || "Friendly"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {m.performance.appearanceStatus === "STARTED"
                              ? "Start"
                              : "Sub"}
                            {m.performance.minutesPlayed !== null &&
                              ` (${m.performance.minutesPlayed}')`}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold tabular-nums text-primary text-sm">
                          {m.performance.goals}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold tabular-nums text-sky-400 text-sm">
                          {m.performance.assists}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/matches/${m.id}`}
                            className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
