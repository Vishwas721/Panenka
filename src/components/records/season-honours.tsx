import Link from "next/link";
import { Trophy } from "lucide-react";
import type { PlayerInsight } from "@/server/services/insights.service";
import type { SplitLine } from "@/lib/stats/profile";
import type { BallonRace } from "@/lib/stats/ballon-dor";
import { HONOUR_BY_ID, HONOURS, type HonourId, type SeasonHonours } from "@/lib/stats/honours";
import { cn } from "@/lib/utils";
import { PlayerAvatar, RarityDot, RatingPill } from "@/components/pk/kit";
import { fmtRating, POSITION_SHORT, shortName } from "@/components/pk/format";

const SQUAD_AWARDS = HONOURS.filter((h) => h.kind === "squad");

function fmtValue(id: HonourId, v: number) {
  if (id === "ballon-dor") return `${v.toFixed(1)} pts`;
  if (id === "best-rated" || id === "elite") return fmtRating(v);
  if (id === "mvp" || id === "star") return `${v} MOTM`;
  if (id === "playmaker") return `${v} A`;
  return `${v} G`;
}

interface SeasonRow {
  player: PlayerInsight;
  line: SplitLine;
}

function seasonRows(players: PlayerInsight[], key: string): SeasonRow[] {
  return players
    .map((player) => ({ player, line: player.profile.splits.season.find((s) => s.key === key) }))
    .filter((r): r is SeasonRow => !!r.line);
}

const RACES: { id: HonourId; value: (l: SplitLine) => number | null; tone: string }[] = [
  { id: "boot", value: (l) => l.goals, tone: "goals" },
  { id: "playmaker", value: (l) => l.assists, tone: "assists" },
  { id: "mvp", value: (l) => l.motm, tone: "motm" },
  { id: "best-rated", value: (l) => (l.apps >= 5 ? l.avgRating : null), tone: "primary" },
];

const TOP = 15;

