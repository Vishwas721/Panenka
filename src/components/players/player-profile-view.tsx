import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Minus, Star, Flame } from "lucide-react";
import type { PlayerInsightDetail } from "@/server/services/insights.service";
import type { SplitLine, TimelinePoint } from "@/lib/stats/profile";
import { ATTRIBUTE_META, cardKeys } from "@/lib/stats/attributes";
import { roleGroup } from "@/lib/stats/rating-model";
import { FAMILY_LABELS, KEYWORD_CATALOGUE, RARITIES, rarityRank, type Family, type Keyword } from "@/lib/stats/keywords";
import { cn } from "@/lib/utils";
import { PlayerCard } from "@/components/pk/player-card";
import { toCardData } from "@/components/pk/card-data";
import { Radar } from "@/components/pk/radar";
import {
  EmptyState, FormStrip, KeywordChip, Meter, RarityDot, RARITY_LABEL, RatingPill, ResultBadge, SectionHeading, Stat,
} from "@/components/pk/kit";
import { dash, fmtDate, fmtNum, fmtPct, fmtRating, fmtSigned, POSITION_LABEL, ratingVar } from "@/components/pk/format";
import { RatingChart } from "./profile/rating-chart";
import { ProfileTabs } from "./profile/profile-tabs";

type P = PlayerInsightDetail;

