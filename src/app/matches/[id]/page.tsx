import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMatchReport } from "@/server/services/team.service";
import { MatchReportView } from "@/components/matches/match-report";

interface MatchPageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const report = await getMatchReport(params.id);
  if (!report) return { title: "Match not found" };
  const score = report.scoreHome !== null ? ` ${report.goalsFor}–${report.goalsAgainst}` : "";
  return { title: `${report.venue === "AWAY" ? "at" : "vs"} ${report.opponent}${score}` };
}

export default async function MatchPage({ params }: MatchPageProps) {
  const report = await getMatchReport(params.id);
  if (!report) notFound();
  return <MatchReportView report={report} />;
}
