import type { Metadata } from "next";
import { getPlayers } from "@/server/services/player.service";
import { getCompetitions } from "@/server/services/competition.service";
import { getMatches } from "@/server/services/match.service";
import { LogMatchForm } from "@/components/matches/log-match-form";

export const metadata: Metadata = {
  title: "Log match",
  description: "Record a result and each player's rating, goals, assists and man of the match.",
};

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const [competitions, players, latest] = await Promise.all([
    getCompetitions(),
    getPlayers({ includeArchived: false, pageSize: 500 }),
    getMatches({ pageSize: 1 }),
  ]);

  // Pre-fill the team name from the latest fixture, else the squad's most common team.
  const counts = new Map<string, number>();
  for (const p of players.data) if (p.team) counts.set(p.team, (counts.get(p.team) ?? 0) + 1);
  const commonTeam = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const defaultTeam = latest.data[0]?.team ?? commonTeam;

  return <LogMatchForm competitions={competitions} availablePlayers={players.data} defaultTeam={defaultTeam} />;
}
