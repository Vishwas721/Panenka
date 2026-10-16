"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MatchVenue,
  MatchStatus,
  AppearanceStatus,
  Position,
} from "@prisma/client";
import {
  createMatchAction,
  updateMatchAction,
} from "@/app/actions/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Search,
  Plus,
  Shield,
  Save,
  Info,
} from "lucide-react";
import Link from "next/link";

interface AvailablePlayer {
  id: string;
  fullName: string;
  displayName: string | null;
  position: Position;
  squadNumber: number | null;
  team: string | null;
}

interface CompetitionOption {
  id: string;
  name: string;
  season: string | null;
}

interface InitialPerformance {
  playerId: string;
  appearanceStatus: AppearanceStatus;
  minutesPlayed: number | null;
  goals: number;
  assists: number;
  notes: string | null;
  player?: {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    squadNumber: number | null;
    team: string | null;
  };
}

export interface InitialMatchData {
  id: string;
  date: Date | string;
  opponent: string;
  team: string | null;
  competitionId: string | null;
  venue: MatchVenue | null;
  venueName: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  status: MatchStatus;
  notes: string | null;
  performances: InitialPerformance[];
}

interface LogMatchFormProps {
  initialMatch?: InitialMatchData | null;
  competitions: CompetitionOption[];
  availablePlayers: AvailablePlayer[];
}

interface PlayerRowState {
  playerId: string;
  selected: boolean;
  appearanceStatus: AppearanceStatus;
  minutesPlayed: number | "";
  goals: number;
  assists: number;
  notes: string;
  player: AvailablePlayer;
}

