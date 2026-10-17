import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PlayerInsight } from "@/server/services/insights.service";
import { PlayerAvatar } from "@/components/pk/kit";
import { shortName, POSITION_SHORT } from "@/components/pk/format";

export interface LeaderRow {
  insight: PlayerInsight;
  value: number;
  display: string;
  sub?: string;
}

export interface Board {
  key: string;
  title: string;
  accent: string;
  /** CSS variable for the board's signal colour */
  tone: string;
  unit: string;
  rows: LeaderRow[];
}

function BoardPanel({ board }: { board: Board }) {
  const [first, ...rest] = board.rows;
  const max = first?.value || 1;
  return (
    <article className="panel flex min-w-0 flex-col overflow-hidden">
      <header className="flex items-baseline justify-between gap-2 px-5 pt-5">
        <h3 className="font-display text-xl font-extrabold uppercase leading-none tracking-wide">{board.title}</h3>
        <span className="truncate font-serif text-sm italic text-muted-foreground">{board.accent}</span>
      </header>

      {!first ? (
        <p className="px-5 pb-6 pt-4 text-sm text-muted-foreground">Nobody qualifies yet.</p>
      ) : (
        <>
          <Link href={`/players/${first.insight.player.id}`} className="group relative mt-3 block px-5 pb-4">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="eyebrow">
                  No.1 · {POSITION_SHORT(first.insight.player.position)}
                </div>
                <div className="mt-1 truncate font-display text-[1.7rem] font-black uppercase leading-none group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                  {shortName(first.insight.player)}
                </div>
                {first.sub && <div className="mt-1 text-xs text-muted-foreground">{first.sub}</div>}
              </div>
              <div className="numeral shrink-0 text-6xl" style={{ color: `hsl(var(${board.tone}))` }}>
                {first.display}
              </div>
            </div>
          </Link>
          <ol className="mt-auto border-t">
            {rest.map((r, i) => (
              <li key={r.insight.player.id}>
                <Link
                  href={`/players/${r.insight.player.id}`}
                  className="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-elevated/60"
                >
                  <span className="w-4 font-mono text-[0.7rem] text-muted-foreground">{i + 2}</span>
                  <PlayerAvatar name={r.insight.player.fullName} imageUrl={r.insight.player.imageUrl} className="h-7 w-7 text-[0.6rem]" />
                  <span className="min-w-0 flex-1 truncate text-sm">{shortName(r.insight.player)}</span>
                  <span className="relative hidden h-1 w-10 shrink-0 overflow-hidden rounded-full bg-foreground/[0.07] 2xl:block">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${(r.value / max) * 100}%`, backgroundColor: `hsl(var(${board.tone}))` }}
                    />
                  </span>
                  <span className="w-10 text-right font-display text-lg font-extrabold tabular-nums">{r.display}</span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </article>
  );
}

export function LeaderBoards({ boards, className }: { boards: Board[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-5", className)}>
      {boards.map((b) => (
        <BoardPanel key={b.key} board={b} />
      ))}
    </div>
  );
}
