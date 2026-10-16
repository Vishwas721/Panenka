"use client";

import * as React from "react";
import { Bar, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TimelinePoint } from "@/lib/stats/profile";
import { fmtDate, fmtRating, ratingVar } from "@/components/pk/format";

/** Per-match rating bars (coloured by band) with the rolling 5-match average on top. */
export function RatingChart({ timeline, average }: { timeline: TimelinePoint[]; average: number | null }) {
  const data = timeline.map((t, i) => ({ ...t, i: i + 1, value: t.rating ?? 0 }));
  if (!timeline.some((t) => t.rating !== null)) {
    return <p className="py-10 text-center font-serif text-lg italic text-muted-foreground">Ratings will chart here once you log them.</p>;
  }
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 6, left: -26, bottom: 0 }} barCategoryGap="18%">
          <XAxis dataKey="i" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "var(--font-mono)" }} interval="preserveStartEnd" />
          <YAxis domain={[3, 10]} ticks={[4, 6, 8, 10]} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "var(--font-mono)" }} />
          {average !== null && (
            <ReferenceLine y={average} stroke="hsl(var(--foreground) / 0.35)" strokeDasharray="4 4" label={{ value: `AVG ${average.toFixed(2)}`, position: "insideTopLeft", fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "var(--font-mono)" }} />
          )}
          <Tooltip
            cursor={{ fill: "hsl(var(--foreground) / 0.05)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const t = payload[0]!.payload as TimelinePoint & { i: number };
              return (
                <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-xl">
                  <div className="eyebrow">{fmtDate(t.date)} · #{t.i}</div>
                  <div className="mt-1 font-semibold">
                    {t.venue === "AWAY" ? "@ " : "vs "}
                    {t.opponent}
                    {t.goalsFor !== null && <span className="ml-1.5 tabular-nums text-muted-foreground">{t.goalsFor}–{t.goalsAgainst}</span>}
                  </div>
                  <div className="mt-1 flex gap-3 font-mono">
                    <span style={{ color: `hsl(var(${ratingVar(t.rating)}))` }}>{fmtRating(t.rating)}</span>
                    {t.goals > 0 && <span className="text-goals">{t.goals}G</span>}
                    {t.assists > 0 && <span className="text-assists">{t.assists}A</span>}
                    {t.motm && <span className="text-motm">★ MOTM</span>}
                  </div>
                  {t.rollingRating !== null && <div className="mt-1 text-muted-foreground">5-game avg {t.rollingRating.toFixed(2)}</div>}
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.matchId} fill={d.rating === null ? "transparent" : `hsl(var(${ratingVar(d.rating)}) / ${d.motm ? 0.95 : 0.55})`} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="rollingRating" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
