"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlayerFormDialog } from "@/components/players/player-form-dialog";
import { PositionBadge } from "@/components/players/player-card";
import {
  archivePlayerAction,
  restorePlayerAction,
  deletePlayerAction,
} from "@/app/actions/players";
import type { PlayerDetail } from "@/server/services/player.service";
import {
  ArrowLeft,
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  Calendar,
  Globe,
  Footprints,
  Shirt,
  Shield,
  Clock,
  Flame,
  Award,
} from "lucide-react";

export function PlayerProfileView({ player }: { player: PlayerDetail }) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const isArchived = Boolean(player.archivedAt);
  const { stats, recentForm, matches } = player;

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await archivePlayerAction(player.id);
      setIsArchiving(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await restorePlayerAction(player.id);
      setIsRestoring(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await deletePlayerAction(player.id);
      if (res.success) {
        setIsDeleting(false);
        router.push("/players");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/players"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Players
        </Link>
      </div>

      {/* Header Card */}
      <Card className="overflow-hidden border-border bg-card">
        <div
          className={`h-2 w-full ${
            isArchived ? "bg-muted-foreground/30" : "bg-primary"
          }`}
        />
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <PlayerAvatar
                  name={player.fullName}
                  imageUrl={player.imageUrl}
                  size="xl"
                />
                {player.squadNumber !== null && (
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground shadow">
                    {player.squadNumber}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {player.fullName}
                  </h1>
                  {player.displayName &&
                    player.displayName !== player.fullName && (
                      <span className="text-lg text-muted-foreground">
                        &ldquo;{player.displayName}&rdquo;
                      </span>
                    )}
                  {isArchived && (
                    <Badge variant="secondary" className="ml-2">
                      Archived
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <PositionBadge position={player.position} />
                  {player.team && (
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <Shield className="h-3.5 w-3.5" />
                      {player.team}
                    </span>
                  )}
                  {player.nationality && (
                    <span className="inline-flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {player.nationality}
                    </span>
                  )}
                  {player.preferredFoot !== "UNKNOWN" && (
                    <span className="inline-flex items-center gap-1">
                      <Footprints className="h-3.5 w-3.5" />
                      {player.preferredFoot.toLowerCase()} foot
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="mr-1.5 h-4 w-4" />
                Edit Profile
              </Button>
              {isArchived ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-emerald-500 hover:text-emerald-400"
                  onClick={() => setIsRestoring(true)}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Restore
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-500 hover:text-amber-400"
                  onClick={() => setIsArchiving(true)}
                >
                  <Archive className="mr-1.5 h-4 w-4" />
                  Archive
                </Button>
              )}
              {stats.appearances === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          {player.notes && (
            <div className="mt-4 border-t border-border/50 pt-4 text-sm text-foreground/85">
              <span className="font-semibold text-muted-foreground">Notes: </span>
              {player.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Appearances
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums">
              {stats.appearances}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {matches.filter((m) => m.appearanceStatus === "STARTED").length} starts ·{" "}
              {matches.filter((m) => m.appearanceStatus === "SUBSTITUTE_USED").length} sub
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Goals
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-primary">
              {stats.goals}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {stats.goalsPerAppearance !== null
                ? `${stats.goalsPerAppearance.toFixed(2)} / app`
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assists
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-sky-400">
              {stats.assists}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {stats.assistsPerAppearance !== null
                ? `${stats.assistsPerAppearance.toFixed(2)} / app`
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contributions (G+A)
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-purple-400">
              {stats.goalContributions}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {stats.contributionsPerAppearance !== null
                ? `${stats.contributionsPerAppearance.toFixed(2)} / app`
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Minutes Played
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums">
              {matches.some((m) => m.minutesPlayed !== null)
                ? matches.reduce((sum, m) => sum + (m.minutesPlayed ?? 0), 0)
                : "—"}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {matches.length > 0 ? "Total recorded" : "No minutes"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Form
            </div>
            <div className="mt-1 flex items-center justify-center gap-1">
              <Flame className="h-5 w-5 text-amber-500" />
              <span className="font-mono text-xl font-bold text-amber-500 tabular-nums">
                {recentForm.goals}G + {recentForm.assists}A
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              in last {recentForm.sampleSize} appearances
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Match History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No match appearances recorded for this player yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Competition</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Minutes</TableHead>
                    <TableHead className="text-right">Goals</TableHead>
                    <TableHead className="text-right">Assists</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((perf) => (
                    <TableRow key={perf.performanceId}>
                      <TableCell className="font-mono text-xs">
                        {new Date(perf.match.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {perf.match.competition?.name ?? "Friendly / Exhibition"}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {perf.match.opponent}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {perf.appearanceStatus.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {perf.minutesPlayed !== null ? `${perf.minutesPlayed}'` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold tabular-nums text-primary">
                        {perf.goals}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold tabular-nums text-sky-400">
                        {perf.assists}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <PlayerFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        player={player}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          router.refresh();
        }}
      />

      {/* Archive Confirm */}
      <ConfirmDialog
        open={isArchiving}
        onOpenChange={setIsArchiving}
        title={`Archive ${player.fullName}?`}
        description="Archiving this player preserves all match history and stats, but removes them from active squad selections."
        confirmText="Archive Player"
        isLoading={isLoading}
        onConfirm={handleArchive}
      />

      {/* Restore Confirm */}
      <ConfirmDialog
        open={isRestoring}
        onOpenChange={setIsRestoring}
        title={`Restore ${player.fullName}?`}
        description="This will restore the player to active squad status."
        confirmText="Restore Player"
        isLoading={isLoading}
        onConfirm={handleRestore}
      />

      {/* Delete Confirm (for 0 appearances) */}
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title={`Permanently Delete ${player.fullName}?`}
        description="This player has no recorded performances. Are you sure you want to permanently delete this profile?"
        confirmText="Delete Permanently"
        variant="destructive"
        isLoading={isLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
