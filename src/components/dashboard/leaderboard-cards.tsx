import * as React from "react";
import Link from "next/link";
import {
  Target,
  Compass,
  Sparkles,
  TrendingUp,
  Award,
  Crown,
  Info,
  ChevronRight,
  Clock,
  Shirt,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/ui/avatar";
import { PositionBadge } from "@/components/players/player-card";
import type { LeaderboardEntry } from "@/server/services/stats.service";

export interface LeaderboardCardsProps {
  leaderboard: {
    topScorer: LeaderboardEntry[];
    topAssister: LeaderboardEntry[];
    mostContributions: LeaderboardEntry[];
    bestContributionsPerAppearance: LeaderboardEntry[];
  };
  minAppsThreshold?: number;
}

interface LeaderboardColumnProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  entries: LeaderboardEntry[];
  metricLabel: string;
  isRateMetric?: boolean;
  accentClass: {
    badge: string;
    border: string;
    text: string;
    bg: string;
  };
  emptyMessage?: string;
}

/**
 * Returns a human-readable explanation of why playerA was ranked above playerB
 * according to Panenka's documented 4-step tiebreak order:
 * 1. Primary metric (descending)
 * 2. More appearances (descending)
 * 3. Fewer minutes played total, if known (ascending)
 * 4. Player full name (alphabetical, ascending)
 */
function getTiebreakExplanation(
  a: LeaderboardEntry,
  b: LeaderboardEntry,
  metricLabel: string
): string | null {
  if (a.value !== b.value) return null;

  if (a.appearances !== b.appearances) {
    return `Tied at ${a.value} ${metricLabel} · Separated by appearances (${a.appearances} vs ${b.appearances})`;
  }

  if (a.totalMinutes !== null && b.totalMinutes !== null && a.totalMinutes !== b.totalMinutes) {
    return `Tied at ${a.value} ${metricLabel} & ${a.appearances} apps · Separated by minutes played (${a.totalMinutes}m vs ${b.totalMinutes}m)`;
  }

  if (a.totalMinutes !== null && b.totalMinutes === null) {
    return `Tied at ${a.value} ${metricLabel} & ${a.appearances} apps · Separated by recorded minutes played`;
  }

  return `Tied at ${a.value} ${metricLabel} · Separated alphabetically`;
}

