import type { Metadata } from "next";
import Link from "next/link";
import { getSquadInsights } from "@/server/services/insights.service";
import { HeadToHead } from "@/components/compare/head-to-head";
import { PlayerPicker } from "@/components/compare/player-picker";
import { Masthead, EmptyState } from "@/components/pk/kit";
import { POSITION_SHORT } from "@/components/pk/format";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Head to Head",
  description: "Two players, one tale of the tape: ratings, output, impact, streaks and keywords side by side.",
};

export const dynamic = "force-dynamic";

interface ComparePageProps {
  searchParams: Promise<{ a?: string; b?: string }> | { a?: string; b?: string };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await Promise.resolve(searchParams);
  const squad = await getSquadInsights();

  const ranked = [...squad].sort((x, y) => (y.ovr ?? -1) - (x.ovr ?? -1) || y.profile.apps - x.profile.apps);

  if (ranked.length < 2) {
    return (
      <>
        <Masthead kicker="Compare" title="Head to Head" accent="needs two" />
        <EmptyState
          title="Not enough players"
          action={
            <Button asChild>
              <Link href="/players">Build the squad</Link>
            </Button>
          }
        >
          Add at least two players to put them in the ring.
        </EmptyState>
      </>
    );
  }

  const find = (id?: string) => (id ? squad.find((s) => s.player.id === id) : undefined);
  let a = find(params.a) ?? ranked[0]!;
  let b = find(params.b) ?? ranked.find((p) => p.player.id !== a.player.id)!;
  if (a.player.id === b.player.id) b = ranked.find((p) => p.player.id !== a.player.id)!;
  if (!a) a = ranked[0]!;

  const options = ranked.map((p) => ({
    id: p.player.id,
    name: p.player.displayName || p.player.fullName,
    position: POSITION_SHORT(p.player.position),
    ovr: p.ovr,
  }));

  return (
    <>
      <Masthead kicker={<><span className="text-primary">●</span> Compare</>} title="Head to Head" accent="settle it">
        Pick two players. Twenty-two rounds across ratings, output, impact, winning and streaks — the bar tells you who won each.
      </Masthead>
      <div className="mb-12">
        <PlayerPicker options={options} a={a.player.id} b={b.player.id} />
      </div>
      <HeadToHead a={a} b={b} />
    </>
  );
}
