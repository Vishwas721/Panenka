import * as React from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  Target,
  Compass,
  Activity,
  Award,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PositionBadge } from "@/components/players/player-card";
import type { DashboardSummary } from "@/server/services/stats.service";

export interface DashboardSummaryCardsProps {
  summary: DashboardSummary;
  minAppsThreshold?: number;
}

export function DashboardSummaryCards({
  summary,
  minAppsThreshold = 3,
}: DashboardSummaryCardsProps) {
  const {
    totalPlayers,
    totalMatches,
    totalGoals,
    totalAssists,
    totalContributions,
    bestGoalsPerAppearance,
  } = summary;

  return (
    <section aria-labelledby="summary-metrics-heading">
      <h2 id="summary-metrics-heading" className="sr-only">
        Summary Metrics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Registered Players */}
        <Card className="group relative overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
          <div className="h-1 w-full bg-border group-hover:bg-primary transition-colors" />
          <CardContent className="p-4 flex flex-col justify-between h-[calc(100%-4px)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
                Players
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-foreground">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="my-2">
              <div className="font-mono text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {totalPlayers.registered}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {totalPlayers.active} Active
                </span>
                {totalPlayers.archived > 0 && (
                  <>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="text-muted-foreground">
                      {totalPlayers.archived} Archived
                    </span>
                  </>
                )}
              </div>
            </div>

            <Link
              href="/players"
              className="mt-1 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors group/link"
            >
              Squad management
              <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </Link>
          </CardContent>
        </Card>

        {/* 2. Completed Matches */}
        <Card className="group relative overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
          <div className="h-1 w-full bg-border group-hover:bg-primary transition-colors" />
          <CardContent className="p-4 flex flex-col justify-between h-[calc(100%-4px)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
                Matches
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-foreground">
                <CalendarCheck className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="my-2">
              <div className="font-mono text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {totalMatches}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Completed fixtures
              </p>
            </div>

            <Link
              href="/matches"
              className="mt-1 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors group/link"
            >
              Match history
              <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </Link>
          </CardContent>
        </Card>

        {/* 3. Total Goals */}
        <Card className="group relative overflow-hidden transition-all duration-200 hover:border-goals/60 hover:shadow-sm">
          <div className="h-1 w-full bg-goals/40 group-hover:bg-goals transition-colors" />
          <CardContent className="p-4 flex flex-col justify-between h-[calc(100%-4px)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
                Goals
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-goals/15 text-goals">
                <Target className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="my-2">
              <div className="font-mono text-3xl font-bold tracking-tight text-goals tabular-nums">
                {totalGoals}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Total scored squad goals
              </p>
            </div>

            <Link
              href="/breakdown"
              className="mt-1 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-goals transition-colors group/link"
            >
              Goal breakdown
              <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </Link>
          </CardContent>
        </Card>

        {/* 4. Total Assists */}
        <Card className="group relative overflow-hidden transition-all duration-200 hover:border-assists/60 hover:shadow-sm">
          <div className="h-1 w-full bg-assists/40 group-hover:bg-assists transition-colors" />
          <CardContent className="p-4 flex flex-col justify-between h-[calc(100%-4px)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
                Assists
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-assists/15 text-assists">
                <Compass className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="my-2">
              <div className="font-mono text-3xl font-bold tracking-tight text-assists tabular-nums">
                {totalAssists}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Recorded goal assists
              </p>
            </div>

            <Link
              href="/breakdown"
              className="mt-1 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-assists transition-colors group/link"
            >
              Assist leaders
              <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </Link>
          </CardContent>
        </Card>

        {/* 5. Goal Contributions */}
        <Card className="group relative overflow-hidden transition-all duration-200 hover:border-contributions/60 hover:shadow-sm">
          <div className="h-1 w-full bg-contributions/40 group-hover:bg-contributions transition-colors" />
          <CardContent className="p-4 flex flex-col justify-between h-[calc(100%-4px)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
                G+A
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-contributions/15 text-contributions">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="my-2">
              <div className="font-mono text-3xl font-bold tracking-tight text-contributions tabular-nums">
                {totalContributions}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Goals + Assists combined
              </p>
            </div>

            <Link
              href="/breakdown"
              className="mt-1 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-contributions transition-colors group/link"
            >
              Full contribution table
              <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </Link>
          </CardContent>
        </Card>

        {/* 6. Best Goals-per-Appearance Rate */}
        <Card className="group relative overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
          <div className="h-1 w-full bg-primary/40 group-hover:bg-primary transition-colors" />
          <CardContent className="p-4 flex flex-col justify-between h-[calc(100%-4px)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
                Best Rate
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Award className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="my-2">
              {bestGoalsPerAppearance ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-bold tracking-tight text-primary tabular-nums">
                      {bestGoalsPerAppearance.rate.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      / match
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 truncate">
                    <PositionBadge position={bestGoalsPerAppearance.player.position} />
                    <Link
                      href={`/players/${bestGoalsPerAppearance.player.id}`}
                      className="truncate text-xs font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {bestGoalsPerAppearance.player.displayName ??
                        bestGoalsPerAppearance.player.fullName}
                    </Link>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums font-mono">
                    {bestGoalsPerAppearance.goals} goals in{" "}
                    {bestGoalsPerAppearance.appearances} apps
                  </div>
                </>
              ) : (
                <>
                  <div className="font-mono text-3xl font-bold tracking-tight text-muted-foreground tabular-nums">
                    —
                  </div>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Insufficient data
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">
                    Min {minAppsThreshold} appearances required
                  </p>
                </>
              )}
            </div>

            <div className="mt-1 flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                min {minAppsThreshold} apps
              </Badge>
              {bestGoalsPerAppearance && (
                <Link
                  href={`/players/${bestGoalsPerAppearance.player.id}`}
                  className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Profile
                  <ArrowUpRight className="ml-0.5 h-3 w-3" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
