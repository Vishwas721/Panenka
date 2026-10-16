"use server";

import { revalidatePath } from "next/cache";
import {
  createMatch,
  updateMatch,
  deleteMatch,
} from "@/server/services/match.service";
import {
  createMatchSchema,
  updateMatchSchema,
  type CreateMatchInput,
  type UpdateMatchInput,
} from "@/lib/validation";

/**
 * Revalidates all routes affected by match mutations.
 */
function revalidateMatchRoutes() {
  revalidatePath("/matches");
  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath("/breakdown");
}

function cleanInput(raw: any) {
  if (!raw || typeof raw !== "object") return raw;
  const cleaned = { ...raw };

  if (cleaned.venue === "" || cleaned.venue === "NONE") {
    cleaned.venue = null;
  }

  if (cleaned.competitionId === "") {
    cleaned.competitionId = undefined;
  }

  if (cleaned.scoreHome === "" || cleaned.scoreHome === undefined) {
    cleaned.scoreHome = null;
  } else if (cleaned.scoreHome !== null && typeof cleaned.scoreHome === "string") {
    cleaned.scoreHome = Number.parseInt(cleaned.scoreHome, 10);
  }

  if (cleaned.scoreAway === "" || cleaned.scoreAway === undefined) {
    cleaned.scoreAway = null;
  } else if (cleaned.scoreAway !== null && typeof cleaned.scoreAway === "string") {
    cleaned.scoreAway = Number.parseInt(cleaned.scoreAway, 10);
  }

  if (Array.isArray(cleaned.performances)) {
    cleaned.performances = cleaned.performances.map((perf: any) => ({
      ...perf,
      minutesPlayed:
        perf.minutesPlayed === "" ||
        perf.minutesPlayed === null ||
        perf.minutesPlayed === undefined
          ? null
          : Number.parseInt(perf.minutesPlayed, 10),
      goals: Number(perf.goals) || 0,
      assists: Number(perf.assists) || 0,
    }));
  }

  return cleaned;
}

export async function createMatchAction(rawInput: unknown) {
  try {
    const cleaned = cleanInput(rawInput);
    const validatedData = createMatchSchema.parse(cleaned) as CreateMatchInput;
    const match = await createMatch(validatedData);
    revalidateMatchRoutes();
    return { success: true, data: match };
  } catch (error: any) {
    console.error("createMatchAction error:", error);
    const message =
      error?.issues?.[0]?.message || error?.message || "Failed to create match";
    return { success: false, error: message };
  }
}

export async function updateMatchAction(id: string, rawInput: unknown) {
  try {
    const cleaned = cleanInput(rawInput);
    const validatedData = updateMatchSchema.parse(cleaned) as UpdateMatchInput;
    const match = await updateMatch(id, validatedData);
    revalidateMatchRoutes();
    return { success: true, data: match };
  } catch (error: any) {
    console.error("updateMatchAction error:", error);
    const message =
      error?.issues?.[0]?.message || error?.message || "Failed to update match";
    return { success: false, error: message };
  }
}

export async function deleteMatchAction(id: string) {
  try {
    const match = await deleteMatch(id);
    revalidateMatchRoutes();
    return { success: true, data: match };
  } catch (error: any) {
    console.error("deleteMatchAction error:", error);
    const message = error?.message || "Failed to delete match";
    return { success: false, error: message };
  }
}
