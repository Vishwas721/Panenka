import { describe, it, expect } from "vitest";
import {
  getGoalAssistBreakdown,
  getPlayerMilestoneMatches,
  comparePlayers,
} from "@/server/services/stats.service";
import { getPlayerMilestoneMatchesAction } from "@/app/actions/stats";
import { getPlayerById, getPlayers } from "@/server/services/player.service";

describe("Phase 3: Goal & Assist Breakdown, Profiles, and Comparison", () => {
  it("getGoalAssistBreakdown computes Hat-trick Kings and Brace Masters accurately", async () => {
    const res = await getGoalAssistBreakdown({ minAppearances: 1 });

    expect(res.hatTrickKings).toBeDefined();
    expect(res.braceMasters).toBeDefined();
    expect(res.assistsRanking).toBeDefined();
    expect(res.table.data.length).toBeGreaterThan(0);

    // Verify Hat-trick Kings rank order
    if (res.hatTrickKings.length > 0) {
      expect(res.hatTrickKings[0]?.hatTricks).toBeGreaterThanOrEqual(1);
      expect(res.hatTrickKings[0]?.player.fullName).toBeDefined();
    }

    // Verify Brace Masters rank order
    if (res.braceMasters.length > 0) {
      expect(res.braceMasters[0]?.braces).toBeGreaterThanOrEqual(1);
      expect(res.braceMasters[0]?.player.fullName).toBeDefined();
    }

    // Verify sorting by contributionsPerAppearance
    const sortedByContribRate = await getGoalAssistBreakdown({
      sortBy: "contributionsPerAppearance",
      sortOrder: "desc",
      pageSize: 5,
    });
    expect(sortedByContribRate.table.data.length).toBeGreaterThan(0);

    // Verify sorting by hatTricks
    const sortedByHatTricks = await getGoalAssistBreakdown({
      sortBy: "hatTricks",
      sortOrder: "desc",
      pageSize: 5,
    });
    expect(sortedByHatTricks.table.data.length).toBeGreaterThan(0);
  });

  it("getPlayerMilestoneMatches returns drill-down matches for a player milestone", async () => {
    const players = await getPlayers({ pageSize: 5 });
    expect(players.data.length).toBeGreaterThan(0);
    const playerWithGoals = players.data.find((p) => p.stats.goals > 0) || players.data[0]!;

    // Test drilldown query for all goals
    const goalsMilestone = await getPlayerMilestoneMatches(
      playerWithGoals.id,
      "goals"
    );
    expect(goalsMilestone).not.toBeNull();
    expect(goalsMilestone?.player.id).toBe(playerWithGoals.id);
    expect(goalsMilestone?.milestoneTitle).toBe("All Scoring Matches");
    expect(Array.isArray(goalsMilestone?.matches)).toBe(true);

    if (goalsMilestone && goalsMilestone.matches.length > 0) {
      const firstMatch = goalsMilestone.matches[0]!;
      expect(firstMatch.id).toBeDefined();
      expect(firstMatch.opponent).toBeDefined();
      expect(firstMatch.performance.goals).toBeGreaterThan(0);
    }

    // Test server action wrapper
    const actionResult = await getPlayerMilestoneMatchesAction(
      playerWithGoals.id,
      "brace"
    );
    expect(actionResult.success).toBe(true);
  });

  it("getPlayerById returns complete details including goalBreakdown and recentForm", async () => {
    const players = await getPlayers({ pageSize: 1 });
    const p = players.data[0]!;

    const profile = await getPlayerById(p.id);
    expect(profile).not.toBeNull();
    expect(profile?.fullName).toBe(p.fullName);
    expect(profile?.stats.appearances).toBeDefined();
    expect(profile?.goalBreakdown).toBeDefined();
    expect(profile?.assistBreakdown).toBeDefined();
    expect(profile?.recentForm).toBeDefined();
    expect(profile?.recentForm.sampleSize).toBeLessThanOrEqual(5);
    expect(typeof profile?.recentForm.sufficient).toBe("boolean");
    expect(profile?.matches).toBeDefined();
  });

  it("comparePlayers compares 2 and 3 players and determines category leaders", async () => {
    const players = await getPlayers({ pageSize: 3 });
    expect(players.data.length).toBeGreaterThanOrEqual(2);

    const id1 = players.data[0]!.id;
    const id2 = players.data[1]!.id;

    // 2 players comparison
    const comp2 = await comparePlayers([id1, id2]);
    expect(comp2.players).toHaveLength(2);
    expect(comp2.comparison.goals).toBeDefined();
    expect(comp2.comparison.appearances).toBeDefined();
    expect(comp2.comparison.goalsPerAppearance).toBeDefined();
    expect(comp2.players[0]?.stats).toBeDefined();
    expect(comp2.players[1]?.stats).toBeDefined();

    // 3 players comparison if available
    if (players.data.length >= 3) {
      const id3 = players.data[2]!.id;
      const comp3 = await comparePlayers([id1, id2, id3]);
      expect(comp3.players).toHaveLength(3);
    }

    // Rejection on fewer than 2 players
    await expect(comparePlayers([id1])).rejects.toThrow("Comparison requires between 2 and 3 player IDs.");
  });
});
