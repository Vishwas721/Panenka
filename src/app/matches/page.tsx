import { getMatches } from "@/server/services/match.service";
import { MatchesList } from "@/components/matches/matches-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matches",
  description: "View fixtures, match results, and individual player performances in Panenka",
};

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const paginatedMatches = await getMatches({ pageSize: 100 });

  return (
    <div className="space-y-6 pb-12">
      <MatchesList initialMatches={paginatedMatches.data} />
    </div>
  );
}