function LeaderboardCard({
  title,
  icon: Icon,
  entries,
  metricLabel,
  isRateMetric = false,
  accentClass,
  emptyMessage = "No player data recorded yet",
}: LeaderboardColumnProps) {
  const topPlayer = entries[0];
  const runnersUp = entries.slice(1, 5);
  const secondPlayer = entries[1];

  const tiebreakWithSecond =
    topPlayer && secondPlayer
      ? getTiebreakExplanation(topPlayer, secondPlayer, metricLabel)
      : null;

  const formatValue = (val: number) => {
    return isRateMetric ? val.toFixed(2) : val.toString();
  };

  return (
    <Card className="flex flex-col justify-between overflow-hidden border-border/70 transition-all hover:border-border hover:shadow-md">
      {/* Top Banner */}
      <div className={`h-1.5 w-full ${accentClass.bg}`} />

      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-md ${accentClass.badge} ${accentClass.text}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground font-display">
              {title}
            </CardTitle>
          </div>
          <Link
            href="/breakdown"
            className="text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
          >
            All
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <Award className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">{emptyMessage}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Stats will appear once eligible matches are logged.
            </p>
          </div>
        ) : (
          <div>
            {/* Top Leader Section */}
            {topPlayer && (
              <div className="rounded-lg border border-border/60 bg-secondary/25 p-3 relative">
                {/* Tiebreak indicator banner if top 2 are tied */}
                {tiebreakWithSecond && (
                  <div className="mb-2.5 flex items-center gap-1.5 rounded bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning border border-warning/20">
                    <Info className="h-3 w-3 shrink-0" />
                    <span className="truncate">{tiebreakWithSecond}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <PlayerAvatar
                        name={topPlayer.fullName}
                        imageUrl={topPlayer.imageUrl}
                        size="lg"
                      />
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 font-mono text-[10px] font-bold text-black shadow">
                        <Crown className="h-3 w-3 fill-current" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/players/${topPlayer.id}`}
                          className="truncate font-display text-sm font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {topPlayer.displayName ?? topPlayer.fullName}
                        </Link>
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <PositionBadge position={topPlayer.position} />
                        {topPlayer.team && (
                          <span className="truncate max-w-[100px] text-[11px] font-medium">
                            {topPlayer.team}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Primary Metric Display */}
                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono text-2xl font-black tabular-nums tracking-tight ${accentClass.text}`}
                    >
                      {formatValue(topPlayer.value)}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {metricLabel}
                    </div>
                  </div>
                </div>

                {/* Sub-metrics */}
                <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] font-mono text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Shirt className="h-3 w-3" />
                    <span className="tabular-nums font-semibold text-foreground">
                      {topPlayer.appearances}
                    </span>{" "}
                    apps
                  </span>
                  {topPlayer.totalMinutes !== null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="tabular-nums font-semibold text-foreground">
                        {topPlayer.totalMinutes.toLocaleString()}
                      </span>{" "}
                      mins
                    </span>
                  )}
                  {topPlayer.stats.goalContributions > 0 && !isRateMetric && (
                    <span className="text-muted-foreground">
                      <span className="text-goals">{topPlayer.stats.goals}G</span>{" "}
                      +{" "}
                      <span className="text-assists">
                        {topPlayer.stats.assists}A
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Runners-up List */}
            {runnersUp.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1">
                  <span>Challengers</span>
                  <span>{metricLabel}</span>
                </div>

                {runnersUp.map((runner, idx) => {
                  const rank = idx + 2;
                  const prevRunner = idx === 0 ? topPlayer : runnersUp[idx - 1];
                  const isTiedWithPrev = prevRunner && runner.value === prevRunner.value;

                  return (
                    <div
                      key={runner.id}
                      className="group flex items-center justify-between rounded-md p-1.5 text-xs hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">
                          {rank}
                        </span>

                        <PlayerAvatar
                          name={runner.fullName}
                          imageUrl={runner.imageUrl}
                          size="sm"
                          className="h-6 w-6"
                        />

                        <Link
                          href={`/players/${runner.id}`}
                          className="truncate font-medium text-foreground hover:text-primary transition-colors max-w-[110px]"
                        >
                          {runner.displayName ?? runner.fullName}
                        </Link>

                        <PositionBadge position={runner.position} />

                        {isTiedWithPrev && (
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1 font-mono text-warning border-warning/30"
                            title="Tied on primary metric with rank above"
                          >
                            Tied
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs tabular-nums text-right">
                        <span className="text-muted-foreground text-[11px]">
                          {runner.appearances}a
                        </span>
                        <span className={`font-bold ${accentClass.text}`}>
                          {formatValue(runner.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tiebreak Order Reference Footer */}
        <div className="mt-3 border-t border-border/50 pt-2 text-[10px] font-mono text-muted-foreground/75 flex items-center justify-between">
          <span>Tiebreak: Val ↓ · Apps ↓ · Mins ↑ · A-Z</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaderboardCards({
  leaderboard,
  minAppsThreshold = 3,
}: LeaderboardCardsProps) {
  const {
    topScorer,
    topAssister,
    mostContributions,
    bestContributionsPerAppearance,
  } = leaderboard;

  return (
    <section aria-labelledby="leaderboards-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2
            id="leaderboards-heading"
            className="text-base font-bold tracking-tight text-foreground font-display"
          >
            Leaderboard Highlights
          </h2>
          <p className="text-xs text-muted-foreground">
            Rankings determined by primary metric with automated 4-tier tiebreaker resolution.
          </p>
        </div>

        <Link
          href="/breakdown"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center"
        >
          View all player rankings
          <ChevronRight className="h-3 w-3 ml-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Top Goal Scorer */}
        <LeaderboardCard
          title="Top Goalscorer"
          icon={Target}
          entries={topScorer}
          metricLabel="Goals"
          accentClass={{
            badge: "bg-goals/15",
            border: "border-goals/40",
            text: "text-goals",
            bg: "bg-goals",
          }}
          emptyMessage="No goals recorded yet"
        />

        {/* 2. Top Assister */}
        <LeaderboardCard
          title="Top Playmaker"
          icon={Compass}
          entries={topAssister}
          metricLabel="Assists"
          accentClass={{
            badge: "bg-assists/15",
            border: "border-assists/40",
            text: "text-assists",
            bg: "bg-assists",
          }}
          emptyMessage="No assists recorded yet"
        />

        {/* 3. Most Goal Contributions */}
        <LeaderboardCard
          title="Goal Contributions"
          icon={Sparkles}
          entries={mostContributions}
          metricLabel="G+A"
          accentClass={{
            badge: "bg-contributions/15",
            border: "border-contributions/40",
            text: "text-contributions",
            bg: "bg-contributions",
          }}
          emptyMessage="No goal contributions yet"
        />

        {/* 4. Best Contributions Per Appearance */}
        <LeaderboardCard
          title="Contributions / Match"
          icon={TrendingUp}
          entries={bestContributionsPerAppearance}
          metricLabel="G+A / App"
          isRateMetric={true}
          accentClass={{
            badge: "bg-primary/15",
            border: "border-primary/40",
            text: "text-primary",
            bg: "bg-primary",
          }}
          emptyMessage={`Insufficient data (min ${minAppsThreshold} appearances required)`}
        />
      </div>
    </section>
  );
}
