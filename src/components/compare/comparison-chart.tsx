"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, SlidersHorizontal } from "lucide-react";
import type { PlayerComparisonData } from "@/server/services/stats.service";
import { formatRate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface ComparisonChartProps {
  players: PlayerComparisonData[];
}

const PLAYER_COLORS = [
  { fill: "#10b981", stroke: "#059669", name: "Emerald" }, // Player 1
  { fill: "#0ea5e9", stroke: "#0284c7", name: "Sky" },     // Player 2
  { fill: "#f59e0b", stroke: "#d97706", name: "Amber" },   // Player 3
];

type ChartViewMode = "totals" | "rates" | "all";

export function ComparisonChart({ players }: ComparisonChartProps) {
  const [mounted, setMounted] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ChartViewMode>("totals");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (players.length < 2) {
    return null;
  }

  // Build data arrays for Recharts
  const totalsData = [
    {
      metric: "Appearances",
      ...players.reduce((acc, p, idx) => ({ ...acc, [`player_${idx}`]: p.stats.appearances }), {}),
    },
    {
      metric: "Goals",
      ...players.reduce((acc, p, idx) => ({ ...acc, [`player_${idx}`]: p.stats.goals }), {}),
    },
    {
      metric: "Assists",
      ...players.reduce((acc, p, idx) => ({ ...acc, [`player_${idx}`]: p.stats.assists }), {}),
    },
    {
      metric: "Contributions (G+A)",
      ...players.reduce((acc, p, idx) => ({ ...acc, [`player_${idx}`]: p.stats.goalContributions }), {}),
    },
  ];

  const ratesData = [
    {
      metric: "Goals / App",
      ...players.reduce(
        (acc, p, idx) => ({
          ...acc,
          [`player_${idx}`]: p.stats.goalsPerAppearance ?? 0,
        }),
        {}
      ),
    },
    {
      metric: "Assists / App",
      ...players.reduce(
        (acc, p, idx) => ({
          ...acc,
          [`player_${idx}`]: p.stats.assistsPerAppearance ?? 0,
        }),
        {}
      ),
    },
    {
      metric: "Contributions / App",
      ...players.reduce(
        (acc, p, idx) => ({
          ...acc,
          [`player_${idx}`]: p.stats.contributionsPerAppearance ?? 0,
        }),
        {}
      ),
    },
  ];

  const chartData = viewMode === "rates" ? ratesData : totalsData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-lg border border-border bg-popover/95 p-3 text-popover-foreground shadow-md backdrop-blur-xs min-w-[180px]">
        <div className="font-semibold text-xs border-b border-border/60 pb-1.5 mb-2 font-display">
          {label}
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any, i: number) => {
            const playerIndex = parseInt(entry.dataKey.replace("player_", ""), 10);
            const player = players[playerIndex];
            if (!player) return null;

            const isRate = viewMode === "rates";
            const formattedVal = isRate
              ? formatRate(entry.value)
              : String(entry.value);

            return (
              <div key={i} className="flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="font-medium text-foreground">
                    {player.player.displayName || player.player.fullName}
                  </span>
                </div>
                <span className="font-mono font-bold tabular-nums">
                  {formattedVal}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold font-display tracking-tight text-foreground">
                Head-to-Head Comparison Chart
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Visual side-by-side performance comparison across key statistical dimensions.
            </CardDescription>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border/60 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("totals")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                viewMode === "totals"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Total Output
            </button>
            <button
              onClick={() => setViewMode("rates")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                viewMode === "rates"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Per-App Rates
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-4 pt-1">
          {players.map((p, idx) => {
            const color = PLAYER_COLORS[idx]!;
            return (
              <div
                key={p.player.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-full border bg-muted/30 text-xs"
                style={{ borderColor: `${color.fill}60` }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color.fill }}
                />
                <span className="font-semibold text-foreground">
                  {p.player.displayName || p.player.fullName}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({p.player.position})
                </span>
              </div>
            );
          })}
        </div>

        {/* Chart Container */}
        <div className="w-full h-[340px] pt-2">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                barGap={8}
                barCategoryGap="25%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-border/40"
                />
                <XAxis
                  dataKey="metric"
                  tickLine={false}
                  axisLine={{ stroke: "currentColor", className: "text-border/60" }}
                  tick={{ fill: "currentColor", fontSize: 12, className: "text-muted-foreground font-medium" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "currentColor", className: "text-border/60" }}
                  tick={{ fill: "currentColor", fontSize: 11, className: "text-muted-foreground font-mono" }}
                  allowDecimals={viewMode === "rates"}
                />
                <Tooltip content={<CustomTooltip />} />
                {players.map((p, idx) => (
                  <Bar
                    key={p.player.id}
                    dataKey={`player_${idx}`}
                    name={p.player.displayName || p.player.fullName}
                    fill={PLAYER_COLORS[idx]!.fill}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
              Loading chart...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