function SeasonTable({ rows, offset, max }: { rows: SeasonRow[]; offset: number; max: { goals: number; assists: number; motm: number } }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">
              <th className="w-10 p-3 text-left font-medium">#</th>
              <th className="p-3 text-left font-medium">Player</th>
              <th className="p-3 text-right font-medium" title="Appearances">Apps</th>
              <th className="p-3 text-right font-medium" title="Goals">G</th>
              <th className="p-3 text-right font-medium" title="Assists">A</th>
              <th className="p-3 text-right font-medium" title="Goals + assists">G+A</th>
              <th className="p-3 text-right font-medium" title="Man of the Match">★</th>
              <th className="p-3 text-right font-medium" title="Average rating">Avg</th>
              <th className="p-3 text-right font-medium" title="Wins-draws-losses">W-D-L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const lead = (v: number, m: number) => m > 0 && v === m;
              return (
                <tr key={r.player.player.id} className="border-b last:border-0 hover:bg-elevated/50">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{offset + i + 1}</td>
                  <td className="p-3">
                    <Link href={`/players/${r.player.player.id}`} className="flex items-center gap-2.5 hover:underline">
                      <PlayerAvatar name={r.player.player.fullName} imageUrl={r.player.player.imageUrl} className="h-7 w-7 text-[0.6rem]" />
                      <span className="truncate">{shortName(r.player.player)}</span>
                      <span className="font-mono text-[0.65rem] text-muted-foreground">{POSITION_SHORT(r.player.player.position)}</span>
                    </Link>
                  </td>
                  <td className="p-3 text-right tabular-nums">{r.line.apps}</td>
                  <td className={cn("p-3 text-right tabular-nums", lead(r.line.goals, max.goals) && "font-bold text-goals")}>{r.line.goals}</td>
                  <td className={cn("p-3 text-right tabular-nums", lead(r.line.assists, max.assists) && "font-bold text-assists")}>{r.line.assists}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">{r.line.goals + r.line.assists}</td>
                  <td className={cn("p-3 text-right tabular-nums", lead(r.line.motm, max.motm) && "font-bold text-motm")}>{r.line.motm}</td>
                  <td className="p-3 text-right"><RatingPill rating={r.line.avgRating} size="sm" /></td>
                  <td className="p-3 text-right font-mono text-xs tabular-nums">{r.line.wins}-{r.line.draws}-{r.line.losses}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Ballon d'Or standings: position-fair season points, eligible players first. */
export function BallonDorRace({ race, players, current }: { race: BallonRace; players: PlayerInsight[]; current: boolean }) {
  const byId = new Map(players.map((p) => [p.player.id, p]));
  const eligible = race.entries.filter((e) => e.eligible).slice(0, 10);
  const chasing = race.entries.filter((e) => !e.eligible).slice(0, 5);
  const leader = eligible[0]?.score ?? 0;

  return (
    <div className="panel overflow-hidden border-motm/40">
      <div className="flex flex-col gap-1 border-b p-5 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-motm" />
          <span className="font-display text-xl font-extrabold uppercase tracking-wide">Ballon d&apos;Or</span>
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">{current ? "live standings" : "final standings"}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Every player rated against their own position, then on one scale · needs {race.minApps} of {race.matches} games
        </span>
      </div>
      {eligible.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">Nobody has played {race.minApps} games yet this season.</p>
      ) : (
        <ol className="divide-y">
          {eligible.map((e, i) => {
            const p = byId.get(e.playerId);
            if (!p) return null;
            const line = [
              `${e.apps} apps`,
              e.goals || e.assists ? `${e.goals}G ${e.assists}A` : null,
              e.motm ? `${e.motm} MOTM` : null,
              ["GK", "CB", "LB", "RB", "CDM"].includes(e.position) ? `${e.cleanSheets} clean sheets` : null,
              `avg ${fmtRating(e.avgRating)}`,
            ].filter(Boolean).join(" · ");
            return (
              <li key={e.playerId} className={cn("flex items-center gap-3 px-5 py-3", i === 0 && "bg-motm/5")}>
                <span className={cn("w-5 font-mono text-sm", i === 0 ? "text-motm" : "text-muted-foreground")}>{i + 1}</span>
                <PlayerAvatar name={p.player.fullName} imageUrl={p.player.imageUrl} className="h-9 w-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link href={`/players/${e.playerId}`} className={cn("truncate hover:underline", i === 0 && "font-semibold")}>{shortName(p.player)}</Link>
                    <span className="font-mono text-[0.65rem] text-muted-foreground">{POSITION_SHORT(e.position)}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {line}
                    {e.strengths.length > 0 && <span className="hidden md:inline"> · strong on {e.strengths.join(", ").toLowerCase()}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="numeral text-2xl" style={i === 0 ? { color: "hsl(var(--motm))" } : undefined}>{e.score.toFixed(1)}</div>
                  <div className="font-mono text-[0.6rem] text-muted-foreground">{i === 0 ? "pts" : `−${(leader - e.score).toFixed(1)}`}</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {chasing.length > 0 && (
        <div className="border-t px-5 py-3 text-xs text-muted-foreground">
          <span className="eyebrow mr-2">Not enough games yet</span>
          {chasing.map((e, i) => {
            const p = byId.get(e.playerId);
            return p ? (
              <span key={e.playerId}>
                {i > 0 && " · "}
                <Link href={`/players/${e.playerId}`} className="hover:underline">{shortName(p.player)}</Link> {e.score.toFixed(1)} ({e.apps}/{race.minApps})
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

/** Live table and award races for one season (the newest one by default). */
export function SeasonLive({ season, players, ballonDor }: { season: SeasonHonours; players: PlayerInsight[]; ballonDor: BallonRace | null }) {
  const rows = seasonRows(players, season.key).sort(
    (a, b) => b.line.goals + b.line.assists - (a.line.goals + a.line.assists) || b.line.goals - a.line.goals || b.line.apps - a.line.apps,
  );
  const max = {
    goals: Math.max(0, ...rows.map((r) => r.line.goals)),
    assists: Math.max(0, ...rows.map((r) => r.line.assists)),
    motm: Math.max(0, ...rows.map((r) => r.line.motm)),
  };

  return (
    <div className="space-y-6">
      {ballonDor && <BallonDorRace race={ballonDor} players={players} current={season.current} />}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RACES.map((race) => {
          const ranked = rows
            .map((r) => ({ r, v: race.value(r.line) }))
            .filter((x): x is { r: SeasonRow; v: number } => x.v !== null && x.v > 0)
            .sort((a, b) => b.v - a.v)
            .slice(0, 3);
          return (
            <div key={race.id} className="panel p-4">
              <div className="eyebrow flex items-center gap-2">
                <RarityDot rarity={HONOUR_BY_ID[race.id].rarity} />
                {HONOUR_BY_ID[race.id].name}
              </div>
              {ranked.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {race.id === "best-rated" ? "Nobody has 5 apps yet." : "Nobody yet."}
                </p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {ranked.map(({ r, v }, i) => (
                    <li key={r.player.player.id} className="flex items-center gap-2.5">
                      <span className={cn("w-4 font-mono text-xs", i === 0 ? "text-primary" : "text-muted-foreground")}>{i + 1}</span>
                      <PlayerAvatar name={r.player.player.fullName} imageUrl={r.player.player.imageUrl} className="h-7 w-7 text-[0.6rem]" />
                      <Link href={`/players/${r.player.player.id}`} className={cn("min-w-0 flex-1 truncate hover:underline", i === 0 && "font-semibold")}>
                        {shortName(r.player.player)}
                      </Link>
                      <span className="numeral text-lg" style={i === 0 ? { color: `hsl(var(--${race.tone}))` } : undefined}>
                        {race.id === "best-rated" ? fmtRating(v) : v}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>

      <SeasonTable rows={rows.slice(0, TOP)} offset={0} max={max} />
      {rows.length > TOP && (
        <details className="group">
          <summary className="eyebrow cursor-pointer list-none text-center hover:text-foreground">
            <span className="group-open:hidden">Show all {rows.length} players</span>
            <span className="hidden group-open:inline">Hide the rest</span>
          </summary>
          <div className="mt-3">
            <SeasonTable rows={rows.slice(TOP)} offset={TOP} max={max} />
          </div>
        </details>
      )}
    </div>
  );
}

/** Winners of every season, newest first, plus a trophy count across finished seasons. */
export function SeasonWinners({ seasons, players }: { seasons: SeasonHonours[]; players: PlayerInsight[] }) {
  const byId = new Map(players.map((p) => [p.player.id, p]));
  const name = (id: string) => {
    const p = byId.get(id);
    return p ? shortName(p.player) : "—";
  };

  const finished = seasons.filter((s) => !s.current);
  const tally = new Map<string, number>();
  for (const s of finished) for (const a of s.awards) if (HONOUR_BY_ID[a.id].kind === "squad") for (const w of a.winners) tally.set(w.playerId, (tally.get(w.playerId) ?? 0) + 1);
  const table = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-4">
        {seasons.map((s) => (
          <div key={s.key} className={cn("panel p-5", s.current && "border-primary/40")}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl font-extrabold uppercase tracking-wide">{s.label}</h3>
              <span className={cn("font-mono text-[0.65rem] uppercase tracking-wider", s.current ? "text-primary" : "text-muted-foreground")}>
                {s.current ? "● in progress · current leaders" : "final"}
              </span>
            </div>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {s.awards.map((a) => (
                <div key={a.id} className="flex items-baseline gap-3">
                  <span className="flex w-28 shrink-0 items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">
                    <RarityDot rarity={HONOUR_BY_ID[a.id].rarity} />
                    {HONOUR_BY_ID[a.id].name}
                  </span>
                  <span className="min-w-0 text-sm">
                    {a.winners.map((w, i) => (
                      <span key={w.playerId}>
                        {i > 0 && ", "}
                        <Link href={`/players/${w.playerId}`} className="hover:underline">{name(w.playerId)}</Link>
                        <span className="ml-1 font-mono text-[0.68rem] text-muted-foreground">{fmtValue(a.id, w.value)}</span>
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="panel h-fit p-5">
        <div className="eyebrow mb-3 flex items-center gap-2"><Trophy className="h-3.5 w-3.5" /> Most season awards</div>
        {table.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Awards are handed out when a season ends. The first season finishes at the end of {seasons.at(-1)?.label ?? "this month"}.
          </p>
        ) : (
          <ol className="space-y-2">
            {table.map(([id, n], i) => (
              <li key={id} className="flex items-center gap-2.5">
                <span className="w-4 font-mono text-xs text-muted-foreground">{i + 1}</span>
                <Link href={`/players/${id}`} className="min-w-0 flex-1 truncate hover:underline">{name(id)}</Link>
                <span className="numeral text-lg">{n}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          Counts {SQUAD_AWARDS.map((h) => h.name).join(", ")} from finished seasons. A season is one calendar month.
        </p>
      </div>
    </div>
  );
}
