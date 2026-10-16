import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  UserPlus,
  PlusCircle,
  Trophy,
  Users,
  ChevronRight,
  ExternalLink,
  Target,
  Compass,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/avatar";
import { PositionBadge } from "@/components/players/player-card";
import type { DashboardSummary } from "@/server/services/stats.service";
import type { MatchVenue } from "@prisma/client";

export interface RecentActivityProps {
  recentMatches: DashboardSummary["recentActivity"]["recentMatches"];
  recentPlayers: DashboardSummary["recentActivity"]["recentPlayers"];
}

function VenueBadge({ venue }: { venue: MatchVenue | null }) {
  if (!venue) return null;
  const labels: Record<MatchVenue, { text: string; class: string }> = {
    HOME: { text: "H", class: "bg-primary/10 text-primary border-primary/20" },
    AWAY: { text: "A", class: "bg-secondary text-muted-foreground border-border" },
    NEUTRAL: { text: "N", class: "bg-secondary text-muted-foreground border-border" },
  };

  const config = labels[venue];
  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${config.class}`}
      title={`Venue: ${venue}`}
    >
      {config.text}
    </span>
  );
}

export function RecentActivity({
  recentMatches,
  recentPlayers,
}: RecentActivityProps) {
  return (
    <section aria-labelledby="activity-quick-actions-heading" className="space-y-4">
      {/* Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-xs">
        <div>
          <h2
            id="activity-quick-actions-heading"
            className="text-sm font-bold tracking-tight text-foreground font-display"
          >
            Tactical Operations & Quick Actions
          </h2>
          <p className="text-xs text-muted-foreground">
            Direct shortcuts to register players, log match performances, and analyze tactical breakdowns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="default" className="text-xs font-semibold">
            <Link href="/matches/new">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Log Match
            </Link>
          </Button>

          <Button asChild size="sm" variant="secondary" className="text-xs font-semibold">
            <Link href="/players">
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Add Player
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
            <Link href="/breakdown">
              <Trophy className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Complete Breakdown
            </Link>
          </Button>
        </div>
      </div>

      {/* Two Column Grid: Recent Matches & Recently Added Players */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Recent Match Performances */}
        <Card className="border-border/70 overflow-hidden shadow-xs">
          <CardHeader className="p-4 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-foreground">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground font-display">
                  Recent Match Results
                </CardTitle>
              </div>

              <Link
                href="/matches"
                className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
              >
                View all fixtures
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-3">
            {recentMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <CalendarDays className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">No matches recorded yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Log your first fixture to start tracking squad statistics.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4 text-xs">
                  <Link href="/matches/new">Log a Match</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentMatches.map((match) => {
                  const matchDate = new Date(match.date);
                  const formattedDate = matchDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  // Calculate outcome if scores exist
                  let outcomeBadge = null;
                  if (
                    match.status === "COMPLETED" &&
                    match.scoreHome !== null &&
                    match.scoreAway !== null
                  ) {
                    if (match.scoreHome > match.scoreAway) {
                      outcomeBadge = (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-success/15 text-success border border-success/30">
                          W
                        </span>
                      );
                    } else if (match.scoreHome < match.scoreAway) {
                      outcomeBadge = (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-destructive/15 text-destructive border border-destructive/30">
                          L
                        </span>
                      );
                    } else {
                      outcomeBadge = (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-secondary text-secondary-foreground border border-border">
                          D
                        </span>
                      );
                    }
                  } else if (match.status === "SCHEDULED") {
                    outcomeBadge = (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-secondary text-muted-foreground border border-border">
                        SCHED
                      </span>
                    );
                  }

                  // Scorers & playmakers highlight
                  const scorers = match.performances?.filter((p) => p.goals > 0) || [];
                  const assisters =
                    match.performances?.filter((p) => p.assists > 0 && p.goals === 0) || [];

                  return (
                    <div
                      key={match.id}
                      className="group flex flex-col gap-1.5 rounded-lg border border-border/50 bg-secondary/15 p-2.5 transition-colors hover:border-border hover:bg-secondary/30"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        {/* Match Title & Opponent */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {outcomeBadge}
                          <VenueBadge venue={match.venue} />
                          <span className="font-semibold text-foreground truncate">
                            {match.team || "FC Panenka"} vs {match.opponent}
                          </span>
                        </div>

                        {/* Scoreline */}
                        <div className="flex items-center gap-2 shrink-0">
                          {match.scoreHome !== null && match.scoreAway !== null ? (
                            <span className="font-mono text-xs font-bold tabular-nums text-foreground bg-secondary px-2 py-0.5 rounded">
                              {match.scoreHome} - {match.scoreAway}
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {match.status}
                            </span>
                          )}

                          <Link
                            href={`/matches/${match.id}/edit`}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Edit match performance details"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>

                      {/* Meta Information: Date & Competition */}
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-muted-foreground">
                        <span>{formattedDate}</span>
                        {match.competition && (
                          <span className="truncate max-w-[180px] text-muted-foreground/80">
                            {match.competition.name}
                            {match.competition.season && ` (${match.competition.season})`}
                          </span>
                        )}
                      </div>

                      {/* Performer Highlights if any */}
                      {(scorers.length > 0 || assisters.length > 0) && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-border/40 pt-1.5 text-[11px]">
                          {scorers.length > 0 && (
                            <div className="flex items-center gap-1 text-goals font-mono">
                              <Target className="h-3 w-3" />
                              <span className="truncate max-w-[280px]">
                                {scorers
                                  .map(
                                    (p) =>
                                      `${p.player.displayName ?? p.player.fullName}${
                                        p.goals > 1 ? ` (${p.goals})` : ""
                                      }`
                                  )
                                  .join(", ")}
                              </span>
                            </div>
                          )}

                          {assisters.length > 0 && (
                            <div className="flex items-center gap-1 text-assists font-mono">
                              <Compass className="h-3 w-3" />
                              <span className="truncate max-w-[280px]">
                                {assisters
                                  .map(
                                    (p) =>
                                      `${p.player.displayName ?? p.player.fullName}${
                                        p.assists > 1 ? ` (${p.assists})` : ""
                                      }`
                                  )
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Recently Registered Players */}
        <Card className="border-border/70 overflow-hidden shadow-xs">
          <CardHeader className="p-4 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-foreground">
                  <Users className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground font-display">
                  Recently Registered Players
                </CardTitle>
              </div>

              <Link
                href="/players"
                className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
              >
                View squad
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-3">
            {recentPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">No players registered yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Add players to start building your squad roster.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4 text-xs">
                  <Link href="/players">Register a Player</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPlayers.map((player) => {
                  const createdDate = new Date(player.createdAt);
                  const formattedDate = createdDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={player.id}
                      className="group flex items-center justify-between rounded-lg border border-border/50 bg-secondary/15 p-2.5 transition-colors hover:border-border hover:bg-secondary/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <PlayerAvatar
                          name={player.fullName}
                          imageUrl={player.imageUrl}
                          size="md"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/players/${player.id}`}
                              className="truncate text-xs font-bold text-foreground hover:text-primary transition-colors"
                            >
                              {player.fullName}
                            </Link>
                            {player.displayName && player.displayName !== player.fullName && (
                              <span className="truncate text-[11px] text-muted-foreground">
                                ({player.displayName})
                              </span>
                            )}
                          </div>

                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <PositionBadge position={player.position} />
                            {player.team && (
                              <span className="truncate max-w-[120px] text-[11px] font-medium">
                                {player.team}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-mono text-muted-foreground">
                          Added {formattedDate}
                        </div>
                        <Link
                          href={`/players/${player.id}`}
                          className="mt-1 inline-flex items-center text-[11px] font-medium text-primary hover:underline"
                        >
                          Profile
                          <ArrowUpRight className="ml-0.5 h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
