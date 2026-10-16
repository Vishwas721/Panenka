import { describe, it, expect } from "vitest";
import { getDashboardSummary } from "@/server/services/stats.service";
import { getTeamOverview, getFixtures, getMatchReport } from "@/server/services/team.service";
import { Scoreboard, ResultTiles } from "@/components/dashboard/scoreboard";
import { LeaderBoards } from "@/components/dashboard/leaders";
import { SquadTrendChart } from "@/components/dashboard/squad-trend-chart";
import { RareKeywords, UnlockWatch } from "@/components/dashboard/squad-pulse";

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

  it("getTeamOverview record adds up and is consistent with fixtures", async () => {
    const [team, fixtures] = await Promise.all([getTeamOverview(), getFixtures()]);
    expect(team.wins + team.draws + team.losses).toBe(team.scored);
    expect(team.scored).toBeLessThanOrEqual(team.matches);
    expect(team.last10.length).toBeLessThanOrEqual(10);
    expect(fixtures.filter((f) => f.status === "COMPLETED").length).toBe(team.matches);
    for (const f of fixtures) expect(f.motm === null || typeof f.motm.name === "string").toBe(true);
  });

  it("getMatchReport returns null for unknown ids and lines for real ones", async () => {
    expect(await getMatchReport("does-not-exist")).toBeNull();
    const [first] = await getFixtures();
    if (first) {
      const report = await getMatchReport(first.id);
      expect(report?.id).toBe(first.id);
      expect(report!.lines.filter((l) => l.motm).length).toBeLessThanOrEqual(1);
    }
  });

  it("exports all dashboard components as defined functions", () => {
    for (const c of [Scoreboard, ResultTiles, LeaderBoards, SquadTrendChart, RareKeywords, UnlockWatch]) {
      expect(typeof c).toBe("function");
    }
  });
});
