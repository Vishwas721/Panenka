import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UserPlus, ArrowUpRight } from "lucide-react";
import { getSquadInsights, type PlayerInsight } from "@/server/services/insights.service";
import { getTeamOverview } from "@/server/services/team.service";
import { Masthead, SectionHeading, EmptyState, KeywordChip, Stat } from "@/components/pk/kit";
import { PlayerCard } from "@/components/pk/player-card";
import { toCardData } from "@/components/pk/card-data";
import { fmtDate, fmtRating, POSITION_LABEL } from "@/components/pk/format";
import { Scoreboard, ResultTiles } from "@/components/dashboard/scoreboard";
import { LeaderBoards, type Board, type LeaderRow } from "@/components/dashboard/leaders";
import { SquadTrendChart } from "@/components/dashboard/squad-trend-chart";
import { RareKeywords, rarestKeywords, UnlockWatch, closestUnlocks } from "@/components/dashboard/squad-pulse";
import { buttonVariants } from "@/components/ui/button";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Matchday",
  description: `${brand.tagline}. Squad record, leaders, form and keywords.`,
};

export const dynamic = "force-dynamic";

function board(
  squad: PlayerInsight[],
  key: string,
  title: string,
  accent: string,
  tone: string,
  unit: string,
  get: (i: PlayerInsight) => number | null,
  display: (v: number) => string,
  sub?: (i: PlayerInsight) => string,
): Board {
  const rows: LeaderRow[] = squad
    .map((insight) => ({ insight, v: get(insight) }))
    .filter((r): r is { insight: PlayerInsight; v: number } => r.v !== null && r.v > 0)
    .sort((a, b) => b.v - a.v || b.insight.profile.apps - a.insight.profile.apps || a.insight.player.fullName.localeCompare(b.insight.player.fullName))
    .slice(0, 5)
    .map(({ insight, v }) => ({ insight, value: v, display: display(v), sub: sub?.(insight) }));
  return { key, title, accent, tone, unit, rows };
}

