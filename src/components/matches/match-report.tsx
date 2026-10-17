"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Star, MapPin, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchReport as Report, ReportLine } from "@/server/services/team.service";
import { RatingPill, PlayerAvatar, SectionHeading, EmptyState } from "@/components/pk/kit";
import { fmtDate, fmtRating, ratingVar, resultVar, shortName, POSITION_SHORT } from "@/components/pk/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteMatchAction } from "@/app/actions/matches";

function Actions({ id, opponent }: { id: string; opponent: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <>
      <Link href={`/matches/${id}/edit`} className={buttonVariants({ variant: "outline" })}>
        <Pencil /> Edit
      </Link>
      <Button variant="ghost" className="text-loss hover:text-loss" onClick={() => setOpen(true)}>
        <Trash2 /> Delete
      </Button>
      {error && <p className="w-full text-sm text-loss">{error}</p>}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this match?"
        description={`The match against ${opponent} and every rating, goal, assist and MOTM logged in it will be removed. Player stats and keywords recalculate immediately.`}
        confirmText="Delete match"
        variant="destructive"
        isLoading={busy}
        onConfirm={async () => {
          setBusy(true);
          const res = await deleteMatchAction(id);
          setBusy(false);
          if (res.success) {
            setOpen(false);
            router.push("/matches");
            router.refresh();
          } else {
            setOpen(false);
            setError(res.error ?? "Could not delete the match.");
          }
        }}
      />
    </>
  );
}

function LadderRow({ line, top }: { line: ReportLine; top: number }) {
  const width = line.rating !== null ? Math.max(6, ((line.rating - 1) / 9) * 100) : 0;
  return (
    <li>
      <Link
        href={`/players/${line.player.id}`}
        className="group grid grid-cols-[1.75rem_2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-elevated/60 sm:grid-cols-[2rem_2.5rem_minmax(0,11rem)_1fr_auto]"
      >
        <span className="font-mono text-[0.68rem] text-muted-foreground">{POSITION_SHORT(line.player.position)}</span>
        <PlayerAvatar name={line.player.fullName} imageUrl={line.player.imageUrl} number={line.player.squadNumber} className="h-8 w-8 text-[0.65rem]" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 truncate font-semibold">
            {shortName(line.player)}
            {line.motm && <Star className="h-3.5 w-3.5 shrink-0 fill-motm text-motm" aria-label="Man of the match" />}
          </span>
          <span className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
            {line.started ? "Started" : "Sub"}
            {line.minutes !== null && <span>· {line.minutes}′</span>}
            <span className="flex items-center gap-0.5 sm:hidden">
              {Array.from({ length: line.goals }).map((_, i) => <span key={`g${i}`} className="h-1.5 w-1.5 rounded-full bg-goals" />)}
              {Array.from({ length: line.assists }).map((_, i) => <span key={`a${i}`} className="h-1.5 w-1.5 rotate-45 bg-assists" />)}
            </span>
          </span>
        </span>
        <span className="relative hidden h-7 items-center sm:flex">
          <span className="absolute inset-y-2.5 left-0 right-0 rounded-full bg-foreground/[0.05]" />
          <span
            className={cn("absolute inset-y-2.5 left-0 rounded-full transition-[width] duration-700", line.rating === top && "shadow-[0_0_14px_-2px_currentColor]")}
            style={{ width: `${width}%`, backgroundColor: `hsl(var(${ratingVar(line.rating)}))`, color: `hsl(var(${ratingVar(line.rating)}))` }}
          />
          <span className="relative ml-auto flex gap-1 pr-1">
            {Array.from({ length: line.goals }).map((_, i) => (
              <span key={`g${i}`} className="grid h-5 w-5 place-items-center rounded-full bg-goals font-mono text-[0.55rem] font-bold text-background">G</span>
            ))}
            {Array.from({ length: line.assists }).map((_, i) => (
              <span key={`a${i}`} className="grid h-5 w-5 place-items-center rounded-sm bg-assists font-mono text-[0.55rem] font-bold text-background">A</span>
            ))}
          </span>
        </span>
        <RatingPill rating={line.rating} />
      </Link>
    </li>
  );
}

