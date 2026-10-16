import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getFixtures } from "@/server/services/team.service";
import { FixturesList } from "@/components/matches/fixtures-list";
import { Masthead } from "@/components/pk/kit";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Fixtures",
  description: "Every match logged: scorelines, scorers, man of the match and team ratings.",
};

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const fixtures = await getFixtures();
  const completed = fixtures.filter((f) => f.status === "COMPLETED");
  const goalsFor = completed.reduce((a, f) => a + (f.goalsFor ?? 0), 0);
  const goalsAgainst = completed.reduce((a, f) => a + (f.goalsAgainst ?? 0), 0);

  return (
    <>
      <Masthead
        kicker={<span>The almanac · {fixtures.length} fixtures</span>}
        title="Fixtures"
        accent="every ninety minutes"
        actions={
          <Link href="/matches/new" className={buttonVariants({ size: "lg" })}>
            <Plus /> Log match
          </Link>
        }
      >
        {completed.length > 0
          ? `${completed.length} played · ${goalsFor} scored · ${goalsAgainst} conceded.`
          : "Nothing played yet."}
      </Masthead>
      <FixturesList fixtures={fixtures} />
    </>
  );
}
