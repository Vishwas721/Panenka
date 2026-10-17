"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import type { TeamOverview } from "@/server/services/team.service";

type Point = TeamOverview["trend"][number];

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="eyebrow">{p.label}</div>
      <div className="mt-1 font-semibold">
        vs {p.opponent}
        {p.goalsFor !== null && (
          <span className="ml-1.5 tabular-nums text-muted-foreground">
            {p.goalsFor}–{p.goalsAgainst} {p.result}
          </span>
        )}
      </div>
      <div className="mt-1 flex gap-3 tabular-nums">
        <span className="text-rating">Avg {p.avgRating?.toFixed(2) ?? "—"}</span>
        <span className="text-primary">5-game {p.rolling?.toFixed(2) ?? "—"}</span>
      </div>
    </div>
  );
}

/** Squad average match rating per fixture with a 5-game rolling line. */
export function SquadTrendChart({ data, average }: { data: Point[]; average: number | null }) {
  const rated = data.filter((d) => d.avgRating !== null);
  if (rated.length < 2) {
    return (
      <div className="grid h-64 place-items-center text-sm text-muted-foreground">
        Log ratings for at least two matches to draw the trend.
      </div>
    );
  }
  const values = rated.map((d) => d.avgRating as number);
  const lo = Math.max(1, Math.floor(Math.min(...values) - 0.5));
  const hi = Math.min(10, Math.ceil(Math.max(...values) + 0.5));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--rating))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--rating))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--foreground) / 0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={[lo, hi]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          {average !== null && (
            <ReferenceLine y={average} stroke="hsl(var(--foreground) / 0.25)" strokeDasharray="3 5" />
          )}
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "hsl(var(--foreground) / 0.15)" }} />
          <Area
            type="monotone"
            dataKey="avgRating"
            stroke="hsl(var(--rating))"
            strokeWidth={1.5}
            fill="url(#trendFill)"
            connectNulls
            dot={{ r: 2.5, fill: "hsl(var(--rating))", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line type="monotone" dataKey="rolling" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
