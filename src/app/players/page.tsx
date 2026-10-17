import type { Metadata } from "next";
import { getSquadInsights } from "@/server/services/insights.service";
import { toCardData } from "@/components/pk/card-data";
import { SquadView, type SquadRow } from "@/components/players/squad-view";

export const metadata: Metadata = {
  title: "Squad",
  description: "Every player as a collectible card — overall, attributes and keywords built from match data.",
};

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const insights = await getSquadInsights({ includeArchived: true });

  const rows: SquadRow[] = insights.map((i) => ({
    card: toCardData(i),
    archived: Boolean(i.player.archivedAt),
    team: i.player.team,
    gaPerApp: i.profile.perApp?.ga ?? null,
    last5: i.profile.rating.last5,
    keywordCount: i.keywords.unlocked.length,
    topKeyword: i.keywords.signature[0] ?? null,
  }));

  const counts = new Map<string, number>();
  for (const i of insights) if (i.player.team) counts.set(i.player.team, (counts.get(i.player.team) ?? 0) + 1);
  const defaultTeam = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return <SquadView rows={rows} defaultTeam={defaultTeam} />;
}
