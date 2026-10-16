import { describe, it, expect, vi } from "vitest";
import {
  createMatchAction,
  updateMatchAction,
  deleteMatchAction,
} from "@/app/actions/matches";
import { getPlayers } from "@/server/services/player.service";
import { getMatchById } from "@/server/services/match.service";
import { AppearanceStatus, MatchStatus, MatchVenue } from "@prisma/client";

// Mock next/cache revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Match Management & Server Actions", () => {
  it("rejects match creation when opponent is missing", async () => {
    const res = await createMatchAction({
      date: new Date().toISOString(),
      opponent: "",
      status: "COMPLETED",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.error).toMatch(/opponent/i);
  });

  it("rejects match when only one score is provided (both or neither)", async () => {
    const res = await createMatchAction({
      date: new Date().toISOString(),
      opponent: "Test FC",
      scoreHome: 3,
      scoreAway: null,
      status: "COMPLETED",
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/both home and away scores/i);
  });

  it("rejects performance stats for players who did not appear", async () => {
    const playersRes = await getPlayers({ pageSize: 1 });
    const p1 = playersRes.data[0]!;

    const res = await createMatchAction({
      date: new Date().toISOString(),
      opponent: "Test FC",
      status: "COMPLETED",
      performances: [
        {
          playerId: p1.id,
          appearanceStatus: AppearanceStatus.DID_NOT_PLAY,
          goals: 1, // Invalid: cannot have goals if not appeared
          assists: 0,
        },
      ],
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/cannot have goals/i);
  });

  it("atomically creates match, updates with reconciled performances, and deletes cascading", async () => {
    const playersRes = await getPlayers({ pageSize: 2 });
    expect(playersRes.data.length).toBeGreaterThanOrEqual(2);
    const p1 = playersRes.data[0]!;
    const p2 = playersRes.data[1]!;

    // 1. Create match atomically
    const createRes = await createMatchAction({
      date: new Date("2026-06-01T14:00:00Z").toISOString(),
      opponent: "Unit Test Rovers",
      team: "FC Panenka",
      venue: MatchVenue.HOME,
      scoreHome: 3,
      scoreAway: 1,
      status: MatchStatus.COMPLETED,
      notes: "Testing atomic match creation",
      performances: [
        {
          playerId: p1.id,
          appearanceStatus: AppearanceStatus.STARTED,
          minutesPlayed: 90,
          goals: 2,
          assists: 1,
          notes: "Player of the match",
        },
        {
          playerId: p2.id,
          appearanceStatus: AppearanceStatus.SUBSTITUTE_USED,
          minutesPlayed: 25,
          goals: 1,
          assists: 0,
        },
      ],
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data).toBeDefined();
    const matchId = createRes.data!.id;

    // Verify stored match
    const createdMatch = await getMatchById(matchId);
    expect(createdMatch).not.toBeNull();
    expect(createdMatch?.opponent).toBe("Unit Test Rovers");
    expect(createdMatch?.scoreHome).toBe(3);
    expect(createdMatch?.performances.length).toBe(2);
    expect(createdMatch?.summary.totalGoals).toBe(3);
    expect(createdMatch?.summary.scorers.length).toBe(2);

    // 2. Update match: reconcile performances (remove p2, update p1)
    const updateRes = await updateMatchAction(matchId, {
      scoreHome: 2,
      scoreAway: 1,
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

    expect(updateRes.success).toBe(true);
    const updatedMatch = await getMatchById(matchId);
    expect(updatedMatch?.scoreHome).toBe(2);
    expect(updatedMatch?.performances.length).toBe(1);
    expect(updatedMatch?.performances[0]?.playerId).toBe(p1.id);
    expect(updatedMatch?.summary.totalGoals).toBe(2);

    // 3. Delete match: cascades performances
    const deleteRes = await deleteMatchAction(matchId);
    expect(deleteRes.success).toBe(true);

    const postDelete = await getMatchById(matchId);
    expect(postDelete).toBeNull();
  });
});
