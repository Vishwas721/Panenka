import * as React from "react";
import Link from "next/link";
import type { PlayerInsight } from "@/server/services/insights.service";
import { PlayerCard } from "@/components/pk/player-card";
import { toCardData } from "@/components/pk/card-data";
import { Radar } from "@/components/pk/radar";
import { SectionHeading, KeywordChip } from "@/components/pk/kit";
import { fmtNum, fmtPct, fmtRating, shortName } from "@/components/pk/format";
import { rarityRank } from "@/lib/stats/keywords";
import { cn } from "@/lib/utils";

interface Metric {
  label: string;
  group: string;
  get: (i: PlayerInsight) => number | null;
  fmt: (n: number | null) => string;
  lowerIsBetter?: boolean;
}

const int = (n: number | null) => (n === null ? "—" : String(n));

export const DUEL_METRICS: Metric[] = [
  { group: "Card", label: "Overall", get: (i) => i.ovr, fmt: int },
  { group: "Ratings", label: "Average rating", get: (i) => i.profile.rating.avg, fmt: fmtRating },
  { group: "Ratings", label: "Last-5 form", get: (i) => i.profile.rating.last5, fmt: fmtRating },
  { group: "Ratings", label: "Best rating", get: (i) => i.profile.rating.best, fmt: fmtRating },
  { group: "Ratings", label: "8.0+ games", get: (i) => i.profile.rating.eightPlus, fmt: int },
  { group: "Ratings", label: "Rating spread", get: (i) => i.profile.rating.stdDev, fmt: (n) => fmtNum(n, 2), lowerIsBetter: true },
  { group: "Output", label: "Appearances", get: (i) => i.profile.apps, fmt: int },
  { group: "Output", label: "Goals", get: (i) => i.profile.goals, fmt: int },
  { group: "Output", label: "Assists", get: (i) => i.profile.assists, fmt: int },
  { group: "Output", label: "G+A per app", get: (i) => i.profile.perApp?.ga ?? null, fmt: (n) => fmtNum(n, 2) },
  { group: "Output", label: "G+A per 90", get: (i) => i.profile.per90?.ga ?? null, fmt: (n) => fmtNum(n, 2) },
  { group: "Output", label: "Minutes per goal", get: (i) => i.profile.minutesPerGoal, fmt: int, lowerIsBetter: true },
  { group: "Output", label: "Hat-tricks", get: (i) => i.profile.hauls.goals.three + i.profile.hauls.goals.four + i.profile.hauls.goals.fivePlus, fmt: int },
  { group: "Impact", label: "Man of the Match", get: (i) => i.profile.motm, fmt: int },
  { group: "Impact", label: "MOTM rate", get: (i) => i.profile.perApp?.motm ?? null, fmt: (n) => fmtPct(n) },
  { group: "Impact", label: "Team-goal involvement", get: (i) => i.profile.teamShare.involvement, fmt: (n) => fmtPct(n) },
  { group: "Winning", label: "Win rate", get: (i) => i.profile.record.winRate, fmt: (n) => fmtPct(n) },
  { group: "Winning", label: "Points per game", get: (i) => i.profile.record.ppg, fmt: (n) => fmtNum(n, 2) },
  { group: "Streaks", label: "Best scoring run", get: (i) => i.profile.streaks.scoring.best, fmt: int },
  { group: "Streaks", label: "Best G+A run", get: (i) => i.profile.streaks.contributing.best, fmt: int },
  { group: "Streaks", label: "Best 7+ rating run", get: (i) => i.profile.streaks.rating7.best, fmt: int },
  { group: "Legacy", label: "Keywords unlocked", get: (i) => i.keywords.unlocked.length, fmt: int },
];

function winner(m: Metric, a: PlayerInsight, b: PlayerInsight): "a" | "b" | "tie" | null {
  const va = m.get(a);
  const vb = m.get(b);
  if (va === null && vb === null) return null;
  if (va === null) return "b";
  if (vb === null) return "a";
  if (Math.abs(va - vb) < 1e-9) return "tie";
  return (m.lowerIsBetter ? va < vb : va > vb) ? "a" : "b";
}

