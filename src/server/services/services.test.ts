import { describe, it, expect } from "vitest";
import {
  getDashboardSummary,
  getGoalAssistBreakdown,
  comparePlayers,
} from "./stats.service";
import {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  archivePlayer,
  restorePlayer,
  deletePlayer,
  checkDuplicatePlayer,
} from "./player.service";
import {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
} from "./match.service";
import {
  getCompetitions,
  getCompetitionById,
} from "./competition.service";
import { Position, PreferredFoot, MatchVenue, MatchStatus, AppearanceStatus } from "@prisma/client";

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

  it("competition.service returns competitions and match counts", async () => {
    const comps = await getCompetitions();
    expect(comps.length).toBeGreaterThan(0);
    expect(comps[0]?._count.matches).toBeDefined();

    const firstId = comps[0]!.id;
    const comp = await getCompetitionById(firstId);
    expect(comp?.id).toBe(firstId);
    expect(comp?._count.matches).toBeGreaterThan(0);
  });

  it("comparePlayers provides structured comparison between 2 players", async () => {
    const playersRes = await getPlayers({ pageSize: 5 });
    expect(playersRes.data.length).toBeGreaterThanOrEqual(2);
    const p1 = playersRes.data[0]!;
    const p2 = playersRes.data[1]!;

    const comparison = await comparePlayers([p1.id, p2.id]);
    expect(comparison.players.length).toBe(2);
    expect(comparison.comparison.goals).toBeDefined();
    expect(comparison.comparison.appearances).toBeDefined();
    expect(comparison.players[0]?.recentForm).toBeDefined();
  });

  it("player.service validates duplicates and guards deletion of players with performances", async () => {
    const playersRes = await getPlayers({ pageSize: 1 });
    const existingPlayer = playersRes.data[0]!;

    // Duplicate check case-insensitivity
    const isDup = await checkDuplicatePlayer(
      existingPlayer.fullName.toUpperCase(),
      existingPlayer.team,
    );
    expect(isDup).toBe(true);

    // Cannot delete player with performances
    await expect(deletePlayer(existingPlayer.id)).rejects.toThrow(
      "Cannot delete player with recorded performances. Archive them instead.",
    );

    // Create a temporary player with 0 performances
    const tempName = "Integration Test Player " + Date.now();
    const created = await createPlayer({
      fullName: tempName,
      displayName: "Test P.",
      position: Position.CM,
      preferredFoot: PreferredFoot.RIGHT,
      team: "Test FC",
    });
    expect(created.id).toBeDefined();

    // Verify duplicate validation prevents re-creation
    await expect(
      createPlayer({
        fullName: tempName.toLowerCase(),
        position: Position.CM,
        preferredFoot: PreferredFoot.RIGHT,
        team: "Test FC",
      }),
    ).rejects.toThrow("already exists");

    // Archive and restore player
    const archived = await archivePlayer(created.id);
    expect(archived.archivedAt).not.toBeNull();
    const restored = await restorePlayer(created.id);
    expect(restored.archivedAt).toBeNull();

    // Update player
    const updated = await updatePlayer(created.id, {
      displayName: "Updated P.",
    });
    expect(updated.displayName).toBe("Updated P.");

    // Delete player with 0 performances succeeds
    const deleted = await deletePlayer(created.id);
    expect(deleted.id).toBe(created.id);
  });

  it("match.service performs atomic create, update with reconciliation, and delete", async () => {
    const playersRes = await getPlayers({ pageSize: 2 });
    const p1 = playersRes.data[0]!;
    const p2 = playersRes.data[1]!;

    // Create match with performances atomically
    const createdMatch = await createMatch({
      date: new Date("2026-05-01T15:00:00Z"),
      opponent: "Test RFC " + Date.now(),
      team: "FC Panenka",
      venue: MatchVenue.HOME,
      scoreHome: 2,
      scoreAway: 1,
      status: MatchStatus.COMPLETED,
      performances: [
        {
          playerId: p1.id,
          appearanceStatus: AppearanceStatus.STARTED,
          minutesPlayed: 90,
          goals: 2,
          assists: 0,
        },
      ],
    });

    expect(createdMatch.id).toBeDefined();
    expect(createdMatch.performances.length).toBe(1);
    expect(createdMatch.summary.totalGoals).toBe(2);

    // Update match: reconcile performances (add p2, update p1)
    const updatedMatch = await updateMatch(createdMatch.id, {
      scoreHome: 3,
      scoreAway: 1,
      performances: [
        {
          playerId: p1.id,
          appearanceStatus: AppearanceStatus.STARTED,
          minutesPlayed: 80,
          goals: 2,
          assists: 1,
        },
        {
          playerId: p2.id,
          appearanceStatus: AppearanceStatus.SUBSTITUTE_USED,
          minutesPlayed: 10,
          goals: 1,
          assists: 0,
        },
      ],
    });

    expect(updatedMatch.scoreHome).toBe(3);
    expect(updatedMatch.performances.length).toBe(2);
    expect(updatedMatch.summary.totalGoals).toBe(3);
    expect(updatedMatch.summary.totalAssists).toBe(1);

    // Get match by ID
    const fetched = await getMatchById(createdMatch.id);
    expect(fetched?.id).toBe(createdMatch.id);
    expect(fetched?.performances.length).toBe(2);

    // Delete match atomically cascades performances
    const deleted = await deleteMatch(createdMatch.id);
    expect(deleted.id).toBe(createdMatch.id);

    const postDelete = await getMatchById(createdMatch.id);
    expect(postDelete).toBeNull();
  });
});

