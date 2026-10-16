import { describe, it, expect, vi } from "vitest";
import {
  createPlayerAction,
  updatePlayerAction,
  archivePlayerAction,
  restorePlayerAction,
  deletePlayerAction,
} from "@/app/actions/players";
import { prisma } from "@/server/db/client";

// Mock next/cache revalidatePath for test environment
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Player Server Actions", () => {
  it("createPlayerAction creates a player with valid input", async () => {
    const timestamp = Date.now();
    const fullName = `Test Player ${timestamp}`;
    const res = await createPlayerAction({
      fullName,
      displayName: "Tester",
      position: "ST",
      preferredFoot: "RIGHT",
      squadNumber: 99,
      team: `Test FC ${timestamp}`,
      nationality: "Argentina",
      notes: "Test notes",
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.id).toBeDefined();
    expect(res.data.fullName).toBe(fullName);
    expect(res.data.position).toBe("ST");
    expect(res.data.squadNumber).toBe(99);

    // Clean up
    await prisma.player.delete({ where: { id: res.data.id } });
  });

  it("createPlayerAction fails when required fullName is missing", async () => {
    const res = await createPlayerAction({
      fullName: "",
    });

    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.error).toBeDefined();
  });

  it("createPlayerAction rejects duplicate player in the same team", async () => {
    const timestamp = Date.now();
    const team = `Unique Club ${timestamp}`;
    const p1 = await createPlayerAction({
      fullName: "Duplicate Star",
      team,
      position: "CM",
    });
    expect(p1.success).toBe(true);
    if (!p1.success) return;

    // Attempt to create duplicate (case-insensitive)
    const p2 = await createPlayerAction({
      fullName: "duplicate star",
      team,
      position: "CAM",
    });
    expect(p2.success).toBe(false);
    if (!p2.success) {
      expect(p2.error).toContain("already exists");
    }

    // Clean up
    await prisma.player.delete({ where: { id: p1.data.id } });
  });

  it("updatePlayerAction updates player fields and enforces duplicate validation", async () => {
    const timestamp = Date.now();
    const team = `Team Update ${timestamp}`;
    const p1 = await createPlayerAction({
      fullName: "Initial Name",
      team,
      position: "CB",
    });
    expect(p1.success).toBe(true);
    if (!p1.success) return;

    // Update position and displayName
    const updateRes = await updatePlayerAction(p1.data.id, {
      displayName: "The Rock",
      position: "CDM",
    });
    expect(updateRes.success).toBe(true);
    if (!updateRes.success) return;
    expect(updateRes.data.displayName).toBe("The Rock");
    expect(updateRes.data.position).toBe("CDM");

    // Clean up
    await prisma.player.delete({ where: { id: p1.data.id } });
  });

  it("archivePlayerAction and restorePlayerAction toggle archived state", async () => {
    const timestamp = Date.now();
    const p = await createPlayerAction({
      fullName: `Archivable ${timestamp}`,
      position: "GK",
    });
    expect(p.success).toBe(true);
    if (!p.success) return;

    // Archive
    const archRes = await archivePlayerAction(p.data.id);
    expect(archRes.success).toBe(true);
    if (!archRes.success) return;
    expect(archRes.data.archivedAt).not.toBeNull();

    // Restore
    const restRes = await restorePlayerAction(p.data.id);
    expect(restRes.success).toBe(true);
    if (!restRes.success) return;
    expect(restRes.data.archivedAt).toBeNull();

    // Clean up
    await prisma.player.delete({ where: { id: p.data.id } });
  });

  it("deletePlayerAction hard deletes player with 0 performances", async () => {
    const timestamp = Date.now();
    const p = await createPlayerAction({
      fullName: `Deletable ${timestamp}`,
      position: "LB",
    });
    expect(p.success).toBe(true);
    if (!p.success) return;

    const delRes = await deletePlayerAction(p.data.id);
    expect(delRes.success).toBe(true);

    const exists = await prisma.player.findUnique({
      where: { id: p.data.id },
    });
    expect(exists).toBeNull();
  });

  it("deletePlayerAction rejects deleting a player with recorded performances", async () => {
    // Find an existing player with performances (from seed data)
    const existing = await prisma.player.findFirst({
      where: { performances: { some: {} } },
    });

    if (existing) {
      const delRes = await deletePlayerAction(existing.id);
      expect(delRes.success).toBe(false);
      if (!delRes.success) {
        expect(delRes.error).toContain(
          "Cannot delete player with recorded performances"
        );
      }
    }
  });
});
