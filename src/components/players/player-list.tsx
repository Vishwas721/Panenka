"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlayerFormDialog } from "@/components/players/player-form-dialog";
import { PlayerCard, PositionBadge } from "@/components/players/player-card";
import {
  archivePlayerAction,
  restorePlayerAction,
  deletePlayerAction,
} from "@/app/actions/players";
import type { PlayerWithStats } from "@/server/services/player.service";
import {
  MoreHorizontal,
  Edit,
  Eye,
  Archive,
  RotateCcw,
  Trash2,
  LayoutGrid,
  List,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export interface PlayerListProps {
  players: PlayerWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (field: string) => void;
  onPageChange?: (page: number) => void;
}

export function PlayerList({
  players,
  total,
  page,
  pageSize,
  totalPages,
  sortBy = "name",
  sortOrder = "asc",
  onSortChange,
  onPageChange,
}: PlayerListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");

  // Dialog states
  const [editingPlayer, setEditingPlayer] =
    React.useState<PlayerWithStats | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const [viewingPlayer, setViewingPlayer] =
    React.useState<PlayerWithStats | null>(null);

  const [archivingPlayer, setArchivingPlayer] =
    React.useState<PlayerWithStats | null>(null);
  const [isArchiveLoading, setIsArchiveLoading] = React.useState(false);

  const [restoringPlayer, setRestoringPlayer] =
    React.useState<PlayerWithStats | null>(null);
  const [isRestoreLoading, setIsRestoreLoading] = React.useState(false);

  const [deletingPlayer, setDeletingPlayer] =
    React.useState<PlayerWithStats | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = React.useState(false);
  const [deleteBlockedPlayer, setDeleteBlockedPlayer] =
    React.useState<PlayerWithStats | null>(null);

  const [actionError, setActionError] = React.useState<string | null>(null);

  // Handle Edit
  const handleEdit = (player: PlayerWithStats) => {
    setEditingPlayer(player);
    setIsEditDialogOpen(true);
  };

  // Handle Archive
  const handleArchiveConfirm = async () => {
    if (!archivingPlayer) return;
    setIsArchiveLoading(true);
    setActionError(null);
    try {
      const res = await archivePlayerAction(archivingPlayer.id);
      if (!res.success) {
        setActionError(res.error);
      } else {
        setArchivingPlayer(null);
        router.refresh();
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to archive player."
      );
    } finally {
      setIsArchiveLoading(false);
    }
  };

  // Handle Restore
  const handleRestoreConfirm = async () => {
    if (!restoringPlayer) return;
    setIsRestoreLoading(true);
    setActionError(null);
    try {
      const res = await restorePlayerAction(restoringPlayer.id);
      if (!res.success) {
        setActionError(res.error);
      } else {
        setRestoringPlayer(null);
        router.refresh();
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to restore player."
      );
    } finally {
      setIsRestoreLoading(false);
    }
  };

  // Handle Delete request
  const handleDeleteRequest = (player: PlayerWithStats) => {
    if (player.stats.appearances > 0) {
      // Player has recorded performances: hard delete is blocked
      setDeleteBlockedPlayer(player);
    } else {
      // 0 performances: prompt for hard deletion
      setDeletingPlayer(player);
    }
  };

  // Handle Hard Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletingPlayer) return;
    setIsDeleteLoading(true);
    setActionError(null);
    try {
      const res = await deletePlayerAction(deletingPlayer.id);
      if (!res.success) {
        setActionError(res.error);
      } else {
        setDeletingPlayer(null);
        router.refresh();
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete player."
      );
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* View Toggle Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total > 0 ? (
            <span>
              Showing <span className="font-medium text-foreground">{startIndex}</span>–
              <span className="font-medium text-foreground">{endIndex}</span> of{" "}
              <span className="font-medium text-foreground">{total}</span> players
            </span>
          ) : (
            <span>No players found</span>
          )}
        </div>

        <div className="flex items-center space-x-1 rounded-md border border-border p-0.5">
          <Button
            type="button"
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode("table")}
          >
            <List className="mr-1.5 h-3.5 w-3.5" />
            Table
          </Button>
          <Button
            type="button"
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
            Cards
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {players.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <div className="rounded-full bg-secondary p-3 text-muted-foreground">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h3 className="mt-3 text-base font-semibold">No players found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search query, position filter, or active/archived toggle.
          </p>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && players.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead
                  className="cursor-pointer font-medium hover:text-foreground"
                  onClick={() => onSortChange?.("name")}
                >
                  Player{getSortIndicator("name")}
                </TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Team</TableHead>
                <TableHead
                  className="cursor-pointer text-right font-medium hover:text-foreground"
                  onClick={() => onSortChange?.("appearances")}
                >
                  Apps{getSortIndicator("appearances")}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right font-medium hover:text-foreground"
                  onClick={() => onSortChange?.("goals")}
                >
                  Goals{getSortIndicator("goals")}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right font-medium hover:text-foreground"
                  onClick={() => onSortChange?.("assists")}
                >
                  Assists{getSortIndicator("assists")}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right font-medium hover:text-foreground"
                  onClick={() => onSortChange?.("goalContributions")}
                >
                  G+A{getSortIndicator("goalContributions")}
                </TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => {
                const isArchived = Boolean(player.archivedAt);
                return (
                  <TableRow
                    key={player.id}
                    className={`group ${
                      isArchived ? "opacity-60 bg-muted/20" : ""
                    }`}
                  >
                    {/* Player Info */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          name={player.fullName}
                          imageUrl={player.imageUrl}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/players/${player.id}`}
                              className="font-display font-semibold hover:text-primary transition-colors truncate"
                            >
                              {player.fullName}
                            </Link>
                            {player.squadNumber !== null &&
                              player.squadNumber !== undefined && (
                                <span className="font-mono text-xs text-muted-foreground">
                                  #{player.squadNumber}
                                </span>
                              )}
                          </div>
                          {player.displayName &&
                            player.displayName !== player.fullName && (
                              <div className="text-xs text-muted-foreground truncate">
                                {player.displayName}
                              </div>
                            )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Position */}
                    <TableCell>
                      <PositionBadge position={player.position} />
                    </TableCell>

                    {/* Team */}
                    <TableCell>
                      <span className="text-sm text-foreground/80">
                        {player.team || "—"}
                      </span>
                    </TableCell>

                    {/* Appearances */}
                    <TableCell className="text-right font-mono font-bold tabular-nums">
                      {player.stats.appearances}
                    </TableCell>

                    {/* Goals */}
                    <TableCell className="text-right font-mono font-bold tabular-nums text-primary">
                      {player.stats.goals}
                    </TableCell>

                    {/* Assists */}
                    <TableCell className="text-right font-mono font-bold tabular-nums text-sky-400">
                      {player.stats.assists}
                    </TableCell>

                    {/* Goal Contributions */}
                    <TableCell className="text-right font-mono font-bold tabular-nums text-purple-400">
                      {player.stats.goalContributions}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setViewingPlayer(player)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(player)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isArchived ? (
                            <DropdownMenuItem
                              onClick={() => setRestoringPlayer(player)}
                              className="cursor-pointer text-emerald-500 focus:text-emerald-500"
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restore Player
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setArchivingPlayer(player)}
                              className="cursor-pointer text-amber-500 focus:text-amber-500"
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive Player
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(player)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grid / Cards View */}
      {viewMode === "grid" && players.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onView={(p) => setViewingPlayer(p)}
              onEdit={(p) => handleEdit(p)}
              onArchive={(p) => setArchivingPlayer(p)}
              onRestore={(p) => setRestoringPlayer(p)}
              onDelete={(p) => handleDeleteRequest(p)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      <PlayerFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        player={editingPlayer}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          router.refresh();
        }}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(archivingPlayer)}
        onOpenChange={(open) => !open && setArchivingPlayer(null)}
        title={`Archive ${archivingPlayer?.fullName}?`}
        description={
          <span>
            Archiving removes <strong>{archivingPlayer?.fullName}</strong> from active squad selections. All historical match performances, goals, and assists will be preserved. You can restore this player at any time.
          </span>
        }
        confirmText="Archive Player"
        variant="default"
        isLoading={isArchiveLoading}
        onConfirm={handleArchiveConfirm}
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(restoringPlayer)}
        onOpenChange={(open) => !open && setRestoringPlayer(null)}
        title={`Restore ${restoringPlayer?.fullName}?`}
        description={
          <span>
            This will return <strong>{restoringPlayer?.fullName}</strong> to the active squad list and make them available for future matches.
          </span>
        }
        confirmText="Restore Player"
        variant="default"
        isLoading={isRestoreLoading}
        onConfirm={handleRestoreConfirm}
      />

      {/* Delete Confirmation Dialog (for players with 0 performances) */}
      <ConfirmDialog
        open={Boolean(deletingPlayer)}
        onOpenChange={(open) => !open && setDeletingPlayer(null)}
        title={`Permanently Delete ${deletingPlayer?.fullName}?`}
        description={
          <span className="space-y-2 block">
            <span>
              This player has <strong>0 recorded match performances</strong>.
            </span>
            <span className="block text-destructive font-medium">
              This action cannot be undone and will permanently remove this record.
            </span>
          </span>
        }
        confirmText="Permanently Delete"
        variant="destructive"
        isLoading={isDeleteLoading}
        onConfirm={handleDeleteConfirm}
      />

      {/* Blocked Delete Dialog (for players with recorded performances) */}
      <Dialog
        open={Boolean(deleteBlockedPlayer)}
        onOpenChange={(open) => !open && setDeleteBlockedPlayer(null)}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Cannot Delete Player</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-foreground/90">
              <strong>{deleteBlockedPlayer?.fullName}</strong> has{" "}
              <strong>{deleteBlockedPlayer?.stats.appearances}</strong> recorded match appearance
              {deleteBlockedPlayer?.stats.appearances === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            To preserve statistical accuracy and historical match reports, players with recorded performances cannot be permanently deleted. You can archive this player instead to remove them from active selection.
          </p>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteBlockedPlayer(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const target = deleteBlockedPlayer;
                setDeleteBlockedPlayer(null);
                if (target) setArchivingPlayer(target);
              }}
            >
              Archive Instead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick View Profile Dialog */}
      <Dialog
        open={Boolean(viewingPlayer)}
        onOpenChange={(open) => !open && setViewingPlayer(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          {viewingPlayer && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    name={viewingPlayer.fullName}
                    imageUrl={viewingPlayer.imageUrl}
                    size="xl"
                  />
                  <div>
                    <DialogTitle className="font-display text-xl">
                      {viewingPlayer.fullName}
                    </DialogTitle>
                    {viewingPlayer.displayName &&
                      viewingPlayer.displayName !== viewingPlayer.fullName && (
                        <p className="text-xs text-muted-foreground">
                          Known as: {viewingPlayer.displayName}
                        </p>
                      )}
                    <div className="mt-1 flex items-center gap-2">
                      <PositionBadge position={viewingPlayer.position} />
                      {viewingPlayer.squadNumber !== null && (
                        <Badge variant="outline" className="font-mono text-xs">
                          #{viewingPlayer.squadNumber}
                        </Badge>
                      )}
                      {viewingPlayer.archivedAt && (
                        <Badge variant="secondary" className="text-xs">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Bio info */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-secondary/30 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Team / Club:</span>{" "}
                  <span className="font-medium text-foreground">
                    {viewingPlayer.team || "None"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nationality:</span>{" "}
                  <span className="font-medium text-foreground">
                    {viewingPlayer.nationality || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Preferred Foot:</span>{" "}
                  <span className="font-medium text-foreground">
                    {viewingPlayer.preferredFoot}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className="font-medium text-foreground">
                    {viewingPlayer.archivedAt ? "Archived" : "Active"}
                  </span>
                </div>
              </div>

              {/* Stats highlights */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Performance Summary
                </h4>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-md border border-border p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Apps</div>
                    <div className="font-mono text-lg font-bold">
                      {viewingPlayer.stats.appearances}
                    </div>
                  </div>
                  <div className="rounded-md border border-border p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Goals</div>
                    <div className="font-mono text-lg font-bold text-primary">
                      {viewingPlayer.stats.goals}
                    </div>
                  </div>
                  <div className="rounded-md border border-border p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Assists</div>
                    <div className="font-mono text-lg font-bold text-sky-400">
                      {viewingPlayer.stats.assists}
                    </div>
                  </div>
                  <div className="rounded-md border border-border p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">G+A</div>
                    <div className="font-mono text-lg font-bold text-purple-400">
                      {viewingPlayer.stats.goalContributions}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingPlayer.notes && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </h4>
                  <p className="mt-1 text-xs text-foreground/80 whitespace-pre-wrap bg-secondary/20 p-2.5 rounded border border-border/50">
                    {viewingPlayer.notes}
                  </p>
                </div>
              )}

              <DialogFooter className="mt-5 flex items-center justify-between">
                <Link
                  href={`/players/${viewingPlayer.id}`}
                  className="inline-flex items-center text-xs text-primary hover:underline font-medium"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Full Profile & Match History
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const p = viewingPlayer;
                      setViewingPlayer(null);
                      handleEdit(p);
                    }}
                  >
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setViewingPlayer(null)}
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
