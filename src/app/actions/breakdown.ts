"use server";

import {
  getPlayerMilestoneMatches,
  type PlayerMilestoneData,
} from "@/server/services/stats.service";

export type MilestoneActionResult =
  | { success: true; data: PlayerMilestoneData }
  | { success: false; error: string };

/**
 * Server action to fetch match details behind a player's milestone count.
 */
export async function getPlayerMilestoneMatchesAction(
  playerId: string,
  milestoneKey: string = "all",
  competitionId?: string
): Promise<MilestoneActionResult> {
  try {
    if (!playerId || typeof playerId !== "string") {
      return { success: false, error: "Player ID is required." };
    }

    const data = await getPlayerMilestoneMatches(
      playerId,
      milestoneKey,
      competitionId
    );

    if (!data) {
      return { success: false, error: "Player not found." };
    }

    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch milestone match details.";
    return { success: false, error: message };
  }
}