function toDatetimeLocalString(dateInput: Date | string | null | undefined): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function LogMatchForm({
  initialMatch,
  competitions,
  availablePlayers,
}: LogMatchFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialMatch?.id);

  // Match Metadata State
  const [date, setDate] = React.useState<string>(() =>
    toDatetimeLocalString(initialMatch?.date)
  );
  const [opponent, setOpponent] = React.useState<string>(
    initialMatch?.opponent ?? ""
  );
  const [team, setTeam] = React.useState<string>(
    initialMatch?.team ?? "FC Panenka"
  );
  const [competitionId, setCompetitionId] = React.useState<string>(
    initialMatch?.competitionId ?? ""
  );
  const [venue, setVenue] = React.useState<string>(
    initialMatch?.venue ?? "HOME"
  );
  const [venueName, setVenueName] = React.useState<string>(
    initialMatch?.venueName ?? ""
  );
  const [scoreHome, setScoreHome] = React.useState<string>(
    initialMatch?.scoreHome !== null && initialMatch?.scoreHome !== undefined
      ? String(initialMatch.scoreHome)
      : ""
  );
  const [scoreAway, setScoreAway] = React.useState<string>(
    initialMatch?.scoreAway !== null && initialMatch?.scoreAway !== undefined
      ? String(initialMatch.scoreAway)
      : ""
  );
  const [status, setStatus] = React.useState<MatchStatus>(
    initialMatch?.status ?? "COMPLETED"
  );
  const [notes, setNotes] = React.useState<string>(initialMatch?.notes ?? "");

  // Player Rows State
  const [playerRows, setPlayerRows] = React.useState<PlayerRowState[]>(() => {
    const perfMap = new Map<string, InitialPerformance>();
    if (initialMatch?.performances) {
      for (const p of initialMatch.performances) {
        perfMap.set(p.playerId, p);
      }
    }

    // Merge available players and any players that were in initialMatch.performances
    const playersById = new Map<string, AvailablePlayer>();
    for (const p of availablePlayers) {
      playersById.set(p.id, p);
    }
    if (initialMatch?.performances) {
      for (const p of initialMatch.performances) {
        if (!playersById.has(p.playerId) && p.player) {
          playersById.set(p.playerId, {
            id: p.playerId,
            fullName: p.player.fullName,
            displayName: p.player.displayName,
            position: p.player.position,
            squadNumber: p.player.squadNumber,
            team: p.player.team,
          });
        }
      }
    }

    return Array.from(playersById.values())
      .sort((a, b) => (a.squadNumber ?? 999) - (b.squadNumber ?? 999))
      .map((player) => {
        const perf = perfMap.get(player.id);
        if (perf) {
          return {
            playerId: player.id,
            selected: true,
            appearanceStatus: perf.appearanceStatus,
            minutesPlayed:
              perf.minutesPlayed !== null && perf.minutesPlayed !== undefined
                ? perf.minutesPlayed
                : "",
            goals: perf.goals ?? 0,
            assists: perf.assists ?? 0,
            notes: perf.notes ?? "",
            player,
          };
        }
        return {
          playerId: player.id,
          selected: false,
          appearanceStatus: "DID_NOT_PLAY" as AppearanceStatus,
          minutesPlayed: "",
          goals: 0,
          assists: 0,
          notes: "",
          player,
        };
      });
  });

  // UI state
  const [searchFilter, setSearchFilter] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<
    "all" | "squad" | "starters" | "subs"
  >("all");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Derived squad statistics
  const selectedRows = playerRows.filter((r) => r.selected);
  const starterCount = selectedRows.filter(
    (r) => r.appearanceStatus === "STARTED"
  ).length;
  const subsUsedCount = selectedRows.filter(
    (r) => r.appearanceStatus === "SUBSTITUTE_USED"
  ).length;
  const unusedSubsCount = selectedRows.filter(
    (r) => r.appearanceStatus === "UNUSED_SUBSTITUTE"
  ).length;

  const totalGoalsLogged = selectedRows.reduce((sum, r) => sum + r.goals, 0);
  const totalAssistsLogged = selectedRows.reduce((sum, r) => sum + r.assists, 0);

  // Determine team final score for warning comparison
  const parsedScoreHome =
    scoreHome.trim() === "" ? null : Number.parseInt(scoreHome, 10);
  const parsedScoreAway =
    scoreAway.trim() === "" ? null : Number.parseInt(scoreAway, 10);

  let teamScore: number | null = null;
  if (venue === "AWAY" && parsedScoreAway !== null && !isNaN(parsedScoreAway)) {
    teamScore = parsedScoreAway;
  } else if (
    (venue === "HOME" || venue === "NEUTRAL" || !venue) &&
    parsedScoreHome !== null &&
    !isNaN(parsedScoreHome)
  ) {
    teamScore = parsedScoreHome;
  } else if (parsedScoreHome !== null && !isNaN(parsedScoreHome)) {
    teamScore = parsedScoreHome;
  }

  const hasScoreDiscrepancy =
    teamScore !== null && totalGoalsLogged > teamScore;

  // Filtered player rows for display
  const displayedRows = playerRows.filter((row) => {
    // Search query
    const q = searchFilter.trim().toLowerCase();
    const matchSearch =
      q === "" ||
      row.player.fullName.toLowerCase().includes(q) ||
      (row.player.displayName &&
        row.player.displayName.toLowerCase().includes(q)) ||
      row.player.position.toLowerCase().includes(q) ||
      (row.player.squadNumber &&
        String(row.player.squadNumber).includes(q));

    if (!matchSearch) return false;

    if (activeTab === "squad") return row.selected;
    if (activeTab === "starters")
      return row.selected && row.appearanceStatus === "STARTED";
    if (activeTab === "subs")
      return (
        row.selected &&
        (row.appearanceStatus === "SUBSTITUTE_USED" ||
          row.appearanceStatus === "UNUSED_SUBSTITUTE")
      );

    return true;
  });

  // Batch actions
  const handleSelectStartingXI = () => {
    setPlayerRows((prev) =>
      prev.map((row, index) => {
        if (index < 11) {
          return {
            ...row,
            selected: true,
            appearanceStatus: "STARTED",
            minutesPlayed: row.minutesPlayed !== "" ? row.minutesPlayed : 90,
          };
        }
        return row;
      })
    );
  };

  const handleSelectAllActive = () => {
    setPlayerRows((prev) =>
      prev.map((row, index) => ({
        ...row,
        selected: true,
        appearanceStatus:
          index < 11
            ? "STARTED"
            : ("SUBSTITUTE_USED" as AppearanceStatus),
        minutesPlayed:
          row.minutesPlayed !== "" ? row.minutesPlayed : index < 11 ? 90 : 20,
      }))
    );
  };

  const handleClearAll = () => {
    setPlayerRows((prev) =>
      prev.map((row) => ({
        ...row,
        selected: false,
        appearanceStatus: "DID_NOT_PLAY",
        minutesPlayed: "",
        goals: 0,
        assists: 0,
        notes: "",
      }))
    );
  };

  // Row field updates
  const updateRow = (playerId: string, updates: Partial<PlayerRowState>) => {
    setPlayerRows((prev) =>
      prev.map((r) => {
        if (r.playerId !== playerId) return r;
        const merged = { ...r, ...updates };

        // Enforce rule: if appearanceStatus is UNUSED_SUBSTITUTE or DID_NOT_PLAY,
        // minutes, goals, assists must be reset/empty
        if (
          merged.appearanceStatus === "UNUSED_SUBSTITUTE" ||
          merged.appearanceStatus === "DID_NOT_PLAY"
        ) {
          merged.minutesPlayed = "";
          merged.goals = 0;
          merged.assists = 0;
        }

        return merged;
      })
    );
  };

  const togglePlayerSelected = (playerId: string) => {
    setPlayerRows((prev) =>
      prev.map((r) => {
        if (r.playerId !== playerId) return r;
        const nextSelected = !r.selected;
        return {
          ...r,
          selected: nextSelected,
          appearanceStatus: nextSelected
            ? r.appearanceStatus === "DID_NOT_PLAY"
              ? "STARTED"
              : r.appearanceStatus
            : "DID_NOT_PLAY",
          minutesPlayed: nextSelected
            ? r.minutesPlayed !== ""
              ? r.minutesPlayed
              : 90
            : "",
          goals: nextSelected ? r.goals : 0,
          assists: nextSelected ? r.assists : 0,
        };
      })
    );
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validations
    if (!opponent.trim()) {
      setErrorMessage("Please enter the opponent team name.");
      return;
    }

    // Both scores or neither
    const homeVal = scoreHome.trim();
    const awayVal = scoreAway.trim();
    if ((homeVal === "" && awayVal !== "") || (homeVal !== "" && awayVal === "")) {
      setErrorMessage(
        "Please provide both home and away final scores, or leave both blank."
      );
      return;
    }

    // Prepare performances: only save selected players
    const performancesPayload = playerRows
      .filter((r) => r.selected)
      .map((r) => {
        const didAppearInMatch =
          r.appearanceStatus === "STARTED" ||
          r.appearanceStatus === "SUBSTITUTE_USED";

        return {
          playerId: r.playerId,
          appearanceStatus: r.appearanceStatus,
          minutesPlayed:
            didAppearInMatch && r.minutesPlayed !== ""
              ? Math.max(0, Math.min(130, Number(r.minutesPlayed)))
              : null,
          goals: didAppearInMatch ? Math.max(0, Number(r.goals)) : 0,
          assists: didAppearInMatch ? Math.max(0, Number(r.assists)) : 0,
          notes: r.notes.trim() || undefined,
        };
      });

    // Validate minutes boundary (0-130)
    for (const p of performancesPayload) {
      if (p.minutesPlayed !== null && (p.minutesPlayed < 0 || p.minutesPlayed > 130)) {
        setErrorMessage("Player minutes played must be between 0 and 130.");
        return;
      }
    }

    const payload = {
      date: new Date(date),
      opponent: opponent.trim(),
      team: team.trim() || undefined,
      competitionId: competitionId.trim() || undefined,
      venue: venue ? (venue as MatchVenue) : null,
      venueName: venueName.trim() || undefined,
      scoreHome: homeVal !== "" ? Number.parseInt(homeVal, 10) : null,
      scoreAway: awayVal !== "" ? Number.parseInt(awayVal, 10) : null,
      status,
      notes: notes.trim() || undefined,
      performances: performancesPayload,
    };

    setIsSubmitting(true);
    try {
      if (isEditing && initialMatch?.id) {
        const result = await updateMatchAction(initialMatch.id, payload);
        if (!result.success) {
          setErrorMessage(result.error || "Failed to update match.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = await createMatchAction(payload);
        if (!result.success) {
          setErrorMessage(result.error || "Failed to create match.");
          setIsSubmitting(false);
          return;
        }
      }

      router.push("/matches");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/matches"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-1.5 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Matches
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
            {isEditing ? "Edit Match" : "Log Match"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update match scores, venue details, and reconcile player performances."
              : "Record full match results, lineups, and individual player performance stats."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/matches")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="font-semibold shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting
              ? "Saving Match..."
              : isEditing
              ? "Save Changes"
              : "Save Match"}
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive font-medium flex items-start gap-3 animate-in fade-in duration-200"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* ================= SECTION 1: MATCH METADATA ================= */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Match Details & Result
          </CardTitle>
          <CardDescription>
            Enter kick-off schedule, opponent, competition, venue, and scoreline.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Date & Time */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Date & Time (Local / UTC)
            </Label>
            <Input
              id="date"
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Opponent */}
          <div className="space-y-1.5">
            <Label htmlFor="opponent" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Opponent <span className="text-destructive">*</span>
            </Label>
            <Input
              id="opponent"
              placeholder="e.g. Riverside United"
              required
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Team Represented */}
          <div className="space-y-1.5">
            <Label htmlFor="team" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              Team Represented
            </Label>
            <Input
              id="team"
              placeholder="e.g. FC Panenka First XI"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Competition */}
          <div className="space-y-1.5">
            <Label htmlFor="competitionId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Competition
            </Label>
            <select
              id="competitionId"
              value={competitionId}
              onChange={(e) => setCompetitionId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            >
              <option value="">Friendly / Non-competitive</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.season ? `(${c.season})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Venue (HOME/AWAY/NEUTRAL) */}
          <div className="space-y-1.5">
            <Label htmlFor="venue" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Venue
            </Label>
            <select
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            >
              <option value="HOME">Home</option>
              <option value="AWAY">Away</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="">Unspecified</option>
            </select>
          </div>

          {/* Venue Name */}
          <div className="space-y-1.5">
            <Label htmlFor="venueName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Venue Name
            </Label>
            <Input
              id="venueName"
              placeholder="e.g. Panenka Arena, pitch 3"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Match Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Match Status
            </Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MatchStatus)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            >
              <option value="COMPLETED">Completed</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ABANDONED">Abandoned</option>
            </select>
          </div>

          {/* Final Score Inputs */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Final Score (Home - Away)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Home"
                value={scoreHome}
                onChange={(e) => setScoreHome(e.target.value)}
                className="bg-background text-center font-bold text-base"
              />
              <span className="text-muted-foreground font-semibold">:</span>
              <Input
                type="number"
                min={0}
                placeholder="Away"
                value={scoreAway}
                onChange={(e) => setScoreAway(e.target.value)}
                className="bg-background text-center font-bold text-base"
              />
            </div>
          </div>

          {/* Match Notes */}
          <div className="md:col-span-2 lg:col-span-4 space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Match Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Tactical remarks, weather conditions, referee notes..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* ================= SECTION 2: LIVE SCORE & ROSTER SUMMARY ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Squad Selection Count */}
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Match Squad
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-display text-foreground">
              {selectedRows.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {starterCount} Starters • {subsUsedCount} Subs
            </span>
          </div>
        </div>

        {/* Goals Logged */}
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Goals Logged</span>
            <Badge variant="goals" className="text-xs px-2 py-0">⚽ Goals</Badge>
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-display text-goals">
              {totalGoalsLogged}
            </span>
            <span className="text-xs text-muted-foreground">
              {teamScore !== null ? `Team Score: ${teamScore}` : "No score entered"}
            </span>
          </div>
        </div>

        {/* Assists Logged */}
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Assists Logged</span>
            <Badge variant="assists" className="text-xs px-2 py-0">🅰️ Assists</Badge>
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-display text-assists">
              {totalAssistsLogged}
            </span>
            <span className="text-xs text-muted-foreground">
              {unusedSubsCount} Unused Subs
            </span>
          </div>
        </div>

        {/* Score Check Banner / Validation Status */}
        <div
          className={`rounded-lg border p-4 flex flex-col justify-between ${
            hasScoreDiscrepancy
              ? "border-warning/50 bg-warning/10 text-warning"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            {hasScoreDiscrepancy ? (
              <>
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                Score Discrepancy
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                Validation Status
              </>
            )}
          </span>
          <p className="mt-1 text-xs leading-relaxed">
            {hasScoreDiscrepancy
              ? `Sum of player goals (${totalGoalsLogged}) exceeds team final score (${teamScore}). Check scores or player entries.`
              : teamScore !== null
              ? `Logged goals (${totalGoalsLogged}) match or do not exceed team score (${teamScore}).`
              : "Enter team scores to enable automated score comparison."}
          </p>
        </div>
      </div>

      {/* Non-blocking Discrepancy Alert */}
      {hasScoreDiscrepancy && (
        <div
          role="status"
          className="rounded-lg border border-warning/40 bg-warning/15 px-4 py-3 text-sm text-foreground flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <span>
              <strong>Score Discrepancy Warning:</strong> You have logged{" "}
              <strong>{totalGoalsLogged} goals</strong> across all players, which
              is higher than your team&apos;s logged final score of{" "}
              <strong>{teamScore}</strong>. You may still save this match, but
              please ensure this was intentional.
            </span>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: PLAYER PERFORMANCE ROSTER ================= */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Player Performance Logging
              </CardTitle>
              <CardDescription>
                Select match participants and rapidly key in appearance status,
                minutes, goals, and assists.
              </CardDescription>
            </div>

            {/* Batch actions & Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectStartingXI}
                className="text-xs h-8"
              >
                Auto-Select Starting 11
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllActive}
                className="text-xs h-8"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-8 text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* View Tabs */}
            <div className="flex items-center rounded-lg border border-border bg-background p-1 text-xs font-medium w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "all"
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Players ({playerRows.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("squad")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "squad"
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                In Squad ({selectedRows.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("starters")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "starters"
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Starters ({starterCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("subs")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "subs"
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Subs ({subsUsedCount + unusedSubsCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search player, position..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 h-9 text-xs bg-background"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4 w-12 text-center">Squad</th>
                  <th className="py-3 px-4 min-w-[200px]">Player</th>
                  <th className="py-3 px-4 min-w-[160px]">Status</th>
                  <th className="py-3 px-3 w-24 text-center">Min</th>
                  <th className="py-3 px-3 w-20 text-center">Goals</th>
                  <th className="py-3 px-3 w-20 text-center">Assists</th>
                  <th className="py-3 px-4 min-w-[180px]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No players matching current criteria.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row) => {
                    const didAppear =
                      row.appearanceStatus === "STARTED" ||
                      row.appearanceStatus === "SUBSTITUTE_USED";
                    const isRowDisabled = !row.selected;

                    return (
                      <tr
                        key={row.playerId}
                        className={`transition-colors hover:bg-muted/20 ${
                          row.selected ? "bg-muted/10" : "opacity-60"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => togglePlayerSelected(row.playerId)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                            aria-label={`Include ${row.player.fullName} in match squad`}
                          />
                        </td>

                        {/* Player Info */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold tabular-nums shrink-0">
                              {row.player.squadNumber ?? "-"}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-sm leading-tight">
                                {row.player.fullName}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <span className="font-mono font-medium text-xs px-1 py-0.2 rounded bg-muted/60">
                                  {row.player.position}
                                </span>
                                {row.player.displayName && (
                                  <span>({row.player.displayName})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Appearance Status */}
                        <td className="py-2.5 px-4">
                          <select
                            value={row.appearanceStatus}
                            disabled={isRowDisabled}
                            onChange={(e) => {
                              const newStatus = e.target
                                .value as AppearanceStatus;
                              updateRow(row.playerId, {
                                appearanceStatus: newStatus,
                                minutesPlayed:
                                  newStatus === "STARTED" &&
                                  row.minutesPlayed === ""
                                    ? 90
                                    : newStatus === "SUBSTITUTE_USED" &&
                                      row.minutesPlayed === ""
                                    ? 20
                                    : row.minutesPlayed,
                              });
                            }}
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground disabled:cursor-not-allowed"
                          >
                            <option value="STARTED">STARTED (Starting XI)</option>
                            <option value="SUBSTITUTE_USED">
                              SUBSTITUTE_USED (Sub On)
                            </option>
                            <option value="UNUSED_SUBSTITUTE">
                              UNUSED_SUBSTITUTE (Bench)
                            </option>
                            <option value="DID_NOT_PLAY">
                              DID_NOT_PLAY (No Appearance)
                            </option>
                          </select>
                        </td>

                        {/* Minutes */}
                        <td className="py-2.5 px-3 text-center">
                          <Input
                            type="number"
                            min={0}
                            max={130}
                            placeholder="0"
                            disabled={isRowDisabled || !didAppear}
                            value={row.minutesPlayed}
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? ""
                                  : Number.parseInt(e.target.value, 10);
                              updateRow(row.playerId, { minutesPlayed: val });
                            }}
                            className="h-8 w-20 text-center text-xs tabular-nums mx-auto bg-background disabled:bg-muted/30"
                          />
                        </td>

                        {/* Goals */}
                        <td className="py-2.5 px-3 text-center">
                          <Input
                            type="number"
                            min={0}
                            disabled={isRowDisabled || !didAppear}
                            value={row.goals}
                            onChange={(e) => {
                              const val = Math.max(
                                0,
                                Number.parseInt(e.target.value, 10) || 0
                              );
                              updateRow(row.playerId, { goals: val });
                            }}
                            className={`h-8 w-16 text-center text-xs tabular-nums mx-auto bg-background font-bold ${
                              row.goals > 0
                                ? "text-goals border-goals/50 bg-goals/10"
                                : ""
                            } disabled:bg-muted/30`}
                          />
                        </td>

                        {/* Assists */}
                        <td className="py-2.5 px-3 text-center">
                          <Input
                            type="number"
                            min={0}
                            disabled={isRowDisabled || !didAppear}
                            value={row.assists}
                            onChange={(e) => {
                              const val = Math.max(
                                0,
                                Number.parseInt(e.target.value, 10) || 0
                              );
                              updateRow(row.playerId, { assists: val });
                            }}
                            className={`h-8 w-16 text-center text-xs tabular-nums mx-auto bg-background font-bold ${
                              row.assists > 0
                                ? "text-assists border-assists/50 bg-assists/10"
                                : ""
                            } disabled:bg-muted/30`}
                          />
                        </td>

                        {/* Notes */}
                        <td className="py-2.5 px-4">
                          <Input
                            type="text"
                            placeholder="Goal, penalty, card..."
                            disabled={isRowDisabled}
                            value={row.notes}
                            onChange={(e) =>
                              updateRow(row.playerId, {
                                notes: e.target.value,
                              })
                            }
                            className="h-8 text-xs bg-background disabled:bg-muted/30"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-20 rounded-xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs uppercase font-medium">
              Lineup:
            </span>
            <span className="font-bold text-foreground">
              {starterCount} Starters
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="font-bold text-foreground">
              {subsUsedCount} Subs Used
            </span>
          </div>

          <div className="flex items-center gap-3 border-l border-border pl-4">
            <span className="inline-flex items-center gap-1 text-goals font-bold text-sm">
              ⚽ {totalGoalsLogged} Goals
            </span>
            <span className="inline-flex items-center gap-1 text-assists font-bold text-sm">
              🅰️ {totalAssistsLogged} Assists
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/matches")}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting
              ? "Saving Match..."
              : isEditing
              ? "Save Changes"
              : "Save Match"}
          </Button>
        </div>
      </div>
    </form>
  );
}
