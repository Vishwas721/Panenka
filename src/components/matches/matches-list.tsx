"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MatchStatus,
  MatchVenue,
} from "@prisma/client";
import type { MatchListItem } from "@/server/services/match.service";
import { deleteMatchAction } from "@/app/actions/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

interface MatchesListProps {
  initialMatches: MatchListItem[];
}

export function MatchesList({ initialMatches }: MatchesListProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [filterTab, setFilterTab] = React.useState<
    "all" | "completed" | "scheduled" | "abandoned"
  >("all");
  const [deletingMatchId, setDeletingMatchId] = React.useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Match to delete object for modal description
  const matchToDelete = React.useMemo(() => {
    return initialMatches.find((m) => m.id === deletingMatchId);
  }, [initialMatches, deletingMatchId]);

  const handleDeleteConfirm = async () => {
    if (!deletingMatchId) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteMatchAction(deletingMatchId);
      if (!res.success) {
        setDeleteError(res.error || "Failed to delete match");
        setIsDeleting(false);
        return;
      }
      setDeletingMatchId(null);
      setIsDeleting(false);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete match");
      setIsDeleting(false);
    }
  };

  // Filter matches
  const filteredMatches = initialMatches.filter((match) => {
    // Filter tab
    if (filterTab === "completed" && match.status !== "COMPLETED") return false;
    if (filterTab === "scheduled" && match.status !== "SCHEDULED") return false;
    if (filterTab === "abandoned" && match.status !== "ABANDONED") return false;

    // Search query
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      match.opponent.toLowerCase().includes(q) ||
      (match.team && match.team.toLowerCase().includes(q)) ||
      (match.competition && match.competition.name.toLowerCase().includes(q)) ||
      (match.venueName && match.venueName.toLowerCase().includes(q)) ||
      match.summary.scorers.some(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          (s.displayName && s.displayName.toLowerCase().includes(q))
      )
    );
  });

  const completedCount = initialMatches.filter(
    (m) => m.status === "COMPLETED"
  ).length;
  const scheduledCount = initialMatches.filter(
    (m) => m.status === "SCHEDULED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
            Matches
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View upcoming fixtures, completed match results, and logged goalscorers.
          </p>
        </div>

        <Link href="/matches/new">
          <Button className="font-semibold shadow-md bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Log Match
          </Button>
        </Link>
      </div>

      {deleteError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive font-medium flex items-center justify-between"
        >
          <span>{deleteError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteError(null)}
            className="text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center rounded-lg border border-border bg-card p-1 text-xs font-medium w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterTab === "all"
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Matches ({initialMatches.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("completed")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterTab === "completed"
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("scheduled")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterTab === "scheduled"
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Scheduled ({scheduledCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search opponent, competition, scorer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-card"
          />
        </div>
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-bold text-foreground">
              No matches found
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-5">
              {search
                ? "No matches match your search criteria. Try a different query or reset filters."
                : "You haven't logged any matches yet. Log your first match to start tracking team results and player performances."}
            </p>
            {search ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
              >
                Clear Search
              </Button>
            ) : (
              <Link href="/matches/new">
                <Button size="sm" className="font-semibold">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Log First Match
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const matchDate = new Date(match.date);
            const dateStr = matchDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeStr = matchDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const isCompleted = match.status === "COMPLETED";
            const isScheduled = match.status === "SCHEDULED";
            const isAbandoned = match.status === "ABANDONED";

            // Determine Match Result (Win, Loss, Draw) for our team
            let outcome: "W" | "D" | "L" | null = null;
            if (
              isCompleted &&
              match.scoreHome !== null &&
              match.scoreAway !== null
            ) {
              const ourScore =
                match.venue === "AWAY" ? match.scoreAway : match.scoreHome;
              const oppScore =
                match.venue === "AWAY" ? match.scoreHome : match.scoreAway;
              if (ourScore > oppScore) outcome = "W";
              else if (ourScore < oppScore) outcome = "L";
              else outcome = "D";
            }

            return (
              <Card
                key={match.id}
                className="border-border bg-card shadow-xs hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Schedule & Match Fixture */}
                    <div className="flex-1 space-y-3">
                      {/* Meta badges row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Competition */}
                        {match.competition ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground bg-secondary/80 px-2 py-0.5 rounded-md">
                            <Trophy className="h-3 w-3 text-primary" />
                            {match.competition.name}{" "}
                            {match.competition.season
                              ? `(${match.competition.season})`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            Friendly Match
                          </span>
                        )}

                        {/* Date & Time */}
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateStr}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeStr}
                        </span>

                        {/* Venue */}
                        {match.venue && (
                          <Badge
                            variant={
                              match.venue === "HOME"
                                ? "default"
                                : match.venue === "AWAY"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0"
                          >
                            {match.venue}
                          </Badge>
                        )}

                        {/* Status */}
                        {isScheduled && (
                          <Badge
                            variant="secondary"
                            className="bg-warning/20 text-warning border-warning/40 text-[10px] uppercase font-bold px-1.5 py-0"
                          >
                            Scheduled
                          </Badge>
                        )}
                        {isAbandoned && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] uppercase font-bold px-1.5 py-0"
                          >
                            Abandoned
                          </Badge>
                        )}
                      </div>

                      {/* Main Fixture Lineup */}
                      <div className="flex items-center gap-4">
                        {/* Outcome Pill (if completed) */}
                        {outcome && (
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-black text-sm ${
                              outcome === "W"
                                ? "bg-success/20 text-success border border-success/30"
                                : outcome === "D"
                                ? "bg-warning/20 text-warning border border-warning/30"
                                : "bg-destructive/20 text-destructive border border-destructive/30"
                            }`}
                          >
                            {outcome}
                          </span>
                        )}

                        {/* Team Names and Scores */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                          <div className="flex items-baseline gap-3">
                            <span className="text-lg sm:text-xl font-bold font-display text-foreground">
                              {match.team || "FC Panenka"}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              vs
                            </span>
                            <span className="text-lg sm:text-xl font-bold font-display text-foreground">
                              {match.opponent}
                            </span>
                          </div>

                          {/* Final Score Badge */}
                          {isCompleted &&
                          match.scoreHome !== null &&
                          match.scoreAway !== null ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary font-mono font-bold text-base text-foreground tabular-nums shadow-2xs">
                              <span>
                                {match.venue === "AWAY"
                                  ? match.scoreAway
                                  : match.scoreHome}
                              </span>
                              <span className="text-muted-foreground">-</span>
                              <span>
                                {match.venue === "AWAY"
                                  ? match.scoreHome
                                  : match.scoreAway}
                              </span>
                            </div>
                          ) : isScheduled ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              Kickoff Scheduled
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Venue Name & Notes if present */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {match.venueName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.venueName}
                          </span>
                        )}
                        {match.notes && (
                          <span className="flex items-center gap-1 truncate max-w-md italic">
                            <FileText className="h-3 w-3 shrink-0" />
                            &ldquo;{match.notes}&rdquo;
                          </span>
                        )}
                      </div>

                      {/* Goalscorers & Key Performers Badges */}
                      {isCompleted && (
                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-muted-foreground mr-1">
                            Scorers:
                          </span>
                          {match.summary.scorers.length > 0 ? (
                            match.summary.scorers.map((scorer) => (
                              <Badge
                                key={scorer.playerId}
                                variant="goals"
                                className="text-xs font-medium px-2 py-0.5"
                              >
                                ⚽ {scorer.displayName || scorer.fullName}
                                {scorer.goals > 1 ? ` (${scorer.goals})` : ""}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              None recorded
                            </span>
                          )}

                          {match.summary.appearancesCount > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">
                              • {match.summary.appearancesCount} appearances
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 lg:flex-col lg:items-end lg:justify-center border-t lg:border-t-0 border-border pt-3 lg:pt-0">
                      <Link href={`/matches/${match.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-medium"
                        >
                          <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingMatchId(match.id)}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingMatchId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingMatchId(null);
            setDeleteError(null);
          }
        }}
        title="Delete Match"
        description={
          matchToDelete
            ? `Are you sure you want to permanently delete the match vs "${matchToDelete.opponent}" (${new Date(
                matchToDelete.date
              ).toLocaleDateString()})? All player performances recorded for this match will also be cascaded and deleted.`
            : "Are you sure you want to permanently delete this match?"
        }
        confirmText="Delete Match"
        cancelText="Keep Match"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
