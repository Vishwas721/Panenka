import { notFound } from "next/navigation";
import { getPlayers } from "@/server/services/player.service";
import { getMatchById } from "@/server/services/match.service";
import { getCompetitions } from "@/server/services/competition.service";
import { LogMatchForm } from "@/components/matches/log-match-form";
import type { Metadata } from "next";

interface EditMatchPageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: EditMatchPageProps): Promise<Metadata> {
  const match = await getMatchById(params.id);
  if (!match) {
    return { title: "Match Not Found" };
  }
  return {
    title: `Edit Match vs ${match.opponent}`,
    description: `Update match details and player performances for match vs ${match.opponent}`,
  };
}

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const match = await getMatchById(params.id);
  if (!match) {
    notFound();
  }

  const [competitions, playersRes] = await Promise.all([
    getCompetitions(),
    getPlayers({ includeArchived: true, pageSize: 200 }),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <LogMatchForm
        initialMatch={match}
        competitions={competitions}
        availablePlayers={playersRes.data}
      />
    </div>
  );
}
