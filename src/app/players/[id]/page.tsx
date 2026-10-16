import { notFound } from "next/navigation";
import { getPlayerById } from "@/server/services/player.service";
import { PlayerProfileView } from "@/components/players/player-profile-view";
import type { Metadata } from "next";

interface PlayerProfilePageProps {
  params: Promise<{ id: string }> | { id: string };
}

export async function generateMetadata({
  params,
}: PlayerProfilePageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const player = await getPlayerById(resolvedParams.id);
  if (!player) {
    return { title: "Player Not Found | Panenka" };
  }
  return {
    title: `${player.fullName} | Panenka`,
    description: `Career statistics and match history for ${player.fullName}.`,
  };
}

export default async function PlayerProfilePage({
  params,
}: PlayerProfilePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const player = await getPlayerById(resolvedParams.id);

  if (!player) {
    notFound();
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PlayerProfileView player={player} />
    </main>
  );
}