export function PlayerProfileView({ insight, actions }: { insight: P; actions?: React.ReactNode }) {
  const { player, profile } = insight;
  const hasApps = profile.apps > 0;

  return (
    <div>
      <Link href="/players" className="eyebrow mb-6 inline-flex items-center gap-1.5 hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Squad
      </Link>

      <Hero insight={insight} actions={actions} />

      {hasApps ? (
        <ProfileTabs
          tabs={[
            { id: "overview", label: "Overview", content: <Overview insight={insight} /> },
            { id: "matches", label: "Matches", count: profile.apps, content: <Matches timeline={profile.timeline} /> },
            { id: "splits", label: "Splits", content: <Splits insight={insight} /> },
            { id: "keywords", label: "Keywords", count: insight.keywords.unlocked.length, content: <Keywords insight={insight} /> },
            { id: "records", label: "Records", content: <Records insight={insight} /> },
          ]}
        />
      ) : (
        <EmptyState
          title="No minutes yet"
          action={
            <Link href="/matches/new" className="inline-flex h-9 items-center rounded-full bg-primary px-4 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
              Log a match
            </Link>
          }
        >
          {player.fullName.split(" ")[0]}&apos;s card, attributes and keywords come alive after their first completed appearance.
        </EmptyState>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero({ insight, actions }: { insight: P; actions?: React.ReactNode }) {
  const { player, profile, keywords, archetype, ranks } = insight;
  const trend = profile.rating.last5 !== null && profile.rating.avg !== null ? profile.rating.last5 - profile.rating.avg : null;
  const TrendIcon = trend === null || Math.abs(trend) < 0.15 ? Minus : trend > 0 ? ArrowUpRight : ArrowDownRight;
  const [first, ...rest] = player.fullName.trim().split(/\s+/);
  const last = rest.join(" ");

  return (
    <section className="relative mb-12 grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-14">
      <div className="pitch-lines pointer-events-none absolute -inset-x-2 -top-10 sm:-inset-x-10 bottom-0 -z-10 opacity-70 [mask-image:radial-gradient(closest-side,black,transparent)]" />
      <div className="rise mx-auto lg:mx-0">
        <PlayerCard data={toCardData(insight)} size="lg" />
      </div>

      <div className="rise min-w-0 [animation-delay:120ms]">
        <div className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-primary">{player.squadNumber != null ? `No. ${player.squadNumber}` : "Squad"}</span>
          <span>{POSITION_LABEL[player.position]}</span>
          {player.team && <span>{player.team}</span>}
          {player.nationality && <span>{player.nationality}</span>}
          {player.preferredFoot !== "UNKNOWN" && <span>{player.preferredFoot.toLowerCase()} foot</span>}
          {player.archivedAt && <span className="text-warning">Archived</span>}
        </div>
        <h1 className="mt-3 font-display font-black uppercase leading-[0.8] tracking-tight">
          {last ? (
            <>
              <span className="block font-serif text-[clamp(1.8rem,4vw,3rem)] font-normal normal-case italic tracking-normal text-muted-foreground">{first}</span>
              <span className="block break-words text-[clamp(3.4rem,9vw,8rem)]">{last}</span>
            </>
          ) : (
            <span className="block text-[clamp(3.4rem,9vw,8rem)]">{first}</span>
          )}
        </h1>
        {archetype && (
          <p className="mt-4 max-w-xl text-[0.95rem] text-muted-foreground">
            <span className="font-display text-xl font-extrabold uppercase tracking-wide text-foreground">{archetype.name}</span>
            <span className="mx-2 text-border">/</span>
            <span className="font-serif text-lg italic">{archetype.line}</span>
          </p>
        )}

        {keywords.signature.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {keywords.signature.slice(0, 7).map((k) => (
              <KeywordChip key={k.id} keyword={k} />
            ))}
            {keywords.unlocked.length > 7 && (
              <a href="#keywords" className="inline-flex h-8 items-center rounded-full border border-dashed px-3 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                +{keywords.unlocked.length - 7} more
              </a>
            )}
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t pt-6 sm:grid-cols-4">
          <Stat label="Avg rating" value={fmtRating(profile.rating.avg)} tone="rating" size="lg" sub={`${profile.rating.rated} rated`} />
          <Stat label="Goals" value={profile.goals} tone="goals" size="lg" sub={`${fmtNum(profile.perApp?.goals ?? null)} / app`} />
          <Stat label="Assists" value={profile.assists} tone="assists" size="lg" sub={`${fmtNum(profile.perApp?.assists ?? null)} / app`} />
          <Stat label="Man of the match" value={profile.motm} tone="motm" size="lg" sub={`${fmtPct(profile.perApp?.motm ?? null)} of games`} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="eyebrow">Last 5</span>
            <RatingPill rating={profile.rating.last5} />
            {trend !== null && (
              <span className={cn("inline-flex items-center gap-0.5 font-mono text-xs", trend > 0.15 ? "text-win" : trend < -0.15 ? "text-loss" : "text-muted-foreground")}>
                <TrendIcon className="h-3.5 w-3.5" /> {fmtSigned(trend)}
              </span>
            )}
          </div>
          {profile.streaks.scoring.current >= 2 && (
            <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-goals">
              <Flame className="h-3.5 w-3.5" /> Scored in {profile.streaks.scoring.current} straight
            </span>
          )}
          {actions && <div className="ml-auto flex gap-2">{actions}</div>}
        </div>

        {insight.rating.byPosition.length > 1 && (
          <div className="mt-8">
            <div className="eyebrow mb-3">
              Rating by position
              {insight.rating.position !== player.position && (
                <span className="ml-2 normal-case tracking-normal text-muted-foreground">
                  · card says {player.position}, numbers fit {insight.rating.position} best
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {insight.rating.byPosition.map((b, i) => (
                <div
                  key={b.position}
                  className={cn("panel flex items-baseline gap-2 px-3 py-2", i === 0 && "border-primary/50")}
                  title={b.position === player.position ? "Card position" : player.altPositions.includes(b.position as typeof player.position) ? "Set as 'also plays'" : "Natural alternative"}
                >
                  <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">{b.position}</span>
                  <span className={cn("numeral text-2xl", i === 0 && "text-primary")}>{b.ovr}</span>
                  {b.position === player.position && <span className="font-mono text-[0.55rem] uppercase text-muted-foreground">card</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {ranks.some((r) => r.rank !== null) && insight.squadSize > 1 && (
          <div className="mt-8">
            <div className="eyebrow mb-3">Squad rank · of {insight.squadSize}</div>
            <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {ranks.filter((r) => r.rank !== null).map((r) => (
                <div key={r.metric} className={cn("panel shrink-0 px-3 py-2", r.rank === 1 && "border-motm/40")}>
                  <div className="eyebrow !text-[0.6rem]">{r.label}</div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className={cn("numeral text-2xl", r.rank === 1 && "text-motm")}>#{r.rank}</span>
                    <span className="font-mono text-[0.65rem] text-muted-foreground">
                      {r.rank === 1 ? "leader" : `top ${Math.ceil(((r.rank ?? 1) / r.of) * 100)}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function Overview({ insight }: { insight: P }) {
  const { profile: p, attrs } = insight;
  const maxBucket = Math.max(1, ...p.rating.distribution.map((b) => b.count));

  const streaks: { label: string; s: { current: number; best: number }; tone: string }[] = [
    { label: "Scoring", s: p.streaks.scoring, tone: "goals" },
    { label: "Assisting", s: p.streaks.assisting, tone: "assists" },
    { label: "G+A", s: p.streaks.contributing, tone: "primary" },
    { label: "MOTM", s: p.streaks.motm, tone: "motm" },
    { label: "7.0+ rated", s: p.streaks.rating7, tone: "win" },
    { label: "8.0+ rated", s: p.streaks.rating8, tone: "rating" },
    { label: "Unbeaten", s: p.streaks.unbeaten, tone: "win" },
    { label: "Winning", s: p.streaks.winning, tone: "win" },
    { label: "Blank run", s: p.streaks.blank, tone: "loss" },
  ];

  return (
    <div className="space-y-14">
      {/* Output strip */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border bg-border sm:grid-cols-4 lg:grid-cols-8">
        {[
          { l: "Apps", v: p.apps, s: `${p.starts} starts · ${p.subApps} sub` },
          { l: "Minutes", v: p.minutes?.toLocaleString("en") ?? dash, s: p.minutesPerGA ? `${p.minutesPerGA}′ per G/A` : "—" },
          { l: "G+A", v: p.ga, s: `${fmtNum(p.perApp?.ga ?? null)} per app` },
          { l: "Per 90", v: fmtNum(p.per90?.ga ?? null), s: p.per90 ? `${p.per90.goals}G · ${p.per90.assists}A` : "needs minutes" },
          { l: "Record", v: `${p.record.wins}-${p.record.draws}-${p.record.losses}`, s: `${fmtPct(p.record.winRate)} win rate` },
          { l: "Points / game", v: fmtNum(p.record.ppg), s: `${p.record.known} scored games` },
          cardKeys(insight.rating.position).includes("DEF")
            ? { l: "Clean sheets", v: p.defence.cleanSheets, s: `${fmtNum(p.defence.concededPerApp)} conceded / game` }
            : { l: "Team goals", v: fmtPct(p.teamShare.involvement), s: "involved in" },
          { l: "Best rating", v: fmtRating(p.rating.best), s: `worst ${fmtRating(p.rating.worst)}` },
        ].map((x) => (
          <div key={x.l} className="bg-card p-4">
            <Stat label={x.l} value={x.v} sub={x.s} size="sm" />
          </div>
        ))}
      </section>

      {/* Rating chart */}
      <section>
        <SectionHeading index="A" title="Rating log" note="every match, with the 5-game line" />
        <div className="panel p-4 sm:p-6">
          <RatingChart timeline={p.timeline} average={p.rating.avg} />
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
            <span>Median <b className="text-foreground">{fmtRating(p.rating.median)}</b></span>
            <span>Spread ±<b className="text-foreground">{fmtNum(p.rating.stdDev)}</b></span>
            <span>Trend <b className={cn((p.rating.trend ?? 0) > 0 ? "text-win" : (p.rating.trend ?? 0) < 0 ? "text-loss" : "text-foreground")}>{fmtSigned(p.rating.trend, 3)}</b>/game</span>
            <span>7.0+ in <b className="text-foreground">{fmtPct(p.rating.sevenPlusPct)}</b></span>
            <span>Last 10 <b className="text-foreground">{fmtRating(p.rating.last10)}</b></span>
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* Attributes */}
        <section className="min-w-0">
          <SectionHeading index="B" title="Attributes" note="how the card is built" />
          <div className="panel grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-6">
            {attrs && <div className="mx-auto w-full max-w-[20rem] min-w-0"><Radar series={[{ label: "Attributes", values: attrs, colorVar: "--primary" }]} size={300} keys={cardKeys(insight.rating.position)} /></div>}
            <ul className="space-y-4 self-center">
              {cardKeys(insight.rating.position).map((k) => (
                <li key={k}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-lg font-extrabold uppercase tracking-wide">
                      {k} <span className="font-body text-xs font-normal normal-case tracking-normal text-muted-foreground">{ATTRIBUTE_META[k].name}</span>
                    </span>
                    <span className="numeral text-2xl">{attrs?.[k] ?? dash}</span>
                  </div>
                  <Meter value={attrs?.[k] ?? 0} max={99} tone={(attrs?.[k] ?? 0) >= 80 ? "motm" : (attrs?.[k] ?? 0) >= 65 ? "primary" : "muted-foreground"} className="mt-1.5" />
                  <p className="mt-1 text-[0.72rem] text-muted-foreground">{ATTRIBUTE_META[k].blurb}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Form + distribution */}
        <section className="min-w-0 space-y-10">
          <div>
            <SectionHeading index="C" title="Form guide" note="last ten, newest first" />
            <div className="panel scrollbar-none overflow-x-auto p-4">
              <FormStrip items={p.form} />
            </div>
          </div>
          <div>
            <SectionHeading index="D" title="Rating spread" />
            <div className="panel flex h-48 items-end gap-2 p-5">
              {p.rating.distribution.map((b) => (
                <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="font-mono text-[0.65rem] text-muted-foreground">{b.count || ""}</span>
                  <div
                    className="w-full rounded-t-md"
                    style={{ height: `${(b.count / maxBucket) * 100}%`, minHeight: b.count ? 4 : 1, backgroundColor: `hsl(var(${ratingVar(b.min === 0 ? 4 : b.min)}) / ${b.count ? 0.8 : 0.15})` }}
                  />
                  <span className="font-display text-sm font-extrabold">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* OVR breakdown */}
      <section>
        <SectionHeading index="E" title="How the overall is built" note={`vs other ${ROLE_PEERS[roleGroup(insight.player.position)]}`} />
        <OvrBreakdown insight={insight} />
      </section>

      {/* Streaks */}
      <section>
        <SectionHeading index="F" title="Streaks" note="current run vs best ever" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
          {streaks.map(({ label, s, tone }) => (
            <div key={label} className={cn("panel p-4", s.current > 0 && s.current === s.best && s.best >= 2 && "border-foreground/30")}>
              <div className="eyebrow truncate">{label}</div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="numeral text-4xl" style={{ color: s.current ? `hsl(var(--${tone}))` : undefined }}>{s.current}</span>
                <span className="font-mono text-[0.65rem] text-muted-foreground">now</span>
              </div>
              <div className="mt-1 font-mono text-[0.68rem] text-muted-foreground">best {s.best}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Milestones + next keywords */}
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <SectionHeading index="G" title="Next milestones" />
          <div className="panel divide-y">
            {p.milestones.map((m) => (
              <div key={m.metric} className="flex items-center gap-4 p-4">
                <div className="w-36 shrink-0">
                  <div className="eyebrow">{m.label}</div>
                  <div className="mt-1 font-display text-2xl font-extrabold tabular-nums">
                    {m.current} <span className="text-muted-foreground">/ {m.target}</span>
                  </div>
                </div>
                <Meter value={m.current} max={m.target} tone={m.metric === "goals" ? "goals" : m.metric === "assists" ? "assists" : m.metric === "motm" ? "motm" : "primary"} />
                <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground">{m.remaining} to go</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <SectionHeading index="H" title="Almost unlocked" note="keywords within reach" />
          <NextUnlocks insight={insight} />
        </section>
      </div>
    </div>
  );
}

const ROLE_PEERS = { ATT: "attackers", MID: "midfielders", DEF: "defenders & DMs", GK: "keepers" } as const;

/** Standard normal CDF, for turning a z-score into "better than X% of peers". */
function pctOf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function OvrBreakdown({ insight }: { insight: P }) {
  const { breakdown, z, squadSize } = insight.rating;
  const rows = [...breakdown].sort((a, b) => b.weight - a.weight);
  return (
    <div className="panel p-5 sm:p-6">
      <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
        Each number is compared with other {ROLE_PEERS[roleGroup(insight.player.position)]} in your squad
        {squadSize > 0 ? ` (${squadSize} players with 3+ games)` : ""}, adjusted for how many games it&apos;s based on, then weighted by the{" "}
        <b className="text-foreground">{insight.rating.position}</b> recipe
        {insight.rating.position !== insight.player.position ? ` (their best fit; the card says ${insight.player.position})` : ""}.
        {z !== null && (
          <>
            {" "}Overall standing: <b className="text-foreground">{z >= 0 ? "+" : ""}{z.toFixed(2)} SD</b> from the squad average (≈ better than{" "}
            <b className="text-foreground">{Math.round(pctOf(z) * 100)}%</b>).
          </>
        )}
      </p>
      <div className="divide-y">
        {rows.map((c) => {
          const zc = Math.max(-3, Math.min(3, c.z));
          const width = (Math.abs(zc) / 3) * 50;
          return (
            <div key={c.metric} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[13rem_3.5rem_minmax(0,1fr)_5rem]">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{c.label}</div>
                <div className="font-mono text-[0.65rem] text-muted-foreground">{c.value === null ? "no data yet" : `${fmtNum(c.value)} · ${c.games} games`}</div>
              </div>
              <div className="text-right font-display text-xl font-extrabold tabular-nums sm:text-left">{Math.round(c.weight * 100)}%</div>
              <div className="relative col-span-2 h-2.5 rounded-full bg-foreground/[0.06] sm:col-span-1">
                <span className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
                <span
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: zc >= 0 ? "50%" : `${50 - width}%`,
                    width: `${width}%`,
                    backgroundColor: `hsl(var(${zc >= 0 ? "--win" : "--loss"}))`,
                  }}
                />
              </div>
              <div className="hidden text-right font-mono text-xs sm:block">
                <span className={c.z >= 0 ? "text-win" : "text-loss"}>{c.z >= 0 ? "+" : ""}{c.z.toFixed(2)}</span>
                <span className="ml-1 text-muted-foreground">{Math.round(pctOf(c.z) * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        Weight = share of the overall · bar = standard deviations vs role peers · % = share of peers beaten
      </p>
    </div>
  );
}

function NextUnlocks({ insight }: { insight: P }) {
  const next = insight.keywords.next.slice(0, 6);
  if (next.length === 0) return <p className="font-serif text-lg italic text-muted-foreground">Nothing close — every nearby ladder is already climbed.</p>;
  return (
    <div className="panel divide-y">
      {next.map((n) => (
        <div key={n.keyword.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <KeywordChip keyword={n.keyword} size="sm" locked />
            <span className="font-mono text-xs text-muted-foreground">
              {fmtNum(n.value)} / {n.target}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Meter value={n.pct} max={1} tone={`r-${n.keyword.rarity}`} />
            <span className="w-10 shrink-0 text-right font-mono text-xs">{Math.floor(n.pct * 100)}%</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{n.keyword.description}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

function Matches({ timeline }: { timeline: TimelinePoint[] }) {
  const rows = [...timeline].reverse();
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b text-left">
              {["Date", "Opponent", "Result", "Competition", "Role", "G", "A", "Rating", ""].map((h) => (
                <th key={h} className="eyebrow px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.matchId} className={cn("border-b last:border-0 transition-colors hover:bg-elevated/50", t.motm && "bg-motm/[0.05]")}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{fmtDate(t.date, { day: "2-digit", month: "short", year: "2-digit" })}</td>
                <td className="px-4 py-3">
                  <Link href={`/matches/${t.matchId}`} className="font-semibold hover:text-primary">
                    <span className="mr-1.5 font-mono text-[0.65rem] text-muted-foreground">{t.venue === "AWAY" ? "@" : t.venue === "NEUTRAL" ? "N" : "vs"}</span>
                    {t.opponent}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <ResultBadge result={t.result} />
                    {t.goalsFor !== null && <span className="font-display text-lg font-extrabold tabular-nums">{t.goalsFor}–{t.goalsAgainst}</span>}
                  </span>
                </td>
                <td className="max-w-[10rem] truncate px-4 py-3 text-xs text-muted-foreground">{t.competitionName ?? "Friendly"}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                  {t.started ? "XI" : "SUB"}
                  {t.minutes !== null && ` · ${t.minutes}′`}
                </td>
                <td className={cn("px-4 py-3 font-display text-lg font-extrabold tabular-nums", t.goals ? "text-goals" : "text-muted-foreground/40")}>{t.goals}</td>
                <td className={cn("px-4 py-3 font-display text-lg font-extrabold tabular-nums", t.assists ? "text-assists" : "text-muted-foreground/40")}>{t.assists}</td>
                <td className="px-4 py-3"><RatingPill rating={t.rating} size="sm" /></td>
                <td className="px-4 py-3">{t.motm && <Star className="h-4 w-4 fill-motm text-motm" aria-label="Man of the match" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Splits
// ---------------------------------------------------------------------------

function SplitTable({ title, rows, note, limit }: { title: string; rows: SplitLine[]; note?: string; limit?: number }) {
  if (rows.length === 0) return null;
  const shown = limit ? rows.slice(0, limit) : rows;
  const maxApps = Math.max(...rows.map((r) => r.apps));
  return (
    <section>
      <SectionHeading title={title} note={note} />
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b text-left">
              {["", "Apps", "G", "A", "MOTM", "Avg", "W-D-L"].map((h) => (
                <th key={h} className="eyebrow px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.key} className="border-b last:border-0">
                <td className="relative px-4 py-2.5 font-semibold">
                  <span className="absolute inset-y-1 left-0 rounded-r bg-primary/10" style={{ width: `${(r.apps / maxApps) * 100}%` }} />
                  <span className="relative">{r.label}</span>
                </td>
                <td className="px-4 py-2.5 font-mono tabular-nums">{r.apps}</td>
                <td className="px-4 py-2.5 font-mono tabular-nums text-goals">{r.goals}</td>
                <td className="px-4 py-2.5 font-mono tabular-nums text-assists">{r.assists}</td>
                <td className="px-4 py-2.5 font-mono tabular-nums text-motm">{r.motm || ""}</td>
                <td className="px-4 py-2.5"><RatingPill rating={r.avgRating} size="sm" /></td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">
                  <span className="text-win">{r.wins}</span>-<span className="text-draw">{r.draws}</span>-<span className="text-loss">{r.losses}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Splits({ insight }: { insight: P }) {
  const p = insight.profile;
  const byApps = (rows: SplitLine[]) => [...rows].sort((a, b) => b.apps - a.apps || b.goals - a.goals);
  const results: ("W" | "D" | "L")[] = ["W", "D", "L"];
  const resultCount = { W: p.record.wins, D: p.record.draws, L: p.record.losses };
  return (
    <div className="space-y-12">
      <section>
        <SectionHeading title="By result" note="how they play when the team wins, draws, loses" />
        <div className="grid gap-3 sm:grid-cols-3">
          {results.map((r) => (
            <div key={r} className="panel flex items-center gap-4 p-5">
              <ResultBadge result={r} className="h-12 w-12 text-2xl" />
              <div className="grid flex-1 grid-cols-3 gap-2">
                <Stat label="Games" value={resultCount[r]} size="sm" />
                <Stat label="Goals" value={p.record.goalsByResult[r]} size="sm" tone="goals" />
                <Stat label="Avg" value={fmtRating(p.record.ratingByResult[r])} size="sm" tone="rating" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-12 lg:grid-cols-2">
        <SplitTable title="Home & away" rows={p.splits.venue} />
        <SplitTable title="Starter vs sub" rows={p.splits.role} />
        <SplitTable title="Competitions" rows={byApps(p.splits.competition)} />
        <SplitTable title="Seasons" rows={[...p.splits.season].sort((a, b) => b.key.localeCompare(a.key))} />
        <SplitTable title="Opponents" rows={byApps(p.splits.opponent)} note="most-faced first" limit={12} />
        <SplitTable title="Day of week" rows={p.splits.weekday} />
      </div>
      <SplitTable title="Month by month" rows={[...p.splits.month].sort((a, b) => b.key.localeCompare(a.key))} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keywords
// ---------------------------------------------------------------------------

function Keywords({ insight }: { insight: P }) {
  const { keywords } = insight;
  const byFamily = new Map<Family, Keyword[]>();
  for (const k of keywords.unlocked) {
    const list = byFamily.get(k.family) ?? [];
    list.push(k);
    byFamily.set(k.family, list);
  }
  const families = [...byFamily.entries()].sort((a, b) => Math.max(...b[1].map((k) => rarityRank(k.rarity))) - Math.max(...a[1].map((k) => rarityRank(k.rarity))) || b[1].length - a[1].length);
  const fixed = keywords.unlocked.filter((k) => !k.dynamic).length;

  return (
    <div className="space-y-12">
      <section className="grid gap-3 sm:grid-cols-[1.4fr_repeat(5,1fr)]">
        <div className="panel stripe-bg p-5">
          <div className="eyebrow">Unlocked</div>
          <div className="numeral mt-1 text-6xl">{keywords.unlocked.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {fixed} of {KEYWORD_CATALOGUE.length} codex keywords · {keywords.unlocked.length - fixed} unique honours
          </div>
        </div>
        {RARITIES.map((r) => (
          <div key={r} className="panel p-5" style={{ borderColor: `hsl(var(--r-${r}) / 0.35)` }}>
            <div className="eyebrow flex items-center gap-1.5"><RarityDot rarity={r} /> {RARITY_LABEL[r]}</div>
            <div className={cn("numeral mt-2 text-5xl", r === "mythic" && keywords.counts[r] > 0 && "mythic-text")} style={r !== "mythic" ? { color: `hsl(var(--r-${r}))` } : undefined}>
              {keywords.counts[r]}
            </div>
          </div>
        ))}
      </section>

      <section>
        <SectionHeading title="Within reach" note="the next rungs on each ladder" action={<Link href="/keywords" className="eyebrow hover:text-foreground">Full codex →</Link>} />
        <NextUnlocks insight={insight} />
      </section>

      {families.map(([fam, list]) => (
        <section key={fam}>
          <SectionHeading title={FAMILY_LABELS[fam]} note={`${list.length} earned`} />
          <div className="flex flex-wrap gap-2">
            {[...list].sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity)).map((k) => (
              <KeywordChip key={k.id} keyword={k} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

function PerformanceCard({ t, rank }: { t: TimelinePoint; rank?: number }) {
  return (
    <Link href={`/matches/${t.matchId}`} className="panel panel-hover group flex flex-col p-5">
      <div className="flex items-start justify-between">
        <span className="font-mono text-xs text-primary">{rank ? `#${rank}` : ""}</span>
        <RatingPill rating={t.rating} size="lg" />
      </div>
      <div className="mt-4 font-display text-2xl font-extrabold uppercase leading-none">
        {t.venue === "AWAY" ? "@ " : "vs "}
        {t.opponent}
      </div>
      <div className="mt-1 font-mono text-xs text-muted-foreground">
        {fmtDate(t.date)} {t.goalsFor !== null && `· ${t.goalsFor}–${t.goalsAgainst}`}
      </div>
      <div className="mt-auto flex gap-4 pt-4 font-display text-xl font-extrabold">
        <span className={t.goals ? "text-goals" : "text-muted-foreground/40"}>{t.goals}G</span>
        <span className={t.assists ? "text-assists" : "text-muted-foreground/40"}>{t.assists}A</span>
        {t.motm && <span className="text-motm">★</span>}
        <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">score {t.matchScore}</span>
      </div>
    </Link>
  );
}

function Records({ insight }: { insight: P }) {
  const p = insight.profile;
  const firsts: [string, TimelinePoint | null][] = [
    ["Debut", p.firsts.debut],
    ["First goal", p.firsts.firstGoal],
    ["First assist", p.firsts.firstAssist],
    ["First MOTM", p.firsts.firstMotm],
    ["Latest", p.firsts.latest],
  ];
  const hauls = [
    { l: "1 goal", v: p.hauls.goals.one, t: "goals" },
    { l: "Braces", v: p.hauls.goals.two, t: "goals" },
    { l: "Hat-tricks", v: p.hauls.goals.three, t: "goals" },
    { l: "4 goals", v: p.hauls.goals.four, t: "goals" },
    { l: "5+ goals", v: p.hauls.goals.fivePlus, t: "goals" },
    { l: "1 assist", v: p.hauls.assists.one, t: "assists" },
    { l: "2 assists", v: p.hauls.assists.two, t: "assists" },
    { l: "3 assists", v: p.hauls.assists.three, t: "assists" },
    { l: "4+ assists", v: p.hauls.assists.fourPlus, t: "assists" },
    { l: "Goal + assist", v: p.hauls.fullPackage, t: "primary" },
    { l: "3+ G/A", v: p.hauls.gaHauls, t: "primary" },
    { l: "Blanks", v: p.hauls.blanks, t: "muted-foreground" },
  ];
  return (
    <div className="space-y-12">
      <section>
        <SectionHeading title="Greatest hits" note="ranked by match score: rating, goals, assists, MOTM" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {p.bestPerformances.map((t, i) => (
            <PerformanceCard key={t.matchId} t={t} rank={i + 1} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Hauls" note="matches by exact output" />
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius)] border bg-border sm:grid-cols-6">
          {hauls.map((h) => (
            <div key={h.l} className="bg-card p-4">
              <div className="eyebrow">{h.l}</div>
              <div className="numeral mt-1.5 text-4xl" style={{ color: h.v ? `hsl(var(--${h.t}))` : undefined }}>{h.v}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <SectionHeading title="Personal bests" />
          <div className="panel grid grid-cols-2 gap-6 p-5 sm:grid-cols-3">
            <Stat label="Goals in a match" value={p.bests.matchGoals} tone="goals" size="sm" />
            <Stat label="Assists in a match" value={p.bests.matchAssists} tone="assists" size="sm" />
            <Stat label="G+A in a match" value={p.bests.matchGA} tone="primary" size="sm" />
            <Stat label="Goals in a season" value={p.bests.seasonGoals} tone="goals" size="sm" />
            <Stat label="Assists in a season" value={p.bests.seasonAssists} tone="assists" size="sm" />
            <Stat label="MOTM in a season" value={p.bests.seasonMotm} tone="motm" size="sm" />
            <Stat label="Goals in a month" value={p.bests.monthGoals} size="sm" />
            <Stat label="One-goal winners" value={p.record.matchWinners} size="sm" sub="scored in 1-goal wins" />
            <Stat label="Bounce-backs" value={p.bounceBacks} size="sm" sub="+2 rating on last game" />
            <Stat label="Super-sub" value={`${p.superSub.goals}G ${p.superSub.assists}A`} size="sm" sub={`${p.superSub.motm} MOTM off the bench`} />
            <Stat label="Silent 9s" value={p.silentMaestro} size="sm" sub="9+ without G/A" />
            <Stat label="Clean sheets" value={p.defence.cleanSheets} size="sm" sub={`best run ${p.streaks.cleanSheet.best}`} />
            <Stat label="Conceded / game" value={fmtNum(p.defence.concededPerApp)} size="sm" sub={`${p.defence.games} games on the pitch`} />
            <Stat label="Opponents scored v" value={`${p.distinct.opponentsScoredAgainst}/${p.distinct.opponents}`} size="sm" />
          </div>
        </section>
        <section>
          <SectionHeading title="Firsts & lasts" />
          <div className="panel divide-y">
            {firsts.map(([label, t]) => (
              <div key={label} className="flex items-center gap-4 p-4">
                <span className="eyebrow w-24 shrink-0">{label}</span>
                {t ? (
                  <Link href={`/matches/${t.matchId}`} className="flex min-w-0 flex-1 items-center gap-3 hover:text-primary">
                    <span className="truncate font-semibold">{t.venue === "AWAY" ? "@ " : "vs "}{t.opponent}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{fmtDate(t.date)}</span>
                    <RatingPill rating={t.rating} size="sm" className="ml-auto" />
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">Not yet</span>
                )}
              </div>
            ))}
          </div>
          {p.worstPerformance && p.worstPerformance.rating !== null && (
            <p className="mt-4 text-xs text-muted-foreground">
              Toughest day: {fmtRating(p.worstPerformance.rating)} vs {p.worstPerformance.opponent} on {fmtDate(p.worstPerformance.date)}.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
