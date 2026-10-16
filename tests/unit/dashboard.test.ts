import { describe, it, expect } from "vitest";
import { getDashboardSummary } from "@/server/services/stats.service";
import { DashboardSummaryCards } from "@/components/dashboard/dashboard-summary-cards";
import { LeaderboardCards } from "@/components/dashboard/leaderboard-cards";
import { PlayerChart } from "@/components/dashboard/player-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";

describe("Dashboard Page & Components", () => {
  it("getDashboardSummary returns all required dashboard metrics and structures", async () => {
    const summary = await getDashboardSummary();

    // Summary Metrics
    expect(summary.totalPlayers).toBeDefined();
    expect(summary.totalPlayers.registered).toBeGreaterThan(0);
    expect(summary.totalPlayers.active).toBeGreaterThanOrEqual(0);
    expect(summary.totalPlayers.archived).toBeGreaterThanOrEqual(0);
    expect(summary.totalPlayers.registered).toBe(
      summary.totalPlayers.active + summary.totalPlayers.archived
    );

    expect(summary.totalMatches).toBeGreaterThan(0);
    expect(summary.totalGoals).toBeGreaterThan(0);
    expect(summary.totalAssists).toBeGreaterThan(0);
    expect(summary.totalContributions).toBe(
      summary.totalGoals + summary.totalAssists
    );

    // Leaderboards
    expect(summary.leaderboard).toBeDefined();
    expect(summary.leaderboard.topScorer.length).toBeGreaterThan(0);
    expect(summary.leaderboard.topAssister.length).toBeGreaterThan(0);
    expect(summary.leaderboard.mostContributions.length).toBeGreaterThan(0);
    expect(summary.leaderboard.bestContributionsPerAppearance.length).toBeGreaterThan(0);

    // Rate leader min threshold handling
    if (summary.bestGoalsPerAppearance) {
      expect(summary.bestGoalsPerAppearance.appearances).toBeGreaterThanOrEqual(3);
      expect(summary.bestGoalsPerAppearance.rate).toBeGreaterThan(0);
      expect(summary.bestGoalsPerAppearance.player.fullName).toBeDefined();
    }

    // Chart players
    expect(summary.chartPlayers).toBeDefined();
    expect(summary.chartPlayers.length).toBeGreaterThan(0);
    expect(summary.chartPlayers[0]?.goalContributions).toBeGreaterThanOrEqual(0);

    // Recent Activity
    expect(summary.recentActivity).toBeDefined();
    expect(summary.recentActivity.recentMatches.length).toBeGreaterThan(0);
    expect(summary.recentActivity.recentPlayers.length).toBeGreaterThan(0);
  });

  it("exports all dashboard components as defined functions", () => {
    expect(DashboardSummaryCards).toBeDefined();
    expect(typeof DashboardSummaryCards).toBe("function");

    expect(LeaderboardCards).toBeDefined();
    expect(typeof LeaderboardCards).toBe("function");

    expect(PlayerChart).toBeDefined();
    expect(typeof PlayerChart).toBe("function");

    expect(RecentActivity).toBeDefined();
    expect(typeof RecentActivity).toBe("function");
  });
});
