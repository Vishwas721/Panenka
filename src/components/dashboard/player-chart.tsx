"use client";

import * as React from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  type TooltipProps,
} from "recharts";
import {
  BarChart3,
  Table as TableIcon,
  ArrowUpDown,
  Filter,
  Eye,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { PositionBadge } from "@/components/players/player-card";
import type { Position } from "@prisma/client";

export interface ChartPlayerRecord {
  id: string;
  fullName: string;
  displayName: string | null;
  position: Position;
  team?: string | null;
  imageUrl?: string | null;
  appearances: number;
  goals: number;
  assists: number;
  goalContributions: number;
  goalsPerAppearance?: number | null;
  assistsPerAppearance?: number | null;
  contributionsPerAppearance?: number | null;
  totalMinutes?: number | null;
}

export interface PlayerChartProps {
  players: ChartPlayerRecord[];
}

type MetricCategory = "contributions" | "goals" | "assists";
type PositionFilter = "ALL" | "FWD" | "MID" | "DEF" | "GK";

interface TooltipPayloadItem {
  name: string;
  value: number;
  dataKey: string;
  color: string;
  payload: ChartPlayerRecord & { name: string };
}

// Custom accessible exact-value tooltip
function CustomTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const firstItem = payload[0] as unknown as TooltipPayloadItem | undefined;
  const data = firstItem?.payload;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-md min-w-[200px]">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div>
          <div className="font-display font-bold text-sm text-foreground">
            {data.fullName}
          </div>
          {data.team && (
            <div className="text-[11px] text-muted-foreground">{data.team}</div>
          )}
        </div>
        <PositionBadge position={data.position} />
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Appearances:</span>
          <span className="font-bold tabular-nums text-foreground">
            {data.appearances}
          </span>
        </div>

        <div className="flex items-center justify-between text-goals">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-goals" />
            Goals:
          </span>
          <span className="font-bold tabular-nums">{data.goals}</span>
        </div>

        <div className="flex items-center justify-between text-assists">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-assists" />
            Assists:
          </span>
          <span className="font-bold tabular-nums">{data.assists}</span>
        </div>

        <div className="flex items-center justify-between border-t border-border/50 pt-1.5 text-contributions font-bold">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-contributions" />
            Total G+A:
          </span>
          <span className="tabular-nums">{data.goalContributions}</span>
        </div>

        {data.goalsPerAppearance !== undefined && data.goalsPerAppearance !== null && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>Goals / App:</span>
            <span className="tabular-nums">
              {data.goalsPerAppearance.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlayerChart({ players }: PlayerChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [metricCategory, setMetricCategory] = React.useState<MetricCategory>("contributions");
  const [positionFilter, setPositionFilter] = React.useState<PositionFilter>("ALL");
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc");
  const [limit, setLimit] = React.useState<number>(10);
  const [viewMode, setViewMode] = React.useState<"chart" | "table">("chart");

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter by position group
  const filteredPlayers = React.useMemo(() => {
    return players.filter((player) => {
      if (positionFilter === "ALL") return true;
      if (positionFilter === "FWD") {
        return ["ST", "LW", "RW"].includes(player.position);
      }
      if (positionFilter === "MID") {
        return ["CAM", "CM", "CDM"].includes(player.position);
      }
      if (positionFilter === "DEF") {
        return ["CB", "LB", "RB"].includes(player.position);
      }
      if (positionFilter === "GK") {
        return player.position === "GK";
      }
      return true;
    });
  }, [players, positionFilter]);

  // Sort and slice
  const processedData = React.useMemo(() => {
    const list = [...filteredPlayers];

    list.sort((a, b) => {
      let primaryDiff = 0;
      if (metricCategory === "goals") {
        primaryDiff = a.goals - b.goals;
      } else if (metricCategory === "assists") {
        primaryDiff = a.assists - b.assists;
      } else {
        primaryDiff = a.goalContributions - b.goalContributions;
      }

      if (primaryDiff !== 0) {
        return sortOrder === "desc" ? -primaryDiff : primaryDiff;
      }

      // Tiebreaker: appearances
      if (b.appearances !== a.appearances) {
        return sortOrder === "desc"
          ? b.appearances - a.appearances
          : a.appearances - b.appearances;
      }

      // Final: Name
      return a.fullName.localeCompare(b.fullName);
    });

    const sliced = list.slice(0, limit);

    // Format for Recharts layout="vertical"
    // In horizontal layout, Recharts displays from top to bottom
    // If descending, we want highest value on top
    return sliced.map((p) => ({
      ...p,
      name: p.displayName || p.fullName,
    }));
  }, [filteredPlayers, metricCategory, sortOrder, limit]);

  // Dynamic height based on number of items to prevent cramped bars
  const chartHeight = Math.max(340, processedData.length * 42);

  return (
    <Card className="border-border/70 overflow-hidden shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold font-display tracking-tight text-foreground">
                Offensive Production Breakdown
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                Top {processedData.length} Players
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interactive visualization of goals and assists across the squad.
            </p>
          </div>

          {/* Interactive Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Category Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-secondary/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMetricCategory("contributions")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  metricCategory === "contributions"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Combined (G+A)
              </button>
              <button
                type="button"
                onClick={() => setMetricCategory("goals")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  metricCategory === "goals"
                    ? "bg-card text-goals shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Goals
              </button>
              <button
                type="button"
                onClick={() => setMetricCategory("assists")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  metricCategory === "assists"
                    ? "bg-card text-assists shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Assists
              </button>
            </div>

            {/* Position Filter */}
            <div className="flex items-center rounded-lg border border-border bg-secondary/30 p-0.5 text-xs">
              {(["ALL", "FWD", "MID", "DEF", "GK"] as PositionFilter[]).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPositionFilter(pos)}
                  className={`px-2 py-1 rounded-md font-mono text-[11px] transition-colors ${
                    positionFilter === pos
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Sort Order Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="h-8 px-2.5 text-xs font-mono"
              title={`Sorting ${sortOrder === "desc" ? "Highest first" : "Lowest first"}`}
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              {sortOrder === "desc" ? "High → Low" : "Low → High"}
            </Button>

            {/* Limit Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-secondary/30 p-0.5 text-xs">
              {[5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setLimit(num)}
                  className={`px-2 py-1 rounded-md font-mono text-[11px] transition-colors ${
                    limit === num
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Top {num}
                </button>
              ))}
            </div>

            {/* Accessible View Mode Toggle (Chart vs Data Table) */}
            <div className="flex items-center rounded-lg border border-border bg-secondary/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("chart")}
                aria-label="View interactive horizontal bar chart"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "chart"
                    ? "bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Bar Chart view"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="View accessible data table alternative"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Accessible Data Table view"
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {processedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Info className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No players match the current criteria.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Try switching position filters or logging more match performances.
            </p>
          </div>
        ) : viewMode === "chart" ? (
          <div className="w-full">
            {!isMounted ? (
              <div
                style={{ height: chartHeight }}
                className="flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-secondary/10"
              >
                <span className="text-xs font-mono text-muted-foreground animate-pulse">
                  Rendering tactical visualization...
                </span>
              </div>
            ) : (
              <div style={{ width: "100%", height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={processedData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={{ stroke: "hsl(var(--border))" }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={{ stroke: "hsl(var(--border))" }}
                      width={125}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--secondary) / 0.4)" }} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
                    />

                    {metricCategory === "contributions" && (
                      <>
                        <Bar
                          dataKey="goals"
                          name="Goals"
                          stackId="contributionsStack"
                          fill="hsl(var(--goals))"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="assists"
                          name="Assists"
                          stackId="contributionsStack"
                          fill="hsl(var(--assists))"
                          radius={[0, 4, 4, 0]}
                        />
                      </>
                    )}

                    {metricCategory === "goals" && (
                      <Bar
                        dataKey="goals"
                        name="Goals"
                        fill="hsl(var(--goals))"
                        radius={[0, 4, 4, 0]}
                      />
                    )}

                    {metricCategory === "assists" && (
                      <Bar
                        dataKey="assists"
                        name="Assists"
                        fill="hsl(var(--assists))"
                        radius={[0, 4, 4, 0]}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between border-t border-border/50 pt-2 text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-goals" />
                Goals
                <span className="mx-1">·</span>
                <span className="h-2 w-2 rounded-full bg-assists" />
                Assists
                <span className="mx-1">·</span>
                Hover over bars to inspect exact match efficiency metrics
              </span>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className="text-primary hover:underline inline-flex items-center"
              >
                Switch to accessible data table
              </button>
            </div>
          </div>
        ) : (
          /* Accessible Data Table Alternative */
          <div className="w-full space-y-3">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableCaption className="text-xs text-muted-foreground pb-2">
                  Top players ranking by {metricCategory === "contributions" ? "goal contributions (G+A)" : metricCategory} (Accessible data table alternative)
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center font-mono">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="w-20 text-center">Pos</TableHead>
                    <TableHead className="text-right font-mono">Apps</TableHead>
                    <TableHead className="text-right font-mono text-goals">Goals</TableHead>
                    <TableHead className="text-right font-mono text-assists">Assists</TableHead>
                    <TableHead className="text-right font-mono text-contributions">Total G+A</TableHead>
                    <TableHead className="text-right font-mono">G/App</TableHead>
                    <TableHead className="text-right font-mono">A/App</TableHead>
                    <TableHead className="w-16 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.map((player, idx) => {
                    const rank = idx + 1;
                    return (
                      <TableRow key={player.id} className="hover:bg-secondary/30">
                        <TableCell className="text-center font-mono font-bold text-xs tabular-nums text-muted-foreground">
                          {rank}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">
                            {player.fullName}
                          </div>
                          {player.team && (
                            <div className="text-xs text-muted-foreground">
                              {player.team}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <PositionBadge position={player.position} />
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {player.appearances}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold tabular-nums text-goals">
                          {player.goals}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold tabular-nums text-assists">
                          {player.assists}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold tabular-nums text-contributions">
                          {player.goalContributions}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                          {player.goalsPerAppearance !== undefined && player.goalsPerAppearance !== null
                            ? player.goalsPerAppearance.toFixed(2)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                          {player.assistsPerAppearance !== undefined && player.assistsPerAppearance !== null
                            ? player.assistsPerAppearance.toFixed(2)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link
                            href={`/players/${player.id}`}
                            className="inline-flex items-center text-xs text-primary hover:underline"
                            title={`View ${player.fullName}'s profile`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="sr-only">View profile</span>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {processedData.length} of {filteredPlayers.length} filtered players</span>
              <button
                type="button"
                onClick={() => setViewMode("chart")}
                className="text-primary hover:underline font-medium"
              >
                Switch back to visual chart
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