function DuelRow({ m, a, b }: { m: Metric; a: PlayerInsight; b: PlayerInsight }) {
  const va = m.get(a);
  const vb = m.get(b);
  const w = winner(m, a, b);
  // Bar share: for lower-is-better, invert so the better player gets the longer bar.
  let sa = 0.5;
  if (va !== null && vb !== null) {
    const x = m.lowerIsBetter ? 1 / Math.max(va, 1e-6) : va;
    const y = m.lowerIsBetter ? 1 / Math.max(vb, 1e-6) : vb;
    sa = x + y > 0 ? x / (x + y) : 0.5;
  } else if (va !== null) sa = 1;
  else if (vb !== null) sa = 0;

  return (
    <div className="grid grid-cols-[4.2rem_1fr_4.2rem] items-center gap-3 py-2.5 sm:grid-cols-[5.5rem_1fr_5.5rem]">
      <span className={cn("numeral text-right text-2xl sm:text-3xl", w === "a" ? "text-primary" : "text-muted-foreground")}>{m.fmt(va)}</span>
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center justify-center gap-2 text-center">
          <span className="eyebrow truncate">{m.label}</span>
          {m.lowerIsBetter && <span className="font-mono text-[0.6rem] text-muted-foreground/70">↓ better</span>}
        </div>
        <div className="flex h-1.5 gap-1">
          <div className="flex flex-1 justify-end overflow-hidden rounded-full bg-foreground/[0.06]">
            <div className={cn("h-full rounded-full transition-all", w === "a" ? "bg-primary" : "bg-primary/35")} style={{ width: `${sa * 100}%` }} />
          </div>
          <div className="flex-1 overflow-hidden rounded-full bg-foreground/[0.06]">
            <div className={cn("h-full rounded-full transition-all", w === "b" ? "bg-assists" : "bg-assists/35")} style={{ width: `${(1 - sa) * 100}%` }} />
          </div>
        </div>
      </div>
      <span className={cn("numeral text-left text-2xl sm:text-3xl", w === "b" ? "text-assists" : "text-muted-foreground")}>{m.fmt(vb)}</span>
    </div>
  );
}

