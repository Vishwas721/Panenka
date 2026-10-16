import * as React from "react";
import Link from "next/link";
import type { PlayerInsight } from "@/server/services/insights.service";
import type { TimelinePoint } from "@/lib/stats/profile";
import { PlayerAvatar } from "@/components/pk/kit";
import { fmtDate, fmtNum, fmtPct, fmtRating, shortName } from "@/components/pk/format";
import { cn } from "@/lib/utils";

export interface RecordEntry {
  key: string;
  title: string;
  tone: "goals" | "assists" | "motm" | "rating" | "primary" | "win";
  value: string;
  unit?: string;
  holders: { id: string; name: string; imageUrl: string | null; number: number | null }[];
  context?: { label: string; href?: string };
}

type Getter = (i: PlayerInsight) => number | null;

function holdersOf(squad: PlayerInsight[], get: Getter, lowerIsBetter = false) {
  const vals = squad.map((i) => ({ i, v: get(i) })).filter((x): x is { i: PlayerInsight; v: number } => x.v !== null && x.v > 0);
  if (!vals.length) return null;
  const best = lowerIsBetter ? Math.min(...vals.map((x) => x.v)) : Math.max(...vals.map((x) => x.v));
  return { best, list: vals.filter((x) => Math.abs(x.v - best) < 1e-9).map((x) => x.i) };
}

const asHolder = (i: PlayerInsight) => ({ id: i.player.id, name: shortName(i.player), imageUrl: i.player.imageUrl, number: i.player.squadNumber });

/** Best single-match record: returns holder(s) and the first matching match for context. */
function matchRecord(squad: PlayerInsight[], get: (t: TimelinePoint) => number | null) {
  let best = -Infinity;
  const hits: { i: PlayerInsight; t: TimelinePoint }[] = [];
  for (const i of squad) {
    for (const t of i.profile.timeline) {
      const v = get(t);
      if (v === null || v <= 0) continue;
      if (v > best + 1e-9) {
        best = v;
        hits.length = 0;
        hits.push({ i, t });
      } else if (Math.abs(v - best) < 1e-9) hits.push({ i, t });
    }
  }
  if (!hits.length) return null;
  const uniq = [...new Map(hits.map((h) => [h.i.player.id, h.i])).values()];
  const first = hits.sort((a, b) => (a.t.date < b.t.date ? 1 : -1))[0]!;
  return { best, holders: uniq, match: first.t, more: hits.length - 1 };
}

