"use server";

import { revalidatePath } from "next/cache";
import {
  createPlayer,
  updatePlayer,
  archivePlayer,
  restorePlayer,
  deletePlayer,
} from "@/server/services/player.service";
import { z } from "zod";
import {
  createPlayerSchema,
  updatePlayerSchema,
  type CreatePlayerInput,
  type UpdatePlayerInput,
} from "@/lib/validation";
import type { Player } from "@prisma/client";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server action to create a new player.
 * Validates with Zod schema and enforces team-scoped duplicate name check.
 */
export type CreatePlayerFormInput = z.input<typeof createPlayerSchema>;

export async function createPlayerAction(
  input: CreatePlayerFormInput
): Promise<ActionResult<Player>> {
  try {
    const parseResult = createPlayerSchema.safeParse(input);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      parseResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(err.message);
      });
      return {
        success: false,
        error: parseResult.error.errors[0]?.message || "Validation failed",
        fieldErrors,
      };
    }

    const player = await createPlayer(parseResult.data);
    revalidatePath("/players");
    revalidatePath("/");
    return { success: true, data: player };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create player.";
    return { success: false, error: message };
  }
}

/**
 * Server action to update an existing player.
 */
export async function updatePlayerAction(
  id: string,
  input: UpdatePlayerInput
): Promise<ActionResult<Player>> {
  try {
    const parseResult = updatePlayerSchema.safeParse(input);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      parseResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(err.message);
      });
      return {
        success: false,
        error: parseResult.error.errors[0]?.message || "Validation failed",
        fieldErrors,
      };
    }

    const player = await updatePlayer(id, parseResult.data);
    revalidatePath("/players");
    revalidatePath(`/players/${id}`);
    revalidatePath("/");
    return { success: true, data: player };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update player.";
    return { success: false, error: message };
  }
}

/**
 * Server action to archive a player.
 */
export async function archivePlayerAction(
  id: string
): Promise<ActionResult<Player>> {
  try {
    const player = await archivePlayer(id);
    revalidatePath("/players");
    revalidatePath(`/players/${id}`);
    revalidatePath("/");
    return { success: true, data: player };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to archive player.";
    return { success: false, error: message };
  }
}

/**
 * Server action to restore an archived player.
 */
export async function restorePlayerAction(
  id: string
): Promise<ActionResult<Player>> {
  try {
    const player = await restorePlayer(id);
    revalidatePath("/players");
    revalidatePath(`/players/${id}`);
    revalidatePath("/");
    return { success: true, data: player };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to restore player.";
    return { success: false, error: message };
  }
}

/**
 * Server action to hard delete a player.
 * Players with recorded performances will be rejected by the service layer.
 */
export async function deletePlayerAction(
  id: string
): Promise<ActionResult<Player>> {
  try {
    const player = await deletePlayer(id);
    revalidatePath("/players");
    revalidatePath(`/players/${id}`);
    revalidatePath("/");
    return { success: true, data: player };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete player.";
    return { success: false, error: message };
  }
}
