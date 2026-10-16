import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlayerInsight } from "@/server/services/insights.service";
import { PlayerProfileView } from "@/components/players/player-profile-view";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const insight = await getPlayerInsight(params.id);
  if (!insight) return { title: "Player not found" };
  return {
    title: insight.player.fullName,
    description: `${insight.player.fullName}: ${insight.ovr ?? "unrated"} overall, ${insight.profile.goals} goals, ${insight.profile.assists} assists, ${insight.profile.motm} MOTM.`,
  };
}

export default async function PlayerProfilePage({ params }: Props) {
  const insight = await getPlayerInsight(params.id);
  if (!insight) notFound();
  return <PlayerProfileView insight={insight} />;
}