export function MatchReportView({ report }: { report: Report }) {
  const r = report;
  const completed = r.status === "COMPLETED";
  const edge = `hsl(var(${resultVar(r.result)}))`;
  const appeared = r.lines.filter((l) => l.appeared);
  const starters = appeared.filter((l) => l.started);
  const subs = appeared.filter((l) => !l.started);
  const unused = r.lines.filter((l) => !l.appeared);
  const motm = r.lines.find((l) => l.motm);
  const top = r.totals.bestRating ?? -1;
  const ourName = r.team || "Us";
  const homeIsUs = r.venue !== "AWAY";

  return (
    <div>
      <Link href="/matches" className="eyebrow mb-6 inline-flex items-center gap-1.5 hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Fixtures
      </Link>

      {/* Scoreboard hero */}
      <section className="panel pitch-lines rise relative overflow-hidden p-5 sm:p-10">
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: completed ? edge : "hsl(var(--border))" }} />
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
          <span className="eyebrow">{r.competition ? `${r.competition.name}${r.competition.season ? ` · ${r.competition.season}` : ""}` : "Friendly"}</span>
          <span className="eyebrow">{fmtDate(r.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
          {(r.venueName || r.venue) && (
            <span className="eyebrow inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {r.venueName || (r.venue === "HOME" ? "Home" : r.venue === "AWAY" ? "Away" : "Neutral")}
            </span>
          )}
        </div>

        <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
          <div className="min-w-0 text-right">
            <div className="truncate font-display text-xl font-black uppercase leading-none sm:text-5xl">{homeIsUs ? ourName : r.opponent}</div>
            <div className="eyebrow mt-2">{r.venue === "NEUTRAL" ? "Neutral" : "Home"}</div>
          </div>
          <div className="numeral whitespace-nowrap text-[clamp(4rem,16vw,10rem)]" style={{ color: completed ? edge : undefined }}>
            {r.scoreHome ?? "–"}
            <span className="mx-1 text-muted-foreground/40 sm:mx-3">:</span>
            {r.scoreAway ?? "–"}
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-xl font-black uppercase leading-none sm:text-5xl">{homeIsUs ? r.opponent : ourName}</div>
            <div className="eyebrow mt-2">{r.venue === "NEUTRAL" ? "Neutral" : "Away"}</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          {completed ? (
            r.result ? (
              <span className="font-serif text-2xl italic" style={{ color: edge }}>
                {r.result === "W" ? "A win" : r.result === "L" ? "A defeat" : "Honours even"}
                {r.goalsFor !== null && r.goalsAgainst !== null && r.result !== "D" && (
                  <span className="text-muted-foreground"> by {Math.abs(r.goalsFor - r.goalsAgainst)}</span>
                )}
              </span>
            ) : (
              <span className="font-serif text-xl italic text-muted-foreground">Score not recorded</span>
            )
          ) : (
            <span className={cn("rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.16em]", r.status === "ABANDONED" ? "border-loss/40 text-loss" : "text-muted-foreground")}>
              {r.status === "ABANDONED" ? "Abandoned — does not count toward stats" : "Scheduled — not played yet"}
            </span>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Actions id={r.id} opponent={r.opponent} />
        </div>
      </section>

      {appeared.length === 0 ? (
        <EmptyState className="mt-8" title="No lineup logged" action={<Link href={`/matches/${r.id}/edit`} className={buttonVariants({ size: "lg" })}>Add players & ratings</Link>}>
          {completed ? "Add who played, their ratings, goals, assists and the man of the match." : "Once it's played, edit the match to log the result and ratings."}
        </EmptyState>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          {/* MOTM spotlight + numbers */}
          <aside className="flex flex-col gap-4 lg:col-span-4">
            {motm ? (
              <Link href={`/players/${motm.player.id}`} className="panel panel-hover group relative overflow-hidden p-6">
                <span className="pointer-events-none absolute -right-6 -top-10 font-display text-[12rem] font-black leading-none text-motm/10">★</span>
                <div className="eyebrow flex items-center gap-1.5 text-motm">
                  <Star className="h-3 w-3 fill-motm" /> Man of the match
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <PlayerAvatar name={motm.player.fullName} imageUrl={motm.player.imageUrl} number={motm.player.squadNumber} className="h-16 w-16 text-xl" />
                  <div className="min-w-0">
                    <div className="truncate font-display text-3xl font-black uppercase leading-none group-hover:underline">{shortName(motm.player)}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{motm.player.fullName}</div>
                  </div>
                </div>
                <div className="mt-5 flex items-end gap-6">
                  <div>
                    <div className="eyebrow">Rating</div>
                    <div className="numeral mt-1 text-6xl" style={{ color: `hsl(var(${ratingVar(motm.rating)}))` }}>{fmtRating(motm.rating)}</div>
                  </div>
                  <div>
                    <div className="eyebrow">G / A</div>
                    <div className="numeral mt-1 text-4xl">
                      <span className="text-goals">{motm.goals}</span>
                      <span className="text-muted-foreground/50">/</span>
                      <span className="text-assists">{motm.assists}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="panel p-6">
                <div className="eyebrow">Man of the match</div>
                <p className="mt-2 font-serif text-lg italic text-muted-foreground">Not awarded for this match.</p>
              </div>
            )}

            <div className="panel grid grid-cols-2 gap-5 p-6">
              <div>
                <div className="eyebrow">Team avg</div>
                <div className="numeral mt-1 text-5xl" style={{ color: `hsl(var(${ratingVar(r.avgRating)}))` }}>{r.avgRating?.toFixed(2) ?? "—"}</div>
              </div>
              <div>
                <div className="eyebrow">Players used</div>
                <div className="numeral mt-1 text-5xl">{appeared.length}</div>
              </div>
              <div>
                <div className="eyebrow">Best / worst</div>
                <div className="numeral mt-1 text-3xl">
                  <span style={{ color: `hsl(var(${ratingVar(r.totals.bestRating)}))` }}>{fmtRating(r.totals.bestRating)}</span>
                  <span className="text-muted-foreground/40"> / </span>
                  <span style={{ color: `hsl(var(${ratingVar(r.totals.worstRating)}))` }}>{fmtRating(r.totals.worstRating)}</span>
                </div>
              </div>
              <div>
                <div className="eyebrow">Goals / assists</div>
                <div className="numeral mt-1 text-3xl">
                  <span className="text-goals">{r.totals.goals}</span>
                  <span className="text-muted-foreground/40"> / </span>
                  <span className="text-assists">{r.totals.assists}</span>
                </div>
              </div>
            </div>

            {r.notes && (
              <div className="panel p-6">
                <div className="eyebrow">Notes</div>
                <p className="mt-2 whitespace-pre-line font-serif text-lg italic leading-snug">{r.notes}</p>
              </div>
            )}
          </aside>

          {/* Ratings ladder */}
          <section className="panel p-4 sm:p-6 lg:col-span-8" aria-labelledby="ladder">
            <SectionHeading index="01" title={<span id="ladder">Ratings ladder</span>} note="sorted by rating" />
            <div className="eyebrow mb-1 px-2">Starting XI · {starters.length}</div>
            <ol className="space-y-0.5">
              {starters.map((l) => (
                <LadderRow key={l.performanceId} line={l} top={top} />
              ))}
            </ol>
            {subs.length > 0 && (
              <>
                <div className="eyebrow mb-1 mt-6 px-2">Off the bench · {subs.length}</div>
                <ol className="space-y-0.5">
                  {subs.map((l) => (
                    <LadderRow key={l.performanceId} line={l} top={top} />
                  ))}
                </ol>
              </>
            )}
            {unused.length > 0 && (
              <p className="mt-6 px-2 text-xs text-muted-foreground">
                <span className="eyebrow mr-2">Unused</span>
                {unused.map((l) => shortName(l.player)).join(", ")}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
