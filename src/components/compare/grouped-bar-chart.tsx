"use client";

import * as React from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PlayerComparisonData } from "@/server/services/stats.service";
import { BarChart3 } from "lucide-react";

interface GroupedBarChartProps {
  players: PlayerComparisonData[];
}

const PLAYER_COLORS = [
  "#10b981", // Emerald (Player 1)
  "#0ea5e9", // Sky (Player 2)
  "#f59e0b", // Amber (Player 3)
];

export function GroupedBarChart({ players }: GroupedBarChartProps) {
  const [viewMode, setViewMode] = React.useState<"totals" | "rates" | "all">("totals");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Build chart dataset based on viewMode
  const chartData = React.useMemo(() => {
    if (players.length < 2) return [];
    if (viewMode === "totals") {
      const metrics = [
        { key: "appearances", label: "Appearances" },
        { key: "goals", label: "Goals" },
        { key: "assists", label: "Assists" },
        { key: "contributions", label: "G+A Contributions" },
      ];

      return metrics.map((m) => {
        const item: Record<string, string | number> = { metric: m.label };
        players.forEach((p, idx) => {
          let val = 0;
          if (m.key === "appearances") val = p.stats.appearances;
          else if (m.key === "goals") val = p.stats.goals;
          else if (m.key === "assists") val = p.stats.assists;
          else if (m.key === "contributions") val = p.stats.goalContributions;
          item[`player_${idx}`] = val;
        });
        return item;
      });
    }

    if (viewMode === "rates") {
      const metrics = [
        { key: "goalsPerApp", label: "Goals / App" },
        { key: "assistsPerApp", label: "Assists / App" },
        { key: "contributionsPerApp", label: "G+A / App" },
      ];

      return metrics.map((m) => {
        const item: Record<string, string | number> = { metric: m.label };
        players.forEach((p, idx) => {
          let val = 0;
          if (m.key === "goalsPerApp") val = Number((p.stats.goalsPerAppearance ?? 0).toFixed(2));
          else if (m.key === "assistsPerApp")
            val = Number((p.stats.assistsPerAppearance ?? 0).toFixed(2));
          else if (m.key === "contributionsPerApp")
            val = Number((p.stats.contributionsPerAppearance ?? 0).toFixed(2));
          item[`player_${idx}`] = val;
        });
        return item;
      });
    }

    // "all" mode
    const allMetrics = [
      { key: "apps", label: "Apps" },
      { key: "goals", label: "Goals" },
      { key: "assists", label: "Assists" },
      { key: "g+a", label: "G+A" },
      { key: "goals/app", label: "Goals/App" },
      { key: "ast/app", label: "Ast/App" },
    ];

    return allMetrics.map((m) => {
      const item: Record<string, string | number> = { metric: m.label };
      players.forEach((p, idx) => {
        let val = 0;
        if (m.key === "apps") val = p.stats.appearances;
        else if (m.key === "goals") val = p.stats.goals;
        else if (m.key === "assists") val = p.stats.assists;
        else if (m.key === "g+a") val = p.stats.goalContributions;
        else if (m.key === "goals/app")
          val = Number((p.stats.goalsPerAppearance ?? 0).toFixed(2));
        else if (m.key === "ast/app")
          val = Number((p.stats.assistsPerAppearance ?? 0).toFixed(2));
        item[`player_${idx}`] = val;
      });
      return item;
    });
  }, [players, viewMode]);

  if (players.length < 2) return null;

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Comparative Production Chart
            </CardTitle>
            <CardDescription className="text-xs">
              Grouped visual comparison across volume and rate metrics.
            </CardDescription>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/30 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("totals")}
              className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                viewMode === "totals"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              Totals (Volume)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("rates")}
              className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                viewMode === "rates"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              Rates (/App)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                viewMode === "all"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              All Metrics
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {!isMounted ? (
          <div className="flex h-72 items-center justify-center text-xs font-mono text-muted-foreground">
            Loading comparative chart...
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-border/40"
                />
                <XAxis
                  dataKey="metric"
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-muted-foreground font-mono"
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={viewMode !== "totals"}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-muted-foreground font-mono"
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md min-w-[160px]">
                          <p className="font-semibold text-xs font-mono mb-2 border-b border-border pb-1">
                            {label}
                          </p>
                          <div className="space-y-1.5 text-xs font-mono">
                            {payload.map((entry, idx) => {
                              const p = players[idx];
                              if (!p) return null;
                              return (
                                <div
                                  key={p.player.id}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <span
                                    className="font-medium truncate max-w-[120px]"
                                    style={{ color: entry.color }}
                                  >
                                    {p.player.fullName}:
                                  </span>
                                  <span className="font-bold tabular-nums">
                                    {entry.value}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  content={() => (
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono pb-2">
                      {players.map((p, idx) => (
                        <div key={p.player.id} className="flex items-center gap-1.5">
                          <span
                            className="h-3 w-3 rounded-xs shrink-0"
                            style={{ backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                          />
                          <span className="font-semibold text-foreground">
                            {p.player.fullName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                {players.map((p, idx) => (
                  <Bar
                    key={p.player.id}
                    dataKey={`player_${idx}`}
                    name={p.player.fullName}
                    fill={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={38}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
