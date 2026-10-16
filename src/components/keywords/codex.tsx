"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Lock, Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FAMILY_LABELS,
  RARITIES,
  rarityRank,
  type DynamicTemplate,
  type Family,
  type KeywordDef,
  type Rarity,
} from "@/lib/stats/keywords";
import { FAMILY_ICONS, RARITY_LABEL, PlayerAvatar, SectionHeading, KeywordChip } from "@/components/pk/kit";

export interface Owner {
  id: string;
  name: string;
  fullName: string;
  imageUrl: string | null;
}

export interface DynamicInstance {
  id: string;
  template: string;
  name: string;
  description: string;
  rarity: Rarity;
  family: Family;
  owners: Owner[];
}

type Status = "all" | "owned" | "locked";

function OwnerStack({ owners, max = 4 }: { owners: Owner[]; max?: number }) {
  if (owners.length === 0) return null;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {owners.slice(0, max).map((o) => (
          <Link key={o.id} href={`/players/${o.id}`} title={o.fullName} className="rounded-full ring-2 ring-card transition-transform hover:z-10 hover:-translate-y-0.5">
            <PlayerAvatar name={o.fullName} imageUrl={o.imageUrl} className="h-6 w-6 text-[0.5rem]" />
          </Link>
        ))}
      </div>
      {owners.length > max && <span className="ml-1.5 font-mono text-[0.65rem] text-muted-foreground">+{owners.length - max}</span>}
    </div>
  );
}

const KeywordTile = React.memo(function KeywordTile({ k, owners, squadSize }: { k: KeywordDef; owners: Owner[]; squadSize: number }) {
  const Icon = FAMILY_ICONS[k.family];
  const owned = owners.length > 0;
  const v = `--r-${k.rarity}`;
  return (
    <div
      className={cn("relative flex flex-col overflow-hidden rounded-md border p-3.5 transition-colors", owned ? "bg-card" : "bg-card/40")}
      style={{ borderColor: owned ? `hsl(var(${v}) / 0.45)` : undefined, boxShadow: owned && rarityRank(k.rarity) >= 3 ? `0 0 24px -12px hsl(var(${v}))` : undefined }}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: `hsl(var(${v}) / ${owned ? 1 : 0.35})` }} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md" style={{ backgroundColor: `hsl(var(${v}) / 0.12)`, color: `hsl(var(${v}))` }}>
            {owned ? <Icon className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
          </span>
          <span className={cn("truncate font-display text-[1.05rem] font-extrabold uppercase leading-tight tracking-wide", !owned && "text-muted-foreground", owned && k.rarity === "mythic" && "mythic-text")}>{k.name}</span>
        </div>
        <span className="shrink-0 font-mono text-[0.58rem] uppercase tracking-[0.14em]" style={{ color: `hsl(var(${v}))` }}>
          {RARITY_LABEL[k.rarity]}
        </span>
      </div>
      <p className="mt-2 text-[0.8rem] leading-snug text-muted-foreground">{k.description}</p>
      <div className="mt-3 flex min-h-6 items-center justify-between">
        <OwnerStack owners={owners} />
        <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground">
          {owned ? `${owners.length}/${squadSize} own` : "Unclaimed"}
        </span>
      </div>
    </div>
  );
});

