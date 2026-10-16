"use client";

import * as React from "react";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FixtureSummary } from "@/server/services/team.service";
import { RatingPill, EmptyState } from "@/components/pk/kit";
import { resultVar } from "@/components/pk/format";
import { buttonVariants } from "@/components/ui/button";

type ResultFilter = "ALL" | "W" | "D" | "L" | "UPCOMING";

const RESULT_FILTERS: { id: ResultFilter; label: string; varName?: string }[] = [
  { id: "ALL", label: "All" },
  { id: "W", label: "Wins", varName: "--win" },
  { id: "D", label: "Draws", varName: "--draw" },
  { id: "L", label: "Losses", varName: "--loss" },
  { id: "UPCOMING", label: "Upcoming" },
];

function Ticket({ f }: { f: FixtureSummary }) {
  const d = new Date(f.date);
  const completed = f.status === "COMPLETED";
  const edge = completed ? `hsl(var(${resultVar(f.result)}))` : "hsl(var(--border))";
  return (
    <Link
      href={`/matches/${f.id}`}
      className="panel panel-hover group relative grid grid-cols-[4.5rem_1fr] overflow-hidden sm:grid-cols-[6.5rem_1fr_auto]"
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: edge }} />

      {/* Date stub, separated by a perforation */}
      <div className="relative flex flex-col items-center justify-center border-r border-dashed py-4 pl-1.5">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
          {d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
        </span>
        <span className="numeral text-4xl sm:text-5xl">{d.getUTCDate()}</span>
        <span className="font-mono text-[0.6rem] text-muted-foreground">{d.getUTCFullYear()}</span>
        <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full border bg-background" />
        <span className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border bg-background" />
      </div>

      {/* Body */}
      <div className="min-w-0 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="eyebrow">{f.competition ? `${f.competition.name}${f.competition.season ? ` ${f.competition.season}` : ""}` : "Friendly"}</span>
          {f.venue && (
            <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {f.venue === "HOME" ? "Home" : f.venue === "AWAY" ? "Away" : "Neutral"}
            </span>
          )}
          {f.status !== "COMPLETED" && (
            <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em]", f.status === "ABANDONED" ? "border-loss/40 text-loss" : "border-foreground/20 text-muted-foreground")}>
              {f.status === "ABANDONED" ? "Abandoned" : "Scheduled"}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-end gap-4">
          <h3 className="min-w-0 truncate font-display text-2xl font-black uppercase leading-none sm:text-[2.1rem]">
            <span className="mr-2 font-serif text-lg font-normal normal-case italic text-muted-foreground">{f.venue === "AWAY" ? "at" : "vs"}</span>
            {f.opponent}
          </h3>
        </div>

        {(f.scorers.length > 0 || f.motm) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8rem] text-muted-foreground">
            {f.scorers.length > 0 && (
              <span className="min-w-0">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-goals align-middle" />
                {f.scorers.map((s) => `${s.name}${s.goals > 1 ? ` ×${s.goals}` : ""}`).join(", ")}
              </span>
            )}
            {f.assisters.length > 0 && (
              <span className="hidden min-w-0 md:inline">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rotate-45 bg-assists align-middle" />
                {f.assisters.map((s) => `${s.name}${s.assists > 1 ? ` ×${s.assists}` : ""}`).join(", ")}
              </span>
            )}
            {f.motm && (
              <span className="inline-flex items-center gap-1 text-motm">
                <Star className="h-3 w-3 fill-motm" /> {f.motm.name}
              </span>
            )}
          </div>
        )}

        {/* Mobile scoreline */}
        <div className="mt-3 flex items-center gap-3 sm:hidden">
          <span className="numeral text-4xl" style={{ color: edge }}>
            {f.goalsFor ?? "–"}<span className="text-muted-foreground">:</span>{f.goalsAgainst ?? "–"}
          </span>
          {f.avgRating !== null && <RatingPill rating={f.avgRating} size="sm" />}
        </div>
      </div>

      {/* Scoreline */}
      <div className="hidden items-center gap-5 pr-6 sm:flex">
        {f.avgRating !== null && (
          <div className="text-right">
            <div className="eyebrow">Avg</div>
            <RatingPill rating={f.avgRating} className="mt-1" />
          </div>
        )}
        <div className="text-right">
          <div className="numeral text-[4.5rem]" style={{ color: completed ? edge : undefined }}>
            {f.goalsFor ?? "–"}
            <span className="mx-1 text-muted-foreground/50">:</span>
            {f.goalsAgainst ?? "–"}
          </div>
          {f.result && (
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em]" style={{ color: edge }}>
              {f.result === "W" ? "Won" : f.result === "L" ? "Lost" : "Drew"}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function FixturesList({ fixtures }: { fixtures: FixtureSummary[] }) {
  const [result, setResult] = React.useState<ResultFilter>("ALL");
  const [competition, setCompetition] = React.useState<string>("ALL");

  const competitions = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const f of fixtures) if (f.competition) m.set(f.competition.id, `${f.competition.name}${f.competition.season ? ` ${f.competition.season}` : ""}`);
    return [...m.entries()];
  }, [fixtures]);

  const filtered = fixtures.filter((f) => {
    if (competition !== "ALL" && (competition === "NONE" ? f.competition !== null : f.competition?.id !== competition)) return false;
    if (result === "ALL") return true;
    if (result === "UPCOMING") return f.status === "SCHEDULED";
    return f.result === result;
  });

  // Group by month for an almanac feel.
  const groups: { key: string; label: string; items: FixtureSummary[] }[] = [];
  for (const f of filtered) {
    const d = new Date(f.date);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }), items: [] };
      groups.push(g);
    }
    g.items.push(f);
  }

  if (fixtures.length === 0) {
    return (
      <EmptyState
        title="No fixtures yet"
        action={
          <Link href="/matches/new" className={buttonVariants({ size: "lg" })}>
            Log your first match
          </Link>
        }
      >
        Log a match to start building the almanac.
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1" role="group" aria-label="Filter by result">
          {RESULT_FILTERS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setResult(r.id)}
              aria-pressed={result === r.id}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
                result === r.id ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {r.varName && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `hsl(var(${r.varName}))` }} />}
              {r.label}
            </button>
          ))}
        </div>
        {competitions.length > 0 && (
          <label className="flex items-center gap-2">
            <span className="eyebrow">Competition</span>
            <select
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              className="h-9 rounded-full border bg-background/60 px-3 text-sm focus-visible:border-primary"
            >
              <option value="ALL">All competitions</option>
              {competitions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
              <option value="NONE">Friendlies & other</option>
            </select>
          </label>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="py-16 text-center font-serif text-xl italic text-muted-foreground">No fixtures match those filters.</p>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => {
            const w = g.items.filter((f) => f.result === "W").length;
            const dr = g.items.filter((f) => f.result === "D").length;
            const l = g.items.filter((f) => f.result === "L").length;
            return (
              <section key={g.key} aria-label={g.label}>
                <div className="mb-3 flex items-baseline justify-between gap-3 border-b pb-2">
                  <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide">{g.label}</h2>
                  <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                    <span className="text-win">{w}W</span> · <span>{dr}D</span> · <span className="text-loss">{l}L</span>
                  </span>
                </div>
                <div className="space-y-3">
                  {g.items.map((f) => (
                    <Ticket key={f.id} f={f} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
