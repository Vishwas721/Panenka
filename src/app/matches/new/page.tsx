import { getPlayers } from "@/server/services/player.service";
import { getCompetitions } from "@/server/services/competition.service";
import { LogMatchForm } from "@/components/matches/log-match-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log Match",
  description: "Record match results and player performances in Panenka",
};

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const [competitions, playersRes] = await Promise.all([
    getCompetitions(),
    getPlayers({ includeArchived: false, pageSize: 200 }),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <LogMatchForm
        competitions={competitions}
        availablePlayers={playersRes.data}
      />
    </div>
  );
}
