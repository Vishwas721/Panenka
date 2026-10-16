import { describe, it, expect } from "vitest";
import { getDashboardSummary, getGoalAssistBreakdown } from "./stats.service";
import { getPlayers, getPlayerById } from "./player.service";
import { getMatches } from "./match.service";

describe("Services Integration", () => {
  it("getDashboardSummary returns accurate aggregated totals", async () => {
    const summary = await getDashboardSummary();
    expect(summary.totalPlayers.registered).toBeGreaterThan(0);
    expect(summary.totalMatches).toBeGreaterThan(0);
    expect(summary.totalGoals).toBeGreaterThan(0);
    expect(summary.leaderboard.topScorer.length).toBeGreaterThan(0);
    // Rossi should be top scorer with 16 goals in demo
    expect(summary.leaderboard.topScorer[0]?.fullName).toBe("Mateo Rossi");
  });

  it("getGoalAssistBreakdown computes Hat-trick Kings and Brace Masters", async () => {
    const breakdown = await getGoalAssistBreakdown({});
    expect(breakdown.hatTrickKings.length).toBeGreaterThan(0);
    expect(breakdown.braceMasters.length).toBeGreaterThan(0);
    expect(breakdown.table.data.length).toBeGreaterThan(0);
  });

  it("getPlayers returns paginated players with computed stats", async () => {
    const res = await getPlayers({ page: 1, pageSize: 10 });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.total).toBeGreaterThan(0);
    expect(res.data[0]?.stats).toBeDefined();
  });

  it("getMatches returns completed and scheduled matches", async () => {
    const res = await getMatches({ page: 1, pageSize: 10 });
    expect(res.data.length).toBeGreaterThan(0);
  });
});
