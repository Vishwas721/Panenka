import type { Metadata } from "next";
import Link from "next/link";
import { getSeasonsOverview } from "@/server/services/insights.service";
import { Masthead, SectionHeading, EmptyState } from "@/components/pk/kit";
import { BallonDorRace, BallonHistory, BallonTable } from "@/components/ballon-dor/ballon-dor";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Ballon d'Or",
  description: "Live Ballon d'Or standings, all-time winners and every season's top ten.",
};

export const dynamic = "force-dynamic";

export default async function BallonDorPage() {
  const { seasons, ballonDor, ballonTable, players } = await getSeasonsOverview();
  const current = seasons[0];

  if (!current || !ballonDor) {
    return (
      <>
        <Masthead kicker="Ballon d'Or" title="Ballon" accent="d'Or" />
        <EmptyState
          title="No season yet"
          action={
            <Button asChild>
              <Link href="/matches/new">Log the first match</Link>
            </Button>
          }
        >
          The race starts with the first logged match of the month.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <Masthead kicker={<><span className="text-motm">●</span> Ballon d&apos;Or</>} title="Ballon" accent="d'Or">
        The best player of each season at any position. Every player is rated against their own position, then all positions are put
        on one scale. A season is one calendar month.
      </Masthead>

      <section className="mb-16">
        <SectionHeading index="01" title={`${current.label} race`} note={current.current ? "live standings" : "latest season"} />
        <BallonDorRace race={ballonDor} players={players} current={current.current} />
      </section>

      <section className="mb-16">
        <SectionHeading index="02" title="All-time table" note="wins, then every place to 10th" />
        <BallonTable rows={ballonTable} players={players} />
      </section>

      <section>
        <SectionHeading index="03" title="Past seasons" note="final top ten" />
        <BallonHistory seasons={seasons} players={players} />
      </section>
    </>
  );
}