export default async function DashboardPage() {
  const [squad, team] = await Promise.all([getSquadInsights(), getTeamOverview()]);
  const active = squad.filter((i) => i.profile.apps > 0);

  const newButton = (
    <Link href="/matches/new" className={buttonVariants({ size: "lg" })}>
      <Plus /> Log match
    </Link>
  );
  const playerButton = (
    <Link href="/players" className={buttonVariants({ variant: "outline", size: "lg" })}>
      <UserPlus /> Add players
    </Link>
  );

  if (squad.length === 0 || team.matches === 0) {
    return (
      <>
        <Masthead kicker={<span>{brand.name} · Matchday</span>} title="Kick-off" accent="nothing logged yet">
          Every number on this page comes from what you log: a rating, goals, assists and the man of the match for each
          appearance. Two steps and the stands fill up.
        </Masthead>
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState
            title={squad.length === 0 ? "01 · Build the squad" : "01 · Squad ready"}
            action={squad.length === 0 ? playerButton : undefined}
          >
            {squad.length === 0
              ? "Add the players you want to track — name, position, shirt number."
              : `${squad.length} player${squad.length === 1 ? "" : "s"} registered. Nice.`}
          </EmptyState>
          <EmptyState title="02 · Log a match" action={squad.length > 0 ? newButton : undefined}>
            Score, opponent, and for each player a rating out of 10, goals, assists and the MOTM star.
          </EmptyState>
        </div>
      </>
    );
  }

  const number1 = [...active].sort((a, b) => (b.ovr ?? 0) - (a.ovr ?? 0) || b.profile.apps - a.profile.apps)[0];
  const latest = team.last10[0];

  const boards: Board[] = [
    board(squad, "goals", "Golden Boot", "goals", "--goals", "G", (i) => i.profile.goals, String, (i) => `${i.profile.apps} apps · ${i.profile.perApp?.goals.toFixed(2) ?? "—"} per game`),
    board(squad, "assists", "Playmaker", "assists", "--assists", "A", (i) => i.profile.assists, String, (i) => `${i.profile.hauls.assistedIn} games with an assist`),
    board(squad, "motm", "Star Man", "man of the match", "--motm", "★", (i) => i.profile.motm, String, (i) => `${Math.round((i.profile.perApp?.motm ?? 0) * 100)}% of appearances`),
    board(squad, "rating", "Highest Rated", "5+ rated apps", "--rating", "", (i) => (i.profile.rating.rated >= 5 ? i.profile.rating.avg : null), (v) => v.toFixed(2), (i) => `best ${fmtRating(i.profile.rating.best)} · ${i.profile.rating.eightPlus} games 8+`),
    board(squad, "form", "In Form", "last five", "--primary", "", (i) => (i.profile.rating.rated >= 3 ? i.profile.rating.last5 : null), (v) => v.toFixed(1), (i) => {
      const d = (i.profile.rating.last5 ?? 0) - (i.profile.rating.avg ?? 0);
      return `${d >= 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(2)} vs career`;
    }),
  ];

  const rare = rarestKeywords(squad);
  const watch = closestUnlocks(active);
  const totalKeywords = squad.reduce((a, i) => a + i.keywords.unlocked.length, 0);

  return (
    <>
      <Masthead
        kicker={
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Matchday{latest ? ` · last played ${fmtDate(latest.date)}` : ""}</span>
          </>
        }
        title="Matchday"
        accent="the state of the squad"
        actions={
          <>
            {newButton}
          </>
        }
      >
        {team.matches} matches, {team.playerGoals} goals, {team.playerAssists} assists and {totalKeywords} keywords earned
        across {active.length} players.
      </Masthead>

      {/* 01 — Hero: squad number one + season record */}
      <section className="grid gap-6 lg:grid-cols-12" aria-label="Squad overview">
        {number1 && (
          <div className="rise flex flex-col items-center gap-4 lg:col-span-4 lg:items-start">
            <div className="flex w-full items-baseline justify-between gap-3 lg:max-w-[22rem]">
              <span className="eyebrow">Squad No. 1</span>
              <span className="font-serif text-base italic text-muted-foreground">
                {POSITION_LABEL[number1.player.position] ?? number1.player.position}
              </span>
            </div>
            <PlayerCard data={toCardData(number1)} size="lg" href={`/players/${number1.player.id}`} />
            {number1.archetype && (
              <p className="max-w-[22rem] text-center font-serif text-lg italic leading-snug text-muted-foreground lg:text-left">
                “{number1.archetype.line}”
              </p>
            )}
          </div>
        )}

        <div className="rise flex min-w-0 flex-col gap-6 [animation-delay:120ms] lg:col-span-8">
          <Scoreboard team={team} />
          <div>
            <SectionHeading
              index="01"
              title="Last ten"
              note="newest first"
              action={
                <Link href="/matches" className="eyebrow inline-flex items-center gap-1 hover:text-foreground">
                  All fixtures <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
            <ResultTiles fixtures={team.last10} />
          </div>
        </div>
      </section>

      {/* 02 — Leaders */}
      <section className="mt-14" aria-labelledby="leaders">
        <SectionHeading index="02" title={<span id="leaders">The leaders</span>} note="who owns the numbers" />
        <LeaderBoards boards={boards} />
      </section>

      {/* 03 — Trend + output */}
      <section className="mt-14 grid gap-4 lg:grid-cols-12" aria-labelledby="trend">
        <div className="panel p-5 sm:p-6 lg:col-span-8">
          <SectionHeading
            index="03"
            title={<span id="trend">Squad rating</span>}
            note="match average & 5-game rolling"
            className="mb-2"
          />
          <div className="mb-3 flex flex-wrap gap-4 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rating" /> Match average</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-primary" /> Rolling 5</span>
            <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed border-foreground/40" /> Season {fmtRating(team.avgRating)}</span>
          </div>
          <SquadTrendChart data={team.trend} average={team.avgRating} />
        </div>
        <div className="panel pitch-lines grid grid-cols-2 content-between gap-6 p-5 sm:p-6 lg:col-span-4">
          <Stat label="Player goals" value={team.playerGoals} tone="goals" size="lg" sub={`${(team.playerGoals / team.matches).toFixed(2)} per match`} />
          <Stat label="Assists" value={team.playerAssists} tone="assists" size="lg" sub={`${(team.playerAssists / team.matches).toFixed(2)} per match`} />
          <Stat label="MOTM awards" value={team.motmAwarded} tone="motm" size="lg" sub={`across ${new Set(active.filter((i) => i.profile.motm > 0).map((i) => i.player.id)).size} players`} />
          <Stat label="Squad avg" value={fmtRating(team.avgRating)} tone="rating" size="lg" sub="all rated appearances" />
          {team.biggestWin && (
            <Link href={`/matches/${team.biggestWin.id}`} className="col-span-2 border-t pt-4 hover:text-primary">
              <div className="eyebrow">Biggest win</div>
              <div className="mt-1 font-display text-2xl font-extrabold uppercase">
                {team.biggestWin.goalsFor}–{team.biggestWin.goalsAgainst}{" "}
                <span className="font-serif text-lg font-normal normal-case italic text-muted-foreground">
                  {team.biggestWin.venue === "AWAY" ? "at" : "vs"} {team.biggestWin.opponent}
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* 04 — Keywords */}
      <section className="mt-14 grid gap-4 lg:grid-cols-12" aria-labelledby="keywords">
        <div className="panel p-5 sm:p-6 lg:col-span-7">
          <SectionHeading
            index="04"
            title={<span id="keywords">Rarest keywords</span>}
            note="the squad's trophy shelf"
            action={
              <Link href="/keywords" className="eyebrow inline-flex items-center gap-1 hover:text-foreground">
                Codex <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          <RareKeywords items={rare} />
        </div>
        <div className="panel p-5 sm:p-6 lg:col-span-5">
          <SectionHeading index="05" title="On the brink" note="closest unlocks" />
          <UnlockWatch items={watch} />
        </div>
      </section>

      {number1 && number1.keywords.signature.length > 0 && (
        <section className="mt-14 overflow-hidden" aria-label={`${number1.player.fullName} signature keywords`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-2">No. 1 signature</span>
            {number1.keywords.signature.slice(0, 8).map((k) => (
              <KeywordChip key={k.id} keyword={k} size="sm" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
