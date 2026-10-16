"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlayerFormDialog } from "@/components/players/player-form-dialog";
import { PositionBadge } from "@/components/players/player-card";
import {
  archivePlayerAction,
  restorePlayerAction,
  deletePlayerAction,
} from "@/app/actions/players";
import type { PlayerDetail, PlayerMatchDetail } from "@/server/services/player.service";
import { didAppear } from "@/lib/validation";
import {
  ArrowLeft,
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  Calendar,
  Globe,
  Footprints,
  Shield,
  Clock,
  Flame,
  Award,
  Trophy,
  Target,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface PlayerProfileViewProps {
  player: PlayerDetail;
}

export function PlayerProfileView({ player }: PlayerProfileViewProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Match history pagination & filter
  const [matchSearch, setMatchSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 8;

  // Mounted guard for client-only Recharts rendering
  const [isChartMounted, setIsChartMounted] = React.useState(false);
  React.useEffect(() => {
    setIsChartMounted(true);
  }, []);

  const isArchived = Boolean(player.archivedAt);
  const { stats, goalBreakdown, assistBreakdown, recentForm, matches } = player;

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await archivePlayerAction(player.id);
      setIsArchiving(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await restorePlayerAction(player.id);
      setIsRestoring(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await deletePlayerAction(player.id);
      if (res.success) {
        setIsDeleting(false);
        router.push("/players");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter completed appearances for the chart chronologically (oldest to newest)
  const chartAppearances = React.useMemo(() => {
    return matches
      .filter((m) => m.match.status === "COMPLETED" && didAppear(m.appearanceStatus))
      .slice()
      .reverse() // from oldest to newest for left-to-right progression
      .map((m, index) => {
        const d = new Date(m.match.date);
        const dateStr = d.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        });
        return {
          matchIndex: index + 1,
          label: `M${index + 1} (${m.match.opponent.slice(0, 8)})`,
          date: dateStr,
          opponent: m.match.opponent,
          competition: m.match.competition?.name || "Friendly",
          goals: m.goals,
          assists: m.assists,
          contributions: m.goals + m.assists,
          minutes: m.minutesPlayed,
        };
      });
  }, [matches]);

  // Milestone matches: performances with multi-goal matches (braces, hat-tricks, 4-goal, 5+)
  const milestonePerformances = React.useMemo(() => {
    return matches
      .filter(
        (m) =>
          m.match.status === "COMPLETED" &&
          didAppear(m.appearanceStatus) &&
          m.goals >= 2
      )
      .map((m) => {
        let milestoneType = "Brace (2G)";
        let badgeVariant: "warning" | "goals" | "primary" = "goals";
        if (m.goals === 2) {
          milestoneType = "Brace (2 Goals)";
          badgeVariant = "warning";
        } else if (m.goals === 3) {
          milestoneType = "Hat-trick (3 Goals)";
          badgeVariant = "goals";
        } else if (m.goals === 4) {
          milestoneType = "4-Goal Performance";
          badgeVariant = "goals";
        } else if (m.goals >= 5) {
          milestoneType = `${m.goals}-Goal Masterclass`;
          badgeVariant = "goals";
        }
        return {
          ...m,
          milestoneType,
          badgeVariant,
        };
      });
  }, [matches]);

  // Filtered and paginated match history
  const filteredMatches = React.useMemo(() => {
    const q = matchSearch.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter(
      (m) =>
        m.match.opponent.toLowerCase().includes(q) ||
        (m.match.competition?.name &&
          m.match.competition.name.toLowerCase().includes(q)) ||
        (m.match.team && m.match.team.toLowerCase().includes(q))
    );
  }, [matches, matchSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / pageSize));
  const paginatedMatches = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMatches.slice(start, start + pageSize);
  }, [filteredMatches, currentPage, pageSize]);

  return (
    <div className="space-y-8 pb-12">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/players"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Squad List
        </Link>
      </div>

      {/* Header Profile Card */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <div
          className={`h-2.5 w-full ${
            isArchived ? "bg-muted-foreground/30" : "bg-primary"
          }`}
        />
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Identity & Basic Info */}
            <div className="flex items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                <PlayerAvatar
                  name={player.fullName}
                  imageUrl={player.imageUrl}
                  size="xl"
                  className="h-20 w-20 ring-2 ring-border"
                />
                {player.squadNumber !== null && (
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground shadow-md ring-2 ring-background">
                    {player.squadNumber}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                    {player.fullName}
                  </h1>
                  {player.displayName &&
                    player.displayName !== player.fullName && (
                      <span className="text-base text-muted-foreground italic">
                        &ldquo;{player.displayName}&rdquo;
                      </span>
                    )}
                  {isArchived && (
                    <Badge variant="secondary" className="ml-2 font-mono text-xs">
                      Archived
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <PositionBadge position={player.position} />
                  {player.team && (
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      {player.team}
                    </span>
                  )}
                  {player.nationality && (
                    <span className="inline-flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      {player.nationality}
                    </span>
                  )}
                  {player.preferredFoot !== "UNKNOWN" && (
                    <span className="inline-flex items-center gap-1 capitalize">
                      <Footprints className="h-3.5 w-3.5 text-muted-foreground" />
                      {player.preferredFoot.toLowerCase()} foot
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="gap-1.5"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              {isArchived ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-emerald-500 hover:text-emerald-400 border-emerald-500/30"
                  onClick={() => setIsRestoring(true)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-amber-500 hover:text-amber-400 border-amber-500/30"
                  onClick={() => setIsArchiving(true)}
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              )}
              {stats.appearances === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive border-destructive/30"
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Notes callout */}
          {player.notes && (
            <div className="mt-5 rounded-md border border-border/60 bg-secondary/20 p-3 text-sm text-foreground/85">
              <span className="font-semibold text-muted-foreground font-mono text-xs uppercase tracking-wider block mb-0.5">
                Scouting / Tactical Notes
              </span>
              <p className="text-foreground/90 whitespace-pre-line">{player.notes}</p>
            </div>
          )}

          {/* Core Career Totals Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6 border-t border-border/60">
            <div className="rounded-lg border border-border/70 bg-card p-4 text-center">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
                Appearances
              </span>
              <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-foreground">
                {stats.appearances}
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {matches.filter((m) => m.appearanceStatus === "STARTED").length} starts ·{" "}
                {matches.filter((m) => m.appearanceStatus === "SUBSTITUTE_USED").length} sub
              </span>
            </div>

            <div className="rounded-lg border border-border/70 bg-card p-4 text-center">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
                Goals
              </span>
              <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-primary">
                {stats.goals}
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {stats.goalsPerAppearance !== null
                  ? `${stats.goalsPerAppearance.toFixed(2)} / app`
                  : "—"}
              </span>
            </div>

            <div className="rounded-lg border border-border/70 bg-card p-4 text-center">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
                Assists
              </span>
              <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-sky-400">
                {stats.assists}
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {stats.assistsPerAppearance !== null
                  ? `${stats.assistsPerAppearance.toFixed(2)} / app`
                  : "—"}
              </span>
            </div>

            <div className="rounded-lg border border-border/70 bg-card p-4 text-center">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
                Total Contributions
              </span>
              <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-purple-400">
                {stats.goalContributions}
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {stats.contributionsPerAppearance !== null
                  ? `${stats.contributionsPerAppearance.toFixed(2)} / app`
                  : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview: Rates, Chart & Recent Form */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Performance Overview</h2>
            <p className="text-xs text-muted-foreground">
              Per-appearance efficiency metrics, match progression, and current form trends.
            </p>
          </div>
        </div>

        {/* Efficiency Rates & Recent Form Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Per-Appearance Rates Card */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Per-Appearance Efficiency Rates
              </CardTitle>
              <CardDescription className="text-xs">
                Derived directly from completed match appearances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-border/60 bg-secondary/15 p-3 text-center">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                    Goals / App
                  </span>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-primary">
                    {stats.goalsPerAppearance !== null
                      ? stats.goalsPerAppearance.toFixed(2)
                      : "—"}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {stats.goals} in {stats.appearances} apps
                  </span>
                </div>

                <div className="rounded-md border border-border/60 bg-secondary/15 p-3 text-center">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                    Assists / App
                  </span>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-sky-400">
                    {stats.assistsPerAppearance !== null
                      ? stats.assistsPerAppearance.toFixed(2)
                      : "—"}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {stats.assists} in {stats.appearances} apps
                  </span>
                </div>

                <div className="rounded-md border border-border/60 bg-secondary/15 p-3 text-center">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                    G+A / App
                  </span>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-purple-400">
                    {stats.contributionsPerAppearance !== null
                      ? stats.contributionsPerAppearance.toFixed(2)
                      : "—"}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {stats.goalContributions} in {stats.appearances} apps
                  </span>
                </div>
              </div>

              {/* Minutes context */}
              <div className="mt-4 flex items-center justify-between text-xs font-mono text-muted-foreground border-t border-border/50 pt-3">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Total Minutes Recorded:
                </span>
                <span className="font-bold text-foreground tabular-nums">
                  {matches.some((m) => m.minutesPlayed !== null)
                    ? `${matches.reduce((sum, m) => sum + (m.minutesPlayed ?? 0), 0)}'`
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Form Card with "Insufficient data" Guard */}
          <Card className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  Recent Form
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[10px]">
                  Last 5 Apps
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Trajectory across recent competitive fixtures.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {!recentForm.sufficient ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-amber-500 font-semibold text-xs font-mono">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Insufficient data
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Requires at least 3 appearances to establish form trend.
                  </p>
                  <p className="mt-1 text-[10px] font-mono text-muted-foreground">
                    Current sample: {recentForm.sampleSize} of 3 required
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-border/40 pb-2">
                    <span className="text-xs text-muted-foreground font-mono">Sample Size</span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      Last {recentForm.sampleSize} appearances
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Recent Goals</span>
                    <span className="font-mono text-lg font-bold text-primary tabular-nums">
                      {recentForm.goals}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Recent Assists</span>
                    <span className="font-mono text-lg font-bold text-sky-400 tabular-nums">
                      {recentForm.assists}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-2">
                    <span className="text-xs font-semibold text-foreground">Recent G+A</span>
                    <span className="font-mono text-lg font-bold text-purple-400 tabular-nums">
                      {recentForm.goalContributions}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goals & Assists by Match Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <CardTitle className="font-display text-base">
                Goals & Assists by Match
              </CardTitle>
              <span className="text-xs font-mono text-muted-foreground">
                Chronological sequence ({chartAppearances.length} match appearances)
              </span>
            </div>
            <CardDescription className="text-xs">
              Direct match-by-match production in completed fixtures.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {chartAppearances.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <Target className="h-8 w-8 mb-2 opacity-40" />
                <p>No completed appearances to chart yet.</p>
              </div>
            ) : !isChartMounted ? (
              <div className="flex h-56 items-center justify-center text-xs font-mono text-muted-foreground">
                Loading production chart...
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartAppearances}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="currentColor"
                      className="text-border/40"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      stroke="currentColor"
                      className="text-muted-foreground"
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10 }}
                      stroke="currentColor"
                      className="text-muted-foreground"
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length && payload[0]?.payload) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md">
                              <p className="font-semibold text-xs">
                                vs {data.opponent}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {data.competition} · {data.date}
                              </p>
                              {data.minutes !== null && (
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {data.minutes} minutes played
                                </p>
                              )}
                              <div className="mt-2 space-y-1 text-xs font-mono">
                                <div className="flex items-center justify-between gap-4 text-primary">
                                  <span>Goals:</span>
                                  <span className="font-bold">{data.goals}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-sky-400">
                                  <span>Assists:</span>
                                  <span className="font-bold">{data.assists}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-purple-400 border-t border-border pt-1">
                                  <span>Contributions:</span>
                                  <span className="font-bold">{data.contributions}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      formatter={(val) => (
                        <span className="text-xs font-mono capitalize">{val}</span>
                      )}
                    />
                    <Bar
                      dataKey="goals"
                      name="Goals"
                      fill="hsl(var(--primary))"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="assists"
                      name="Assists"
                      fill="hsl(var(--assists))"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestone History Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Milestone History
              </CardTitle>
              <CardDescription className="text-xs">
                Multi-goal performances (Braces, Hat-tricks, 4-Goal, and 5+ Matches) with links to match details.
              </CardDescription>
            </div>

            {/* Quick counters pill group */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1">
                Braces: <strong className="text-foreground">{goalBreakdown.braces}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1">
                Hat-tricks: <strong className="text-primary">{goalBreakdown.hatTricks}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1">
                4-Goal: <strong className="text-foreground">{goalBreakdown.fourGoalMatches}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1">
                5+: <strong className="text-foreground">{goalBreakdown.fiveOrMoreGoalMatches}</strong>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {milestonePerformances.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No multi-goal milestones recorded yet for this player.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {milestonePerformances.map((m) => (
                <div
                  key={m.performanceId}
                  className="group relative flex flex-col justify-between rounded-lg border border-border/80 bg-secondary/15 p-4 transition-all hover:border-primary/50 hover:bg-secondary/30"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="goals" className="font-mono text-xs font-bold">
                        {m.milestoneType}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {new Date(m.match.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <h4 className="font-semibold text-foreground text-sm flex items-center justify-between">
                      <span>vs {m.match.opponent}</span>
                      {m.match.scoreHome !== null && m.match.scoreAway !== null && (
                        <span className="font-mono font-bold text-xs text-muted-foreground">
                          {m.match.scoreHome} - {m.match.scoreAway}
                        </span>
                      )}
                    </h4>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.match.competition?.name || "Friendly / Exhibition"}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="text-xs font-mono space-x-2">
                      <span className="font-bold text-primary">{m.goals} Goals</span>
                      {m.assists > 0 && (
                        <span className="text-sky-400">· {m.assists} Ast</span>
                      )}
                      {m.minutesPlayed !== null && (
                        <span className="text-muted-foreground">· {m.minutesPlayed}&apos;</span>
                      )}
                    </div>

                    <Link
                      href={`/matches/${m.match.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Match Details <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match History Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="font-display text-lg">Match History</CardTitle>
              <CardDescription className="text-xs">
                Comprehensive log of all fixtures, appearance statuses, and individual contributions.
              </CardDescription>
            </div>

            {/* Opponent Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by opponent..."
                value={matchSearch}
                onChange={(e) => {
                  setMatchSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMatches.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {matchSearch
                ? `No match records match "${matchSearch}".`
                : "No match appearances recorded for this player yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Competition</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Minutes</TableHead>
                    <TableHead className="text-right">Goals</TableHead>
                    <TableHead className="text-right">Assists</TableHead>
                    <TableHead className="text-right">G+A</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMatches.map((perf) => (
                    <TableRow key={perf.performanceId} className="hover:bg-secondary/40">
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {new Date(perf.match.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                        {perf.match.competition?.name ?? "Friendly / Exhibition"}
                      </TableCell>
                      <TableCell className="font-medium text-foreground text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{perf.match.opponent}</span>
                          {perf.match.scoreHome !== null && perf.match.scoreAway !== null && (
                            <span className="font-mono text-xs text-muted-foreground font-normal">
                              ({perf.match.scoreHome}-{perf.match.scoreAway})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            perf.appearanceStatus === "STARTED"
                              ? "default"
                              : perf.appearanceStatus === "SUBSTITUTE_USED"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] font-mono"
                        >
                          {perf.appearanceStatus.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs">
                        {perf.minutesPlayed !== null ? `${perf.minutesPlayed}'` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold tabular-nums text-primary text-sm">
                        {perf.goals}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold tabular-nums text-sky-400 text-sm">
                        {perf.assists}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold tabular-nums text-purple-400 text-sm">
                        {perf.goals + perf.assists}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/matches/${perf.match.id}`}
                          className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                          View <ChevronRight className="h-3 w-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs font-mono text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredMatches.length} matches)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 gap-1 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Modal Dialog */}
      <PlayerFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        player={player}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          router.refresh();
        }}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={isArchiving}
        onOpenChange={setIsArchiving}
        title={`Archive ${player.fullName}?`}
        description="Archiving this player preserves all match history and stats, but removes them from active squad selections."
        confirmText="Archive Player"
        isLoading={isLoading}
        onConfirm={handleArchive}
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        open={isRestoring}
        onOpenChange={setIsRestoring}
        title={`Restore ${player.fullName}?`}
        description="This will restore the player to active squad status."
        confirmText="Restore Player"
        isLoading={isLoading}
        onConfirm={handleRestore}
      />

      {/* Hard Delete Dialog (Only allowed when 0 appearances) */}
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title={`Permanently Delete ${player.fullName}?`}
        description="This player has zero recorded appearances. Are you sure you want to permanently delete this profile record?"
        confirmText="Delete Permanently"
        variant="destructive"
        isLoading={isLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
