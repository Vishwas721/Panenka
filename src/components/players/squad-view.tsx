"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownWideNarrow, LayoutGrid, Rows3, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayerCard, type PlayerCardData } from "@/components/pk/player-card";
import { Masthead, EmptyState, KeywordChip, PlayerAvatar, RatingPill, RarityDot } from "@/components/pk/kit";
import { fmtNum, fmtRating, POSITION_SHORT } from "@/components/pk/format";
import { CARD_TIERS } from "@/lib/stats/attributes";
import type { Keyword } from "@/lib/stats/keywords";
import { PlayerFormDialog } from "./player-form-dialog";

export interface SquadRow {
  card: PlayerCardData;
  archived: boolean;
  team: string | null;
  gaPerApp: number | null;
  last5: number | null;
  keywordCount: number;
  topKeyword: Keyword | null;
}

type SortKey = "ovr" | "rating" | "goals" | "assists" | "motm" | "apps" | "form" | "name";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "ovr", label: "OVR" },
  { key: "rating", label: "Rating" },
  { key: "form", label: "Form" },
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "motm", label: "MOTM" },
  { key: "apps", label: "Apps" },
  { key: "name", label: "Name" },
];

const LINES = [
  { key: "ALL", label: "All", positions: null },
  { key: "ATT", label: "Attack", positions: ["ST", "LW", "RW"] },
  { key: "MID", label: "Midfield", positions: ["CAM", "CM", "CDM"] },
  { key: "DEF", label: "Defence", positions: ["CB", "LB", "RB"] },
  { key: "GK", label: "Keepers", positions: ["GK"] },
] as const;

const sortValue = (r: SquadRow, k: SortKey): number | null => {
  switch (k) {
    case "ovr": return r.card.ovr;
    case "rating": return r.card.avgRating;
    case "form": return r.last5;
    case "goals": return r.card.goals;
    case "assists": return r.card.assists;
    case "motm": return r.card.motm;
    case "apps": return r.card.apps;
    default: return null;
  }
};

const VIEW_KEY = "panenka.squad.view";

