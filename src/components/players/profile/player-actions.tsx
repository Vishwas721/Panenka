"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlayerFormDialog, type EditablePlayer } from "@/components/players/player-form-dialog";
import { archivePlayerAction, deletePlayerAction, restorePlayerAction } from "@/app/actions/players";

/** Edit / archive / delete controls for the profile hero. Delete only exists for players with no appearances. */
export function PlayerActions({ player, archived, apps }: { player: EditablePlayer; archived: boolean; apps: number }) {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState<"archive" | "delete" | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (kind: "archive" | "restore" | "delete") => {
    setBusy(true);
    setError(null);
    const res =
      kind === "archive" ? await archivePlayerAction(player.id) : kind === "restore" ? await restorePlayerAction(player.id) : await deletePlayerAction(player.id);
    setBusy(false);
    setConfirm(null);
    if (!res.success) return setError(res.error);
    if (kind === "delete") router.push("/players");
    else router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PlayerFormDialog
        player={player}
        onSuccess={() => router.refresh()}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
      />
      {archived ? (
        <Button variant="outline" size="sm" disabled={busy} onClick={() => run("restore")}>
          <ArchiveRestore /> Restore
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setConfirm("archive")}>
          <Archive /> Archive
        </Button>
      )}
      {apps === 0 && (
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirm("delete")}>
          <Trash2 /> Delete
        </Button>
      )}
      {error && <p className="w-full text-xs text-destructive">{error}</p>}

      <ConfirmDialog
        open={confirm === "archive"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Archive ${player.fullName}?`}
        description="Their card leaves the squad and squad honours, but every match and stat is kept. You can restore them any time."
        confirmText="Archive"
        isLoading={busy}
        onConfirm={() => run("archive")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Delete ${player.fullName}?`}
        description="This permanently removes the player. Only possible because they have no recorded appearances."
        confirmText="Delete"
        variant="destructive"
        isLoading={busy}
        onConfirm={() => run("delete")}
      />
    </div>
  );
}
