import Link from "next/link";
import type { PlayerInsight } from "@/server/services/insights.service";
import { rarityRank, type Keyword, type KeywordProgress } from "@/lib/stats/keywords";
import { KeywordChip, Meter, RARITY_LABEL } from "@/components/pk/kit";
import { shortName } from "@/components/pk/format";

export interface RareKeyword {
  keyword: Keyword;
  owners: PlayerInsight[];
}

/** Rarest keywords unlocked across the squad: highest rarity first, then fewest owners. */
export function rarestKeywords(squad: PlayerInsight[], limit = 12): RareKeyword[] {
  const map = new Map<string, RareKeyword>();
  for (const i of squad) {
    for (const k of i.keywords.signature) {
      const entry = map.get(k.id) ?? { keyword: k, owners: [] };
      entry.owners.push(i);
      map.set(k.id, entry);
    }
  }
  return [...map.values()]
    .sort(
      (a, b) =>
        rarityRank(b.keyword.rarity) - rarityRank(a.keyword.rarity) ||
        a.owners.length - b.owners.length ||
        a.keyword.name.localeCompare(b.keyword.name),
    )
    .slice(0, limit);
}

export function RareKeywords({ items }: { items: RareKeyword[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Keywords unlock as players log appearances.</p>;
  }
  return (
    <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(({ keyword, owners }) => (
        <li key={keyword.id} className="flex min-w-0 items-center gap-3">
          <KeywordChip keyword={keyword} className="shrink-0" />
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-[0.12em]" style={{ color: `hsl(var(--r-${keyword.rarity}))` }}>
              {RARITY_LABEL[keyword.rarity]}
            </span>
            {" · "}
            {owners.slice(0, 2).map((o, i) => (
              <span key={o.player.id}>
                {i > 0 && ", "}
                <Link href={`/players/${o.player.id}`} className="text-foreground hover:underline">
                  {shortName(o.player)}
                </Link>
              </span>
            ))}
            {owners.length > 2 && ` +${owners.length - 2}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

export interface WatchItem {
  insight: PlayerInsight;
  progress: KeywordProgress;
}

/** The squad's keywords closest to unlocking. */
export function closestUnlocks(squad: PlayerInsight[], limit = 6): WatchItem[] {
  return squad
    .flatMap((insight) => insight.keywords.next.slice(0, 3).map((progress) => ({ insight, progress })))
    .filter((w) => w.progress.pct < 1)
    .sort(
      (a, b) =>
        b.progress.pct - a.progress.pct ||
        rarityRank(b.progress.keyword.rarity) - rarityRank(a.progress.keyword.rarity),
    )
    .slice(0, limit);
}

const fmtValue = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));

export function UnlockWatch({ items }: { items: WatchItem[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nothing on the horizon yet.</p>;
  return (
    <ul className="divide-y">
      {items.map(({ insight, progress }) => (
        <li key={`${insight.player.id}-${progress.keyword.id}`} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <Link href={`/players/${insight.player.id}`} className="min-w-0 truncate font-display text-lg font-extrabold uppercase leading-none hover:underline">
              {shortName(insight.player)}
            </Link>
            <KeywordChip keyword={progress.keyword} size="sm" locked className="shrink-0" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Meter value={progress.pct} tone={`r-${progress.keyword.rarity}`} />
            <span className="shrink-0 font-mono text-[0.68rem] tabular-nums text-muted-foreground">
              {fmtValue(progress.value)}
              {progress.lowerIsBetter ? " → ≤" : " / "}
              {fmtValue(progress.target)}
            </span>
          </div>
          <p className="mt-1 truncate text-[0.72rem] text-muted-foreground">{progress.keyword.description}</p>
        </li>
      ))}
    </ul>
  );
}
