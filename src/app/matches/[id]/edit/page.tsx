import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlayers } from "@/server/services/player.service";
import { getMatchById } from "@/server/services/match.service";
import { getCompetitions } from "@/server/services/competition.service";
import { LogMatchForm } from "@/components/matches/log-match-form";

interface EditMatchPageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: EditMatchPageProps): Promise<Metadata> {
  const match = await getMatchById(params.id);
  return { title: match ? `Edit · vs ${match.opponent}` : "Match not found" };
}

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const match = await getMatchById(params.id);
  if (!match) notFound();

  const [competitions, players] = await Promise.all([
    getCompetitions(),
    getPlayers({ includeArchived: true, pageSize: 500 }),
  ]);

  return <LogMatchForm initialMatch={match} competitions={competitions} availablePlayers={players.data} />;
}
