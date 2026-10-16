import { redirect } from "next/navigation";

interface MatchPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function MatchPage({ params }: MatchPageProps) {
  const resolvedParams = await Promise.resolve(params);
  redirect(`/matches/${resolvedParams.id}/edit`);
}
