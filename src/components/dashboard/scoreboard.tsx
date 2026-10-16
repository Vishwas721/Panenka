import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TeamOverview, FixtureSummary } from "@/server/services/team.service";
import { fmtPct, fmtRating, fmtNum, resultVar } from "@/components/pk/format";

function Big({ value, label, varName }: { value: number; label: string; varName: string }) {
  return (
    <div className="relative">
      <div className="numeral text-[clamp(4.5rem,13vw,9.5rem)]" style={{ color: `hsl(var(${varName}))` }}>
        {value}
      </div>
      <div className="eyebrow mt-1">{label}</div>
    </div>
  );
}

/** The giant team-record board that anchors the dashboard hero. */
export function Scoreboard({ team }: { team: TeamOverview }) {
  const gd = team.goalsFor - team.goalsAgainst;
  const cells: { label: string; value: string; tone?: string }[] = [
    { label: "Goals for", value: String(team.goalsFor), tone: "--goals" },
    { label: "Against", value: String(team.goalsAgainst) },
    { label: "Goal diff", value: `${gd > 0 ? "+" : ""}${gd}`, tone: gd > 0 ? "--win" : gd < 0 ? "--loss" : undefined },
    { label: "Clean sheets", value: String(team.cleanSheets), tone: "--assists" },
    { label: "Win rate", value: fmtPct(team.winRate) },
    { label: "Pts / game", value: fmtNum(team.ppg) },
    { label: "Squad avg", value: fmtRating(team.avgRating), tone: "--rating" },
    { label: "Unbeaten run", value: String(team.unbeatenRun), tone: team.unbeatenRun >= 3 ? "--win" : undefined },
  ];

  return (
    <div className="panel stripe-bg relative overflow-hidden p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Season record · {team.scored} scored fixtures</span>
        {team.winRun >= 2 && (
          <span className="rounded-full border border-win/40 bg-win/10 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-win">
            {team.winRun} wins on the bounce
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 items-end gap-2 sm:gap-6">
        <Big value={team.wins} label="Won" varName="--win" />
        <Big value={team.draws} label="Drawn" varName="--draw" />
        <Big value={team.losses} label="Lost" varName="--loss" />
      </div>

      {/* Win/draw/loss proportion bar */}
      {team.scored > 0 && (
        <div className="mt-6 flex h-2 overflow-hidden rounded-full">
          <span className="bg-win" style={{ width: `${(team.wins / team.scored) * 100}%` }} />
          <span className="bg-draw" style={{ width: `${(team.draws / team.scored) * 100}%` }} />
          <span className="bg-loss" style={{ width: `${(team.losses / team.scored) * 100}%` }} />
        </div>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-5 sm:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label}>
            <dt className="eyebrow">{c.label}</dt>
            <dd className="numeral mt-1 text-3xl" style={c.tone ? { color: `hsl(var(${c.tone}))` } : undefined}>
              {c.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Last-N results as large scoreline tiles, newest on the left. */
export function ResultTiles({ fixtures, className }: { fixtures: FixtureSummary[]; className?: string }) {
  return (
    <div className={cn("scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}>
      {fixtures.map((f, i) => (
        <Link
          key={f.id}
          href={`/matches/${f.id}`}
          className="panel panel-hover group relative flex w-[6.5rem] shrink-0 flex-col overflow-hidden p-3"
          title={`${f.venue === "AWAY" ? "at" : "vs"} ${f.opponent}`}
        >
          <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: `hsl(var(${resultVar(f.result)}))` }} />
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
            {i === 0 ? "Latest" : new Date(f.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
          </span>
          <span className="numeral mt-2 text-4xl" style={{ color: `hsl(var(${resultVar(f.result)}))` }}>
            {f.result ?? "–"}
          </span>
          <span className="mt-1 font-display text-lg font-extrabold tabular-nums">
            {f.goalsFor ?? "–"}–{f.goalsAgainst ?? "–"}
          </span>
          <span className="truncate text-[0.7rem] text-muted-foreground">
            {f.venue === "AWAY" ? "@ " : ""}
            {f.opponent}
          </span>
        </Link>
      ))}
    </div>
  );
}
