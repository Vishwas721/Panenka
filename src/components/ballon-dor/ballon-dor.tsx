import Link from "next/link";
import { Trophy } from "lucide-react";
import type { PlayerInsight } from "@/server/services/insights.service";
import type { BallonRace } from "@/lib/stats/ballon-dor";
import { BALLON_PLACES, ballonRank, type BallonRecord, type SeasonHonours } from "@/lib/stats/honours";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/pk/kit";
import { fmtRating, POSITION_SHORT, shortName } from "@/components/pk/format";

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

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

/** All-time table: wins, then every place from 2nd to 10th. */
export function BallonTable({ rows, players }: { rows: BallonRecord[]; players: PlayerInsight[] }) {
  const byId = new Map(players.map((p) => [p.player.id, p]));
  if (rows.length === 0) {
    return <p className="panel p-5 text-sm text-muted-foreground">No finished seasons yet. The table fills in when the first season ends.</p>;
  }
  const places = Array.from({ length: BALLON_PLACES }, (_, i) => i);
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">
              <th className="w-10 p-3 text-left font-medium">#</th>
              <th className="p-3 text-left font-medium">Player</th>
              {places.map((i) => (
                <th key={i} className={cn("p-2 text-right font-medium", i === 0 && "text-motm")} title={`Times finished ${ordinal(i + 1)}`}>
                  {i === 0 ? "Won" : ordinal(i + 1)}
                </th>
              ))}
              <th className="p-3 text-right font-medium" title="Top-three finishes">Podiums</th>
              <th className="p-3 text-right font-medium" title="Top-ten finishes">Top 10</th>
              <th className="p-3 text-right font-medium" title="Position in the season in progress">Live</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const p = byId.get(r.playerId);
              if (!p) return null;
              return (
                <tr key={r.playerId} className="border-b last:border-0 hover:bg-elevated/50">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="p-3">
                    <Link href={`/players/${r.playerId}`} className="flex items-center gap-2.5 hover:underline">
                      <PlayerAvatar name={p.player.fullName} imageUrl={p.player.imageUrl} className="h-7 w-7 text-[0.6rem]" />
                      <span className="truncate">{shortName(p.player)}</span>
                      <span className="font-mono text-[0.65rem] text-muted-foreground">{POSITION_SHORT(p.player.position)}</span>
                    </Link>
                  </td>
                  {places.map((i) => (
                    <td key={i} className={cn("p-2 text-right tabular-nums", r.placings[i] ? (i === 0 ? "font-bold text-motm" : "") : "text-muted-foreground/40")}>
                      {r.placings[i] || "·"}
                    </td>
                  ))}
                  <td className="p-3 text-right font-semibold tabular-nums">{r.podiums}</td>
                  <td className="p-3 text-right tabular-nums">{r.top10}</td>
                  <td className="p-3 text-right font-mono text-xs">{r.live?.rank ? `#${r.live.rank}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Final top ten of every finished season, newest first. */
export function BallonHistory({ seasons, players }: { seasons: SeasonHonours[]; players: PlayerInsight[] }) {
  const byId = new Map(players.map((p) => [p.player.id, p]));
  const finished = seasons.filter((s) => !s.current && s.ballonDor);
  if (finished.length === 0) {
    return <p className="panel p-5 text-sm text-muted-foreground">Each finished season&apos;s final top ten appears here.</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {finished.map((s) => {
        const race = s.ballonDor!;
        const top = race.entries.filter((e) => e.eligible).slice(0, BALLON_PLACES);
        return (
          <div key={s.key} className="panel p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-display text-xl font-extrabold uppercase tracking-wide">{s.label}</h3>
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">{race.matches} games</span>
            </div>
            <ol className="space-y-1.5">
              {top.map((e) => {
                const p = byId.get(e.playerId);
                const rank = ballonRank(race, e.playerId)!;
                return (
                  <li key={e.playerId} className="flex items-center gap-2.5 text-sm">
                    <span className={cn("w-6 font-mono text-xs", rank === 1 ? "text-motm" : "text-muted-foreground")}>{rank}</span>
                    {p ? (
                      <Link href={`/players/${e.playerId}`} className={cn("min-w-0 flex-1 truncate hover:underline", rank === 1 && "font-semibold")}>
                        {shortName(p.player)}
                      </Link>
                    ) : (
                      <span className="flex-1">—</span>
                    )}
                    <span className="font-mono text-[0.65rem] text-muted-foreground">{POSITION_SHORT(e.position)}</span>
                    <span className="numeral w-12 text-right text-base">{e.score.toFixed(1)}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
