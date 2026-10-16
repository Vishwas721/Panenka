"use server";

import {
  getPlayerMilestoneMatches,
  type PlayerMilestoneData,
} from "@/server/services/stats.service";

export type MilestoneActionResult =
  | { success: true; data: PlayerMilestoneData | null }
  | { success: false; error: string };

/**
 * Server action to retrieve matches contributing to a specific player's milestone
 * for interactive drill-down dialogs.
 */
export async function getPlayerMilestoneMatchesAction(
  playerId: string,
  milestoneKey: string,
  competitionId?: string
): Promise<MilestoneActionResult> {
  try {
    const data = await getPlayerMilestoneMatches(
      playerId,
      milestoneKey,
      competitionId
    );
    return { success: true, data };
  } catch (error: any) {
    console.error("getPlayerMilestoneMatchesAction error:", error);
    return {
      success: false,
      error: error?.message || "Failed to load milestone matches",
    };
  }
}
