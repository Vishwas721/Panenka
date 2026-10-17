"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCompetition } from "@/server/services/competition.service";

const createCompetitionSchema = z.object({
  name: z.string().trim().min(1, "Competition name is required").max(120, "Name must be 120 characters or fewer"),
  season: z
    .string()
    .trim()
    .max(20, "Season must be 20 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export type CompetitionActionResult =
  | { success: true; data: { id: string; name: string; season: string | null } }
  | { success: false; error: string };

export async function createCompetitionAction(input: unknown): Promise<CompetitionActionResult> {
  const parsed = createCompetitionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid competition" };
  }
  try {
    const c = await createCompetition(parsed.data);
    revalidatePath("/matches");
    revalidatePath("/matches/new");
    return { success: true, data: { id: c.id, name: c.name, season: c.season } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create competition" };
  }
}