export function buildRecords(squad: PlayerInsight[]): RecordEntry[] {
  const out: RecordEntry[] = [];
  const matchCtx = (t: TimelinePoint, more: number) => ({
    label: `vs ${t.opponent} · ${fmtDate(t.date, { day: "numeric", month: "short", year: "2-digit" })}${more > 0 ? ` +${more} more` : ""}`,
    href: `/matches/${t.matchId}`,
  });

  const single: [string, string, RecordEntry["tone"], (t: TimelinePoint) => number | null, (n: number) => string, string][] = [
    ["m-goals", "Most goals in a match", "goals", (t) => t.goals, (n) => String(n), "goals"],
    ["m-assists", "Most assists in a match", "assists", (t) => t.assists, (n) => String(n), "assists"],
    ["m-ga", "Most G+A in a match", "primary", (t) => t.goals + t.assists, (n) => String(n), "involvements"],
    ["m-rating", "Highest match rating", "rating", (t) => t.rating, (n) => fmtRating(n), "rating"],
    ["m-score", "Greatest single performance", "motm", (t) => t.matchScore, (n) => fmtNum(n, 0), "match score"],
  ];
  for (const [key, title, tone, get, fmt, unit] of single) {
    const r = matchRecord(squad, get);
    if (!r) continue;
    out.push({ key, title, tone, value: fmt(r.best), unit, holders: r.holders.map(asHolder), context: matchCtx(r.match, r.more) });
  }

  const career: [string, string, RecordEntry["tone"], Getter, (n: number) => string, string, boolean?][] = [
    ["c-goals", "All-time top scorer", "goals", (i) => i.profile.goals, String, "goals"],
    ["c-assists", "All-time top creator", "assists", (i) => i.profile.assists, String, "assists"],
    ["c-motm", "Most Man of the Match", "motm", (i) => i.profile.motm, String, "awards"],
    ["c-apps", "Most appearances", "primary", (i) => i.profile.apps, String, "apps"],
    ["c-avg", "Best average rating", "rating", (i) => (i.profile.rating.rated >= 5 ? i.profile.rating.avg : null), fmtRating, "avg · 5+ rated"],
    ["c-gapa", "Best G+A per appearance", "primary", (i) => (i.profile.apps >= 5 ? i.profile.perApp?.ga ?? null : null), (n) => fmtNum(n, 2), "per app · 5+"],
    ["c-mpg", "Fastest scorer", "goals", (i) => (i.profile.goals >= 3 ? i.profile.minutesPerGoal : null), String, "min per goal", true],
    ["s-score", "Longest scoring streak", "goals", (i) => i.profile.streaks.scoring.best, String, "games"],
    ["s-ga", "Longest G+A streak", "primary", (i) => i.profile.streaks.contributing.best, String, "games"],
    ["s-r7", "Longest 7+ rating run", "rating", (i) => i.profile.streaks.rating7.best, String, "games"],
    ["s-unbeaten", "Longest unbeaten run", "win", (i) => i.profile.streaks.unbeaten.best, String, "games"],
    ["c-hat", "Most hat-tricks", "goals", (i) => i.profile.hauls.goals.three + i.profile.hauls.goals.four + i.profile.hauls.goals.fivePlus, String, "hat-tricks"],
    ["c-nines", "Most 9+ ratings", "rating", (i) => i.profile.rating.ninePlus, String, "games"],
    ["c-win", "Best win rate", "win", (i) => (i.profile.record.known >= 5 ? i.profile.record.winRate : null), (n) => fmtPct(n), "won · 5+"],
    ["c-keywords", "Most keywords unlocked", "motm", (i) => i.keywords.unlocked.length, String, "keywords"],
  ];
  for (const [key, title, tone, get, fmt, unit, lower] of career) {
    const h = holdersOf(squad, get, lower);
    if (!h) continue;
    out.push({ key, title, tone, value: fmt(h.best), unit, holders: h.list.map(asHolder) });
  }
  return out;
}

export function RecordWall({ records }: { records: RecordEntry[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {records.map((r, idx) => (
        <article
          key={r.key}
          className={cn("panel panel-hover rise group flex flex-col overflow-hidden p-5", idx === 0 && "sm:col-span-2 sm:row-span-2 pitch-lines")}
          style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
        >
          <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: `hsl(var(--${r.tone}))` }} />
          <div className="eyebrow">{r.title}</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={cn("numeral", idx === 0 ? "text-[7rem] sm:text-[9rem]" : "text-6xl")} style={{ color: `hsl(var(--${r.tone}))` }}>
              {r.value}
            </span>
            {r.unit && <span className="font-serif text-lg italic text-muted-foreground">{r.unit}</span>}
          </div>
          <div className="mt-auto pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {r.holders.slice(0, 4).map((h) => (
                <Link key={h.id} href={`/players/${h.id}`} className="flex items-center gap-2 rounded-full border bg-elevated/60 py-0.5 pl-0.5 pr-3 transition-colors hover:border-foreground/30">
                  <PlayerAvatar name={h.name} imageUrl={h.imageUrl} className="h-7 w-7 text-[0.6rem]" />
                  <span className="font-display text-base font-extrabold uppercase tracking-wide">{h.name}</span>
                </Link>
              ))}
              {r.holders.length > 4 && <span className="eyebrow">+{r.holders.length - 4} tied</span>}
            </div>
            {r.context && (
              <div className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
                {r.context.href ? (
                  <Link href={r.context.href} className="hover:text-foreground">
                    {r.context.label} →
                  </Link>
                ) : (
                  r.context.label
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