export function SquadView({ rows, defaultTeam }: { rows: SquadRow[]; defaultTeam: string | null }) {
  const [query, setQuery] = React.useState("");
  const [line, setLine] = React.useState<(typeof LINES)[number]["key"]>("ALL");
  const [sort, setSort] = React.useState<SortKey>("ovr");
  const [showArchived, setShowArchived] = React.useState(false);
  const [view, setView] = React.useState<"grid" | "table">("grid");

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "grid" || v === "table") setView(v);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const changeView = (v: "grid" | "table") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* storage unavailable */
    }
  };

  const active = rows.filter((r) => !r.archived);
  const archivedCount = rows.length - active.length;

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const positions = LINES.find((l) => l.key === line)!.positions as readonly string[] | null;
    return rows
      .filter((r) => showArchived || !r.archived)
      .filter((r) => !positions || positions.includes(r.card.position))
      .filter((r) => !q || `${r.card.fullName} ${r.card.displayName ?? ""} ${r.card.squadNumber ?? ""} ${r.team ?? ""} ${r.card.archetype?.name ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "name") return a.card.fullName.localeCompare(b.card.fullName);
        const va = sortValue(a, sort);
        const vb = sortValue(b, sort);
        if (va === null && vb === null) return a.card.fullName.localeCompare(b.card.fullName);
        if (va === null) return 1;
        if (vb === null) return -1;
        return vb - va || b.card.apps - a.card.apps || a.card.fullName.localeCompare(b.card.fullName);
      });
  }, [rows, query, line, sort, showArchived]);

  // Squad summary
  const rated = active.filter((r) => r.card.ovr !== null);
  const avgOvr = rated.length ? Math.round(rated.reduce((a, r) => a + (r.card.ovr ?? 0), 0) / rated.length) : null;
  const tierCounts = CARD_TIERS.map((t) => ({ tier: t, count: rated.filter((r) => r.card.tier.id === t.id).length })).reverse();

  const addButton = (
    <PlayerFormDialog
      defaultTeam={defaultTeam}
      trigger={
        <Button>
          <UserPlus /> Sign player
        </Button>
      }
    />
  );

  if (rows.length === 0) {
    return (
      <>
        <Masthead kicker="Squad" title="The Squad" accent="empty dressing room" />
        <EmptyState title="No players yet" action={addButton}>
          Sign your first player, then log a match with their rating, goals, assists and man of the match — the cards build themselves.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <Masthead
        kicker={
          <>
            <span>Squad</span>
            <span className="text-border">/</span>
            <span>{active.length} registered{archivedCount ? ` · ${archivedCount} archived` : ""}</span>
          </>
        }
        title="The Squad"
        accent={`${active.length} cards`}
        actions={addButton}
      >
        Every card is printed from match data: overall, six attributes and the keywords each player has earned.
      </Masthead>

      {/* Squad strength strip */}
      <section className="panel rise mb-8 grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
        <div className="flex items-end gap-6">
          <div>
            <div className="eyebrow">Squad OVR</div>
            <div className="numeral mt-1 text-6xl text-primary">{avgOvr ?? "—"}</div>
          </div>
          <div>
            <div className="eyebrow">Rated</div>
            <div className="numeral mt-1 text-6xl">
              {rated.length}
              <span className="text-2xl text-muted-foreground">/{active.length}</span>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="eyebrow mb-2">Card tiers</div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
            {tierCounts.map(({ tier, count }) =>
              count ? (
                <div key={tier.id} className={cn("pcard h-full !transform-none", `tier-${tier.id}`)} style={{ width: `${(count / Math.max(1, rated.length)) * 100}%`, clipPath: "none" }} title={`${tier.name}: ${count}`} />
              ) : null,
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {tierCounts.map(({ tier, count }) => (
              <span key={tier.id} className={cn("font-mono text-[0.65rem] uppercase tracking-[0.12em]", count ? "text-foreground" : "text-muted-foreground/60")}>
                {tier.name} <b className="tabular-nums">{count}</b>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-[6.6rem] z-30 -mx-4 mb-6 border-y bg-background/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative xl:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, number, archetype…" className="pl-9" aria-label="Search squad" />
          </div>
          <div className="scrollbar-none flex items-center gap-1 overflow-x-auto">
            {LINES.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLine(l.key)}
                aria-pressed={line === l.key}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] transition-colors",
                  line === l.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 xl:ml-auto">
            <ArrowDownWideNarrow className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort by"
              className="h-9 rounded-full border bg-background/60 px-3 font-mono text-[0.7rem] uppercase tracking-[0.1em] outline-none focus:border-primary"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
            {archivedCount > 0 && (
              <label className="flex cursor-pointer items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-[hsl(var(--primary))]" />
                Archived
              </label>
            )}
            <div className="ml-auto inline-flex rounded-full border p-0.5 xl:ml-2">
              <button type="button" onClick={() => changeView("grid")} aria-pressed={view === "grid"} aria-label="Card view" className={cn("grid h-8 w-8 place-items-center rounded-full", view === "grid" ? "bg-foreground text-background" : "text-muted-foreground")}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => changeView("table")} aria-pressed={view === "table"} aria-label="Table view" className={cn("grid h-8 w-8 place-items-center rounded-full", view === "table" ? "bg-foreground text-background" : "text-muted-foreground")}>
                <Rows3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Nobody fits">Try another search, line or the archived toggle.</EmptyState>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {visible.map((r, i) => (
            <li key={r.card.id} className="rise min-w-0" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
              <div className={cn(r.archived && "opacity-50 grayscale")}>
                <PlayerCard data={r.card} href={`/players/${r.card.id}`} />
              </div>
              <div className="mt-2.5 flex min-w-0 items-center justify-between gap-2 px-0.5">
                {r.topKeyword ? <KeywordChip keyword={r.topKeyword} size="sm" className="min-w-0" /> : <span className="eyebrow">No keywords yet</span>}
                <span className="shrink-0 font-mono text-[0.62rem] text-muted-foreground" title="Keywords unlocked">
                  {r.keywordCount} kw
                </span>
              </div>
              {r.archived && <div className="eyebrow mt-1 px-0.5">Archived</div>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b text-left">
                {["#", "Player", "Pos", "OVR", "Avg", "Form", "Apps", "G", "A", "★", "G+A/app", "Signature"].map((h) => (
                  <th key={h} className="eyebrow whitespace-nowrap px-3 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={r.card.id} className={cn("border-b last:border-0 transition-colors hover:bg-elevated/50", r.archived && "opacity-50")}>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/players/${r.card.id}`} className="flex items-center gap-2.5 hover:text-primary">
                      <PlayerAvatar name={r.card.fullName} imageUrl={r.card.imageUrl} number={r.card.squadNumber} className="h-8 w-8 text-xs" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{r.card.fullName}</span>
                        <span className="block truncate font-serif text-xs italic text-muted-foreground">{r.card.archetype?.name ?? r.team ?? ""}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{POSITION_SHORT(r.card.position)}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className={cn("pcard h-3 w-3 !transform-none", `tier-${r.card.tier.id}`)} style={{ clipPath: "none", borderRadius: 2 }} title={r.card.tier.name} />
                      <span className="numeral text-2xl">{r.card.ovr ?? "—"}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5"><RatingPill rating={r.card.avgRating} size="sm" /></td>
                  <td className="px-3 py-2.5 font-mono text-xs">{fmtRating(r.last5)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{r.card.apps}</td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums text-goals">{r.card.goals}</td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums text-assists">{r.card.assists}</td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums text-motm">{r.card.motm}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{fmtNum(r.gaPerApp)}</td>
                  <td className="max-w-[14rem] px-3 py-2.5">
                    {r.topKeyword ? (
                      <span className="flex items-center gap-1.5 truncate text-xs">
                        <RarityDot rarity={r.topKeyword.rarity} /> {r.topKeyword.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