export function Codex({
  catalogue,
  players,
  ownerIds,
  templates,
  instances,
  squadSize,
}: {
  catalogue: KeywordDef[];
  /** Owner details keyed by player id, sent once instead of per keyword. */
  players: Record<string, Owner>;
  ownerIds: Record<string, string[]>;
  templates: DynamicTemplate[];
  instances: DynamicInstance[];
  squadSize: number;
}) {
  const owners = React.useMemo(() => {
    const out: Record<string, Owner[]> = {};
    for (const [kw, ids] of Object.entries(ownerIds)) out[kw] = ids.map((id) => players[id]!).filter(Boolean);
    return out;
  }, [ownerIds, players]);
  const [query, setQuery] = React.useState("");
  const [rarities, setRarities] = React.useState<Set<Rarity>>(new Set());
  const [status, setStatus] = React.useState<Status>("all");
  const [family, setFamily] = React.useState<Family | "all">("all");
  const deferred = React.useDeferredValue(query);

  const totals = React.useMemo(() => {
    const t = Object.fromEntries(RARITIES.map((r) => [r, { all: 0, owned: 0 }])) as Record<Rarity, { all: number; owned: number }>;
    for (const k of catalogue) {
      t[k.rarity].all++;
      if (owners[k.id]?.length) t[k.rarity].owned++;
    }
    return t;
  }, [catalogue, owners]);

  const families = React.useMemo(() => [...new Set(catalogue.map((k) => k.family))], [catalogue]);

  const groups = React.useMemo(() => {
    const q = deferred.trim().toLowerCase();
    const list = catalogue.filter((k) => {
      if (rarities.size && !rarities.has(k.rarity)) return false;
      if (family !== "all" && k.family !== family) return false;
      const owned = (owners[k.id]?.length ?? 0) > 0;
      if (status === "owned" && !owned) return false;
      if (status === "locked" && owned) return false;
      if (q && !k.name.toLowerCase().includes(q) && !k.description.toLowerCase().includes(q) && !FAMILY_LABELS[k.family].toLowerCase().includes(q)) return false;
      return true;
    });
    const map = new Map<Family, KeywordDef[]>();
    for (const k of list) {
      const arr = map.get(k.family) ?? [];
      arr.push(k);
      map.set(k.family, arr);
    }
    return { count: list.length, groups: [...map.entries()] };
  }, [catalogue, owners, deferred, rarities, status, family]);

  const filteredInstances = React.useMemo(() => {
    const q = deferred.trim().toLowerCase();
    return instances
      .filter((i) => (!rarities.size || rarities.has(i.rarity)) && (!q || i.name.toLowerCase().includes(q)))
      .sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity) || a.name.localeCompare(b.name));
  }, [instances, deferred, rarities]);

  const toggleRarity = (r: Rarity) =>
    setRarities((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });

  return (
    <div className="space-y-14">
      {/* Rarity totals — also the rarity filter */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {RARITIES.map((r) => {
          const on = rarities.has(r);
          const t = totals[r];
          return (
            <button
              key={r}
              type="button"
              onClick={() => toggleRarity(r)}
              aria-pressed={on}
              className={cn("panel group p-4 text-left transition-all", on && "ring-2", r === "mythic" && "col-span-2 sm:col-span-1")}
              style={{ ["--tw-ring-color" as string]: `hsl(var(--r-${r}))` }}
            >
              <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: `hsl(var(--r-${r}))` }} />
              <div className="eyebrow" style={{ color: `hsl(var(--r-${r}))` }}>
                {RARITY_LABEL[r]}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={cn("numeral text-5xl", r === "mythic" && "mythic-text")}>{t.owned}</span>
                <span className="font-display text-xl font-bold text-muted-foreground">/ {t.all}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
                <div className="h-full rounded-full" style={{ width: `${t.all ? (t.owned / t.all) * 100 : 0}%`, backgroundColor: `hsl(var(--r-${r}))` }} />
              </div>
            </button>
          );
        })}
      </section>

      {/* Controls */}
      <section className="sticky top-[6.6rem] z-30 -mx-4 border-y bg-background/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 500+ keywords…"
              className="h-10 w-full rounded-full border border-input bg-background/60 pl-10 pr-4 text-sm focus-visible:border-primary"
              aria-label="Search keywords"
            />
          </label>
          <div className="flex gap-2">
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value as Family | "all")}
              className="h-10 min-w-0 flex-1 rounded-full border border-input bg-background/60 px-4 font-mono text-xs uppercase tracking-wider"
              aria-label="Family"
            >
              <option value="all">All families</option>
              {families.map((f) => (
                <option key={f} value={f}>
                  {FAMILY_LABELS[f]}
                </option>
              ))}
            </select>
            <div className="flex shrink-0 rounded-full border p-0.5">
              {(["all", "owned", "locked"] as Status[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn("rounded-full px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-wider transition-colors", status === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="eyebrow mt-2">
          {groups.count} keyword{groups.count === 1 ? "" : "s"} shown
          {rarities.size > 0 && (
            <button type="button" className="ml-3 text-primary hover:underline" onClick={() => setRarities(new Set())}>
              clear rarity
            </button>
          )}
        </div>
      </section>

      {/* Catalogue by family */}
      {groups.groups.length === 0 ? (
        <p className="py-16 text-center font-serif text-xl italic text-muted-foreground">No keyword matches that.</p>
      ) : (
        groups.groups.map(([fam, list], gi) => {
          const Icon = FAMILY_ICONS[fam];
          const ownedHere = list.filter((k) => owners[k.id]?.length).length;
          return (
            <section key={fam}>
              <SectionHeading
                index={String(gi + 1).padStart(2, "0")}
                title={
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                    {FAMILY_LABELS[fam]}
                  </span>
                }
                note={`${ownedHere} of ${list.length} claimed`}
              />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {list.map((k) => (
                  <KeywordTile key={k.id} k={k} owners={owners[k.id] ?? []} squadSize={squadSize} />
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* Dynamic */}
      <section className="panel stripe-bg overflow-hidden p-5 sm:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow flex items-center gap-2 text-primary">
              <InfinityIcon className="h-4 w-4" /> Dynamic keywords
            </div>
            <h2 className="mt-2 font-display text-5xl font-black uppercase leading-none">Endless honours</h2>
            <p className="mt-2 max-w-xl font-serif text-lg italic text-muted-foreground">
              Minted on the fly for every opponent, competition, weekday, season and month you log.
            </p>
          </div>
          <div className="text-right">
            <div className="numeral text-6xl text-primary">{instances.length}</div>
            <div className="eyebrow">earned so far</div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const earned = filteredInstances.filter((i) => i.template === t.id);
            const Icon = FAMILY_ICONS[t.family];
            return (
              <div key={t.id} className="rounded-md border bg-card/80 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: `hsl(var(--r-${t.rarity}))` }} />
                    <span className="truncate font-display text-lg font-extrabold uppercase tracking-wide">{t.pattern}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[0.58rem] uppercase tracking-[0.14em]" style={{ color: `hsl(var(--r-${t.rarity}))` }}>
                    {RARITY_LABEL[t.rarity]}
                    {t.squad && " · squad"}
                  </span>
                </div>
                <p className="mt-1 text-[0.8rem] text-muted-foreground">{t.description}</p>
                {earned.length > 0 ? (
                  <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto pr-1">
                    {earned.map((i) => (
                      <li key={i.id} className="flex items-center justify-between gap-2">
                        <KeywordChip keyword={i} size="sm" className="min-w-0" />
                        <OwnerStack owners={i.owners} max={3} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground/70">None earned yet</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
