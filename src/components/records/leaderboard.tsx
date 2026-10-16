"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar, RatingPill } from "@/components/pk/kit";
import { fmtNum, fmtPct, fmtRating } from "@/components/pk/format";

export interface LeaderRow {
  id: string;
  name: string;
  fullName: string;
  position: string;
  imageUrl: string | null;
  number: number | null;
  ovr: number | null;
  tierId: string;
  apps: number;
  starts: number;
  minutes: number | null;
  goals: number;
  assists: number;
  ga: number;
  gpa: number | null;
  apa: number | null;
  gapa: number | null;
  ga90: number | null;
  motm: number;
  avg: number | null;
  best: number | null;
  eights: number;
  nines: number;
  braces: number;
  hattricks: number;
  w: number;
  d: number;
  l: number;
  winRate: number | null;
  keywords: number;
}

type Key = Exclude<keyof LeaderRow, "id" | "name" | "fullName" | "position" | "imageUrl" | "number" | "tierId">;

interface Col {
  key: Key;
  label: string;
  title: string;
  render?: (r: LeaderRow) => React.ReactNode;
  tone?: string;
}

const COLS: Col[] = [
  { key: "ovr", label: "OVR", title: "Overall", render: (r) => <span className="font-display text-lg font-black">{r.ovr ?? "—"}</span> },
  { key: "apps", label: "App", title: "Appearances" },
  { key: "starts", label: "St", title: "Starts" },
  { key: "minutes", label: "Min", title: "Minutes", render: (r) => (r.minutes === null ? "—" : r.minutes.toLocaleString("en")) },
  { key: "goals", label: "G", title: "Goals", tone: "text-goals" },
  { key: "assists", label: "A", title: "Assists", tone: "text-assists" },
  { key: "ga", label: "G+A", title: "Goal involvements" },
  { key: "gpa", label: "G/app", title: "Goals per appearance", render: (r) => fmtNum(r.gpa) },
  { key: "apa", label: "A/app", title: "Assists per appearance", render: (r) => fmtNum(r.apa) },
  { key: "gapa", label: "G+A/app", title: "Involvements per appearance", render: (r) => fmtNum(r.gapa) },
  { key: "ga90", label: "G+A/90", title: "Involvements per 90", render: (r) => fmtNum(r.ga90) },
  { key: "motm", label: "★", title: "Man of the Match", tone: "text-motm" },
  { key: "avg", label: "Avg", title: "Average rating", render: (r) => <RatingPill rating={r.avg} size="sm" /> },
  { key: "best", label: "Best", title: "Best rating", render: (r) => fmtRating(r.best) },
  { key: "eights", label: "8+", title: "8.0+ ratings" },
  { key: "nines", label: "9+", title: "9.0+ ratings" },
  { key: "braces", label: "2G", title: "Braces" },
  { key: "hattricks", label: "3G+", title: "Hat-tricks or better" },
  { key: "w", label: "W", title: "Wins", tone: "text-win" },
  { key: "d", label: "D", title: "Draws" },
  { key: "l", label: "L", title: "Losses", tone: "text-loss" },
  { key: "winRate", label: "Win%", title: "Win rate", render: (r) => fmtPct(r.winRate) },
  { key: "keywords", label: "KW", title: "Keywords unlocked" },
];

export function Leaderboard({ rows }: { rows: LeaderRow[] }) {
  const [sort, setSort] = React.useState<Key>("ovr");
  const [asc, setAsc] = React.useState(false);
  const [minApps, setMinApps] = React.useState(0);
  const maxApps = Math.max(1, ...rows.map((r) => r.apps));

  const sorted = React.useMemo(() => {
    const filtered = rows.filter((r) => r.apps >= minApps);
    return filtered.sort((a, b) => {
      const va = a[sort];
      const vb = b[sort];
      if (va === null && vb === null) return a.fullName.localeCompare(b.fullName);
      if (va === null) return 1;
      if (vb === null) return -1;
      const diff = (va as number) - (vb as number);
      if (diff !== 0) return asc ? diff : -diff;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [rows, sort, asc, minApps]);

  const colMax = React.useMemo(() => {
    const m: Partial<Record<Key, number>> = {};
    for (const c of COLS) {
      const vals = sorted.map((r) => r[c.key]).filter((v): v is number => typeof v === "number");
      if (vals.length) m[c.key] = Math.max(...vals);
    }
    return m;
  }, [sorted]);

  const onSort = (k: Key) => {
    if (k === sort) setAsc(!asc);
    else {
      setSort(k);
      setAsc(false);
    }
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="eyebrow">
          Showing <span className="text-foreground">{sorted.length}</span> of {rows.length} · sorted by{" "}
          <span className="text-primary">{COLS.find((c) => c.key === sort)?.title}</span>
        </div>
        <label className="flex items-center gap-3">
          <span className="eyebrow whitespace-nowrap">Min apps</span>
          <input
            type="range"
            min={0}
            max={maxApps}
            value={minApps}
            onChange={(e) => setMinApps(Number(e.target.value))}
            className="w-40 accent-[hsl(var(--primary))]"
            aria-label="Minimum appearances"
          />
          <span className="numeral w-8 text-2xl">{minApps}</span>
        </label>
      </div>
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-10 bg-card px-3 py-3 text-left">
                <span className="eyebrow">#&nbsp;&nbsp;Player</span>
              </th>
              {COLS.map((c) => (
                <th key={c.key} className="px-2 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    title={c.title}
                    className={cn("inline-flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] transition-colors hover:text-foreground", sort === c.key ? "text-primary" : "text-muted-foreground")}
                  >
                    {c.label}
                    {sort === c.key && (asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => (
              <tr key={r.id} className="group border-b border-border/50 transition-colors last:border-0 hover:bg-elevated/50">
                <td className="sticky left-0 z-10 bg-card px-3 py-2 group-hover:bg-elevated">
                  <Link href={`/players/${r.id}`} className="flex items-center gap-3">
                    <span className={cn("w-6 text-right font-display text-lg font-black tabular-nums", idx < 3 ? "text-primary" : "text-muted-foreground")}>{idx + 1}</span>
                    <PlayerAvatar name={r.fullName} imageUrl={r.imageUrl} number={r.number} className="h-8 w-8 text-[0.65rem]" />
                    <span className="min-w-0">
                      <span className="block max-w-[9rem] truncate font-display text-base font-extrabold uppercase tracking-wide group-hover:text-primary">{r.name}</span>
                      <span className="block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">{r.position}</span>
                    </span>
                  </Link>
                </td>
                {COLS.map((c) => {
                  const v = r[c.key];
                  const lead = typeof v === "number" && v > 0 && colMax[c.key] === v;
                  return (
                    <td key={c.key} className={cn("px-2 py-2 text-right font-mono tabular-nums", c.tone, sort === c.key && "bg-primary/[0.05]", lead && "font-bold")}>
                      {c.render ? c.render(r) : v === null ? "—" : String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 1} className="py-12 text-center font-serif text-lg italic text-muted-foreground">
                  Nobody has that many appearances yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
