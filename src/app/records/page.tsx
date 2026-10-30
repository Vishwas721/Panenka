import type { Metadata } from "next";
import Link from "next/link";
import { getSeasonsOverview } from "@/server/services/insights.service";
import { Masthead, SectionHeading, EmptyState } from "@/components/pk/kit";
import { POSITION_SHORT, shortName } from "@/components/pk/format";
import { RecordWall, buildRecords } from "@/components/records/record-wall";
import { Leaderboard, type LeaderRow } from "@/components/records/leaderboard";
import { SeasonLive, SeasonWinners } from "@/components/records/season-honours";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Records",
  description: "Season leaderboard and winners, squad record holders and the full sortable leaderboard.",
};

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const { seasons, ballonDor, players: squad } = await getSeasonsOverview();
  const active = squad.filter((i) => i.profile.apps > 0);

  if (active.length === 0) {
    return (
      <>
        <Masthead kicker="Records" title="The Book" accent="is empty" />
        <EmptyState
          title="No records yet"
          action={
            <Button asChild>
              <Link href="/matches/new">Log the first match</Link>
            </Button>
          }
        >
          Records get written the moment a match is logged.
        </EmptyState>
      </>
    );
  }

  const records = buildRecords(active);
  const rows: LeaderRow[] = squad.map((i) => {
    const p = i.profile;
    return {
      id: i.player.id,
      name: shortName(i.player),
      fullName: i.player.fullName,
      position: POSITION_SHORT(i.player.position),
      imageUrl: i.player.imageUrl,
      number: i.player.squadNumber,
      ovr: i.ovr,
      tierId: i.tier.id,
      apps: p.apps,
      starts: p.starts,
      minutes: p.minutes,
      goals: p.goals,
      assists: p.assists,
      ga: p.ga,
      gpa: p.perApp?.goals ?? null,
      apa: p.perApp?.assists ?? null,
      gapa: p.perApp?.ga ?? null,
      ga90: p.per90?.ga ?? null,
      motm: p.motm,
      avg: p.rating.avg,
      best: p.rating.best,
      eights: p.rating.eightPlus,
      nines: p.rating.ninePlus,
      braces: p.hauls.goals.two,
      hattricks: p.hauls.goals.three + p.hauls.goals.four + p.hauls.goals.fivePlus,
      w: p.record.wins,
      d: p.record.draws,
      l: p.record.losses,
      winRate: p.record.winRate,
      keywords: i.keywords.unlocked.length,
    };
  });

  return (
    <>
      <Masthead kicker={<><span className="text-primary">●</span> Records</>} title="The Book" accent="of the squad">
        This season&apos;s race, every season&apos;s winners, every record the squad holds — then the whole squad ranked across 23 columns.
      </Masthead>

      {seasons[0] && (
        <section className="mb-16">
          <SectionHeading
            index="01"
            title={`${seasons[0].label} season`}
            note={seasons[0].current ? "live · who's leading what" : "latest season"}
          />
          <SeasonLive season={seasons[0]} players={active} ballonDor={ballonDor} />
        </section>
      )}

      <section className="mb-16">
        <SectionHeading index="02" title="Season winners" note="a season is one calendar month" />
        <SeasonWinners seasons={seasons} players={active} />
      </section>

      <section className="mb-16">
        <SectionHeading index="03" title="Record holders" note={`${records.length} records`} />
        <RecordWall records={records} />
      </section>

      <section>
        <SectionHeading index="04" title="Leaderboard" note="tap any column to sort" />
        <Leaderboard rows={rows} />
      </section>
    </>
  );
}