export function HeadToHead({ a, b }: { a: PlayerInsight; b: PlayerInsight }) {
  const results = DUEL_METRICS.map((m) => winner(m, a, b));
  const winsA = results.filter((r) => r === "a").length;
  const winsB = results.filter((r) => r === "b").length;
  const nameA = shortName(a.player);
  const nameB = shortName(b.player);
  const verdict = winsA === winsB ? "Dead level" : winsA > winsB ? `${nameA} takes it` : `${nameB} takes it`;

  const idsA = new Set(a.keywords.unlocked.map((k) => k.id));
  const idsB = new Set(b.keywords.unlocked.map((k) => k.id));
  const byRarity = <T extends { rarity: Parameters<typeof rarityRank>[0] }>(xs: T[]) => [...xs].sort((x, y) => rarityRank(y.rarity) - rarityRank(x.rarity));
  const shared = byRarity(a.keywords.unlocked.filter((k) => idsB.has(k.id)));
  const onlyA = byRarity(a.keywords.unlocked.filter((k) => !idsB.has(k.id)));
  const onlyB = byRarity(b.keywords.unlocked.filter((k) => !idsA.has(k.id)));

  let lastGroup = "";

  return (
    <div className="space-y-14">
      {/* Face-off */}
      <section className="rise relative grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col items-center gap-4 md:items-end">
          <div className="w-[min(18rem,78vw)] md:-rotate-2">
            <PlayerCard data={toCardData(a)} size="sm" href={`/players/${a.player.id}`} />
          </div>
        </div>
        <div className="relative flex flex-col items-center">
          <span className="font-serif text-2xl italic text-muted-foreground">the</span>
          <span className="numeral text-[6rem] text-foreground sm:text-[8rem]">VS</span>
          <div className="mt-2 flex items-baseline gap-3 font-display text-5xl font-black tabular-nums">
            <span className="text-primary">{winsA}</span>
            <span className="text-2xl text-muted-foreground">–</span>
            <span className="text-assists">{winsB}</span>
          </div>
          <span className="eyebrow mt-2">categories won</span>
          <span className="mt-3 rounded-full border border-foreground/15 bg-elevated px-4 py-1.5 font-display text-lg font-extrabold uppercase tracking-wide">{verdict}</span>
        </div>
        <div className="flex flex-col items-center gap-4 md:items-start">
          <div className="w-[min(18rem,78vw)] md:rotate-2">
            <PlayerCard data={toCardData(b)} size="sm" href={`/players/${b.player.id}`} />
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
        {/* Radar */}
        <section className="panel p-5 sm:p-6">
          <SectionHeading index="01" title="Shape" note="six attributes" />
          {a.attrs && b.attrs ? (
            <Radar
              series={[
                { label: nameA, values: a.attrs, colorVar: "--primary" },
                { label: nameB, values: b.attrs, colorVar: "--assists" },
              ]}
            />
          ) : (
            <p className="py-16 text-center font-serif text-lg italic text-muted-foreground">Both players need an appearance to draw a shape.</p>
          )}
          <div className="mt-2 flex justify-center gap-5 font-mono text-xs uppercase tracking-widest">
            <span className="flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-primary" />{nameA}</span>
            <span className="flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-assists" />{nameB}</span>
          </div>
          {a.archetype && b.archetype && (
            <div className="mt-6 grid grid-cols-2 gap-3 border-t pt-5 text-center">
              <div>
                <div className="eyebrow">Archetype</div>
                <div className="mt-1 font-display text-xl font-extrabold uppercase text-primary">{a.archetype.name}</div>
              </div>
              <div>
                <div className="eyebrow">Archetype</div>
                <div className="mt-1 font-display text-xl font-extrabold uppercase text-assists">{b.archetype.name}</div>
              </div>
            </div>
          )}
        </section>

        {/* Tale of the tape */}
        <section className="panel p-5 sm:p-6">
          <SectionHeading index="02" title="Tale of the tape" note={`${DUEL_METRICS.length} rounds`} />
          <div className="divide-y divide-border/60">
            {DUEL_METRICS.map((m) => {
              const header = m.group !== lastGroup;
              lastGroup = m.group;
              return (
                <React.Fragment key={m.label}>
                  {header && <div className="pb-1 pt-4 font-serif text-base italic text-muted-foreground first:pt-0">{m.group}</div>}
                  <DuelRow m={m} a={a} b={b} />
                </React.Fragment>
              );
            })}
          </div>
        </section>
      </div>

      {/* Keywords */}
      <section>
        <SectionHeading index="03" title="Keyword overlap" note={`${shared.length} shared`} action={<Link href="/keywords" className="eyebrow hover:text-foreground">Open the codex →</Link>} />
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: `Only ${nameA}`, list: onlyA, tone: "--primary" },
            { title: "Both", list: shared, tone: "--foreground" },
            { title: `Only ${nameB}`, list: onlyB, tone: "--assists" },
          ].map((col) => (
            <div key={col.title} className="panel p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-display text-xl font-extrabold uppercase" style={{ color: `hsl(var(${col.tone}))` }}>
                  {col.title}
                </span>
                <span className="numeral text-3xl text-muted-foreground">{col.list.length}</span>
              </div>
              {col.list.length ? (
                <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {col.list.map((k) => (
                    <KeywordChip key={k.id} keyword={k} size="sm" />
                  ))}
                </div>
              ) : (
                <p className="font-serif italic text-muted-foreground">Nothing here.</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
