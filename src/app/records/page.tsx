import type { Metadata } from "next";
import Link from "next/link";
import { getSquadInsights } from "@/server/services/insights.service";
import { Masthead, SectionHeading, EmptyState } from "@/components/pk/kit";
import { POSITION_SHORT, shortName } from "@/components/pk/format";
import { RecordWall, buildRecords } from "@/components/records/record-wall";
import { Leaderboard, type LeaderRow } from "@/components/records/leaderboard";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Records",
  description: "Squad record holders and the full sortable leaderboard.",
};

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const squad = await getSquadInsights();
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
        Every record the squad holds, who holds it and when it was set — then the whole squad ranked across 23 columns.
      </Masthead>

      <section className="mb-16">
        <SectionHeading index="01" title="Record holders" note={`${records.length} records`} />
        <RecordWall records={records} />
      </section>

      <section>
        <SectionHeading index="02" title="Leaderboard" note="tap any column to sort" />
        <Leaderboard rows={rows} />
      </section>
    </>
  );
}
