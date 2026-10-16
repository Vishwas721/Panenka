import type { Metadata } from "next";
import { getDashboardSummary } from "@/server/services/stats.service";
import { DashboardSummaryCards } from "@/components/dashboard/dashboard-summary-cards";
import { LeaderboardCards } from "@/components/dashboard/leaderboard-cards";
import { PlayerChart } from "@/components/dashboard/player-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { brand } from "@/config/brand";
import { env } from "@/config/env";
import { Activity, ShieldCheck, Flame } from "lucide-react";

export const metadata: Metadata = {
  title: `Dashboard | ${brand.name}`,
  description: `${brand.tagline}. Squad performance metrics, leaderboards, and tactical match insights.`,
};

// Always fetch fresh data on navigation
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  const minAppsThreshold = env.MIN_APPEARANCES_FOR_RATE ?? 3;

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Tactical Dashboard Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary shadow-xs">
              <Activity className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-foreground">
              Tactical Overview
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {brand.tagline} · Aggregated squad metrics & match performance analytics
          </p>
        </div>

        {/* Engine Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border/70 bg-secondary/30 px-3 py-1.5 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-muted-foreground">ENGINE:</span>
            <span className="font-semibold text-foreground">LIVE</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border/70 bg-secondary/30 px-3 py-1.5 text-xs font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">THRESHOLD:</span>
            <span className="font-bold text-primary tabular-nums">
              {minAppsThreshold} APPS
            </span>
          </div>
        </div>
      </header>

      {/* 1. Summary Metrics */}
      <DashboardSummaryCards
        summary={summary}
        minAppsThreshold={minAppsThreshold}
      />

      {/* 2. Leaderboard Highlights */}
      <LeaderboardCards
        leaderboard={summary.leaderboard}
        minAppsThreshold={minAppsThreshold}
      />

      {/* 3. Main Visualization (Recharts Horizontal Bar Chart) */}
      <section aria-labelledby="production-chart-heading">
        <h2 id="production-chart-heading" className="sr-only">
          Production Visualization
        </h2>
        <PlayerChart players={summary.chartPlayers} />
      </section>

      {/* 4. Recent Activity & Quick Actions */}
      <RecentActivity
        recentMatches={summary.recentActivity.recentMatches}
        recentPlayers={summary.recentActivity.recentPlayers}
      />
    </main>
  );
}
