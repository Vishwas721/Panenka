"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppearanceStatus, MatchStatus, MatchVenue, Position } from "@prisma/client";
import {
  AlertTriangle, ArrowLeft, Check, Loader2, Minus, Plus, Search, Sparkles, Star, Trash2, UserPlus, Users, X,
} from "lucide-react";
import { createMatchAction, updateMatchAction, deleteMatchAction } from "@/app/actions/matches";
import { createCompetitionAction } from "@/app/actions/competitions";
import { teamScore } from "@/lib/stats/profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Masthead, SectionHeading, PlayerAvatar, ResultBadge, RatingPill } from "@/components/pk/kit";
import { ratingBg, shortName, POSITION_SHORT } from "@/components/pk/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvailablePlayer {
  id: string;
  fullName: string;
  displayName: string | null;
  position: Position;
  squadNumber: number | null;
  team: string | null;
  imageUrl?: string | null;
  archivedAt?: Date | string | null;
}

export interface CompetitionOption {
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
  rating?: number | null;
  isMotm?: boolean;
  notes: string | null;
  player?: {
    id: string;
    fullName: string;
    displayName: string | null;
    position: Position;
    squadNumber: number | null;
    team: string | null;
    imageUrl?: string | null;
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

interface Row {
  player: AvailablePlayer;
  appearanceStatus: AppearanceStatus;
  minutes: string;
  rating: string;
  goals: number;
  assists: number;
  isMotm: boolean;
  notes: string;
}

const STATUS_OPTIONS: { value: AppearanceStatus; label: string; title: string }[] = [
  { value: "STARTED", label: "XI", title: "Started" },
  { value: "SUBSTITUTE_USED", label: "Sub", title: "Came off the bench" },
  { value: "UNUSED_SUBSTITUTE", label: "Bench", title: "Unused substitute" },
  { value: "DID_NOT_PLAY", label: "DNP", title: "Did not play" },
];

const appeared = (s: AppearanceStatus) => s === "STARTED" || s === "SUBSTITUTE_USED";

function toLocalInput(d: Date | string | null | undefined): string {
  const date = d ? new Date(d) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseRating(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const clampRating = (n: number) => Math.round(Math.min(10, Math.max(1, n)) * 10) / 10;

// ---------------------------------------------------------------------------
// Small controls
// ---------------------------------------------------------------------------

function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  size = "md",
  label,
}: {
  value: T;
  options: { value: T; label: string; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-full border bg-background/50 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full font-mono uppercase tracking-[0.1em] transition-colors",
            size === "sm" ? "px-2.5 py-1 text-[0.62rem]" : "px-3.5 py-1.5 text-[0.68rem]",
            value === o.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stepper({
  value,
  onChange,
  disabled,
  tone,
  label,
  who,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  tone: "goals" | "assists";
  label: string;
  /** Player name, so each row's buttons have a distinct accessible name. */
  who: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1", disabled && "opacity-35")}>
      <span className="eyebrow !text-[0.6rem]">{label}</span>
      <div className="flex items-center rounded-full border bg-background/50">
        <button
          type="button"
          disabled={disabled || value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label={`Decrease ${label.toLowerCase()} for ${who}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className={cn("numeral w-7 text-center text-2xl", value > 0 ? (tone === "goals" ? "text-goals" : "text-assists") : "text-muted-foreground")}>
          {value}
        </span>
        <button
          type="button"
          disabled={disabled || value >= 20}
          onClick={() => onChange(value + 1)}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label={`Increase ${label.toLowerCase()} for ${who}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function RatingControl({ value, onChange, disabled, name }: { value: string; onChange: (s: string) => void; disabled?: boolean; name: string }) {
  const n = parseRating(value);
  const invalid = n !== null && (n < 1 || n > 10);
  const bump = (d: number) => onChange(clampRating((n ?? 6.5) + d).toFixed(1));
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", disabled && "pointer-events-none opacity-35")}>
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow !text-[0.6rem]">Rating</span>
        {invalid && <span className="font-mono text-[0.6rem] uppercase text-loss">1.0 – 10.0</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => bump(-0.1)} className="grid h-9 w-7 place-items-center rounded-md border bg-background/50 text-muted-foreground hover:text-foreground" aria-label={`Lower ${name} rating`}>
          <Minus className="h-3 w-3" />
        </button>
        <input
          inputMode="decimal"
          value={value}
          placeholder="–"
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, "").slice(0, 4))}
          onBlur={() => {
            const v = parseRating(value);
            if (v !== null && v >= 1 && v <= 10) onChange(clampRating(v).toFixed(1));
          }}
          aria-label={`${name} rating`}
          aria-invalid={invalid}
          className={cn(
            "h-9 w-16 rounded-md border text-center font-display text-2xl font-black tabular-nums outline-none transition-colors focus:ring-2 focus:ring-primary/30",
            n === null && "bg-background/50 text-muted-foreground",
            invalid && "border-loss",
          )}
          style={n !== null && !invalid ? ratingBg(n, 0.18) : undefined}
        />
        <button type="button" onClick={() => bump(0.1)} className="grid h-9 w-7 place-items-center rounded-md border bg-background/50 text-muted-foreground hover:text-foreground" aria-label={`Raise ${name} rating`}>
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={0.1}
        value={n !== null && !invalid ? n : 6.5}
        onChange={(e) => onChange(Number(e.target.value).toFixed(1))}
        aria-label={`${name} rating slider`}
        className="h-1.5 w-full cursor-pointer"
        style={{ accentColor: n !== null && !invalid ? (ratingBg(n).color as string) : "hsl(var(--muted-foreground))" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

export function LogMatchForm({
  initialMatch,
  competitions: initialCompetitions,
  availablePlayers,
  defaultTeam,
}: {
  initialMatch?: InitialMatchData | null;
  competitions: CompetitionOption[];
  availablePlayers: AvailablePlayer[];
  defaultTeam?: string | null;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialMatch?.id);

  const initialScore = initialMatch
    ? teamScore(initialMatch.venue, initialMatch.scoreHome, initialMatch.scoreAway)
    : { goalsFor: null, goalsAgainst: null };

  const [date, setDate] = React.useState(() => toLocalInput(initialMatch?.date));
  const [opponent, setOpponent] = React.useState(initialMatch?.opponent ?? "");
  const [team, setTeam] = React.useState(initialMatch?.team ?? defaultTeam ?? "");
  const [competitionId, setCompetitionId] = React.useState(initialMatch?.competitionId ?? "");
  const [competitions, setCompetitions] = React.useState(initialCompetitions);
  const [venue, setVenue] = React.useState<MatchVenue>(initialMatch?.venue ?? "HOME");
  const [venueName, setVenueName] = React.useState(initialMatch?.venueName ?? "");
  const [ourScore, setOurScore] = React.useState(initialScore.goalsFor?.toString() ?? "");
  const [theirScore, setTheirScore] = React.useState(initialScore.goalsAgainst?.toString() ?? "");
  const [status, setStatus] = React.useState<MatchStatus>(initialMatch?.status ?? "COMPLETED");
  const [notes, setNotes] = React.useState(initialMatch?.notes ?? "");

  const [newComp, setNewComp] = React.useState<{ open: boolean; name: string; season: string; error: string | null; saving: boolean }>({
    open: false, name: "", season: "", error: null, saving: false,
  });

  const playersById = React.useMemo(() => {
    const m = new Map<string, AvailablePlayer>();
    for (const p of availablePlayers) m.set(p.id, p);
    for (const perf of initialMatch?.performances ?? []) {
      if (!m.has(perf.playerId) && perf.player) m.set(perf.playerId, { ...perf.player });
    }
    return m;
  }, [availablePlayers, initialMatch]);

  const [rows, setRows] = React.useState<Row[]>(() =>
    (initialMatch?.performances ?? [])
      .filter((p) => playersById.has(p.playerId))
      .map((p) => ({
        player: playersById.get(p.playerId)!,
        appearanceStatus: p.appearanceStatus,
        minutes: p.minutesPlayed?.toString() ?? "",
        rating: p.rating != null ? p.rating.toFixed(1) : "",
        goals: p.goals,
        assists: p.assists,
        isMotm: Boolean(p.isMotm),
        notes: p.notes ?? "",
      })),
  );

  const [query, setQuery] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // ----- derived -----
  const inSheet = new Set(rows.map((r) => r.player.id));
  const bench = [...playersById.values()]
    .filter((p) => !inSheet.has(p.id) && !p.archivedAt)
    .sort((a, b) => (a.squadNumber ?? 999) - (b.squadNumber ?? 999) || a.fullName.localeCompare(b.fullName));
  const searchHits = query.trim()
    ? bench.filter((p) => `${p.fullName} ${p.displayName ?? ""} ${p.squadNumber ?? ""} ${p.position}`.toLowerCase().includes(query.trim().toLowerCase()))
    : bench;

  const ours = ourScore === "" ? null : Number(ourScore);
  const theirs = theirScore === "" ? null : Number(theirScore);
  const result = ours === null || theirs === null ? null : ours > theirs ? "W" : ours < theirs ? "L" : "D";
  const playing = rows.filter((r) => appeared(r.appearanceStatus));
  const sumGoals = playing.reduce((a, r) => a + r.goals, 0);
  const sumAssists = playing.reduce((a, r) => a + r.assists, 0);
  const rated = playing.filter((r) => parseRating(r.rating) !== null);
  const avgRating = rated.length ? rated.reduce((a, r) => a + (parseRating(r.rating) ?? 0), 0) / rated.length : null;
  const motmRow = rows.find((r) => r.isMotm) ?? null;
  const suggested = rated.length
    ? rated.reduce((best, r) => ((parseRating(r.rating) ?? 0) > (parseRating(best.rating) ?? 0) ? r : best))
    : null;
  const starters = rows.filter((r) => r.appearanceStatus === "STARTED").length;

  const warnings: string[] = [];
  if (ours !== null && sumGoals > ours) warnings.push(`Players have ${sumGoals} goals but the team only scored ${ours}.`);
  if (ours !== null && status === "COMPLETED" && sumGoals < ours) warnings.push(`${ours - sumGoals} team goal${ours - sumGoals === 1 ? "" : "s"} not credited to a player (own goals are fine).`);
  if (sumAssists > sumGoals && ours !== null && sumAssists > ours) warnings.push(`More assists (${sumAssists}) than team goals (${ours}).`);
  if (starters > 11) warnings.push(`${starters} starters — more than eleven.`);
  if (rows.some((r) => { const n = parseRating(r.rating); return n !== null && (n < 1 || n > 10); })) warnings.push("A rating is outside 1.0–10.0.");

  // ----- row ops -----
  const update = (id: string, patch: Partial<Row>) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.player.id !== id) return patch.isMotm ? { ...r, isMotm: false } : r;
        const next = { ...r, ...patch };
        if (patch.appearanceStatus && !appeared(patch.appearanceStatus)) {
          Object.assign(next, { minutes: "", rating: "", goals: 0, assists: 0, isMotm: false });
        }
        if (patch.appearanceStatus === "STARTED" && r.appearanceStatus !== "STARTED" && next.minutes === "") next.minutes = "90";
        return next;
      }),
    );
  const addPlayer = (p: AvailablePlayer, s: AppearanceStatus = rows.filter((r) => r.appearanceStatus === "STARTED").length >= 11 ? "SUBSTITUTE_USED" : "STARTED") =>
    setRows((rs) => [
      ...rs,
      { player: p, appearanceStatus: s, minutes: s === "STARTED" ? "90" : "", rating: "", goals: 0, assists: 0, isMotm: false, notes: "" },
    ]);
  const addSquad = () => {
    let starters = rows.filter((r) => r.appearanceStatus === "STARTED").length;
    const added: Row[] = bench.map((p) => {
      const s: AppearanceStatus = starters < 11 ? "STARTED" : "UNUSED_SUBSTITUTE";
      if (s === "STARTED") starters++;
      return { player: p, appearanceStatus: s, minutes: s === "STARTED" ? "90" : "", rating: "", goals: 0, assists: 0, isMotm: false, notes: "" };
    });
    setRows((rs) => [...rs, ...added]);
  };
  const remove = (id: string) => setRows((rs) => rs.filter((r) => r.player.id !== id));

  // ----- competition -----
  const createComp = async () => {
    setNewComp((c) => ({ ...c, saving: true, error: null }));
    const res = await createCompetitionAction({ name: newComp.name, season: newComp.season });
    if (!res.success) {
      setNewComp((c) => ({ ...c, saving: false, error: res.error }));
      return;
    }
    setCompetitions((cs) => (cs.some((c) => c.id === res.data.id) ? cs : [res.data, ...cs]));
    setCompetitionId(res.data.id);
    setNewComp({ open: false, name: "", season: "", error: null, saving: false });
  };

  // ----- submit -----
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!opponent.trim()) return setError("Who did you play? Opponent is required.");
    if (!date) return setError("Pick a kick-off date.");
    if ((ours === null) !== (theirs === null)) return setError("Enter both scores, or leave both empty.");
    const bad = rows.find((r) => { const n = parseRating(r.rating); return n !== null && (n < 1 || n > 10); });
    if (bad) return setError(`${bad.player.fullName}'s rating must be between 1.0 and 10.0.`);

    const scoreHome = venue === "AWAY" ? theirs : ours;
    const scoreAway = venue === "AWAY" ? ours : theirs;
    const payload = {
      date: new Date(date).toISOString(),
      opponent: opponent.trim(),
      team: team.trim(),
      competitionId: competitionId || (isEditing ? "" : undefined),
      venue,
      venueName: venueName.trim(),
      scoreHome,
      scoreAway,
      status,
      notes: notes.trim(),
      performances: rows.map((r) => ({
        playerId: r.player.id,
        appearanceStatus: r.appearanceStatus,
        minutesPlayed: appeared(r.appearanceStatus) && r.minutes !== "" ? Number(r.minutes) : null,
        goals: appeared(r.appearanceStatus) ? r.goals : 0,
        assists: appeared(r.appearanceStatus) ? r.assists : 0,
        rating: appeared(r.appearanceStatus) ? parseRating(r.rating) : null,
        isMotm: appeared(r.appearanceStatus) && r.isMotm,
        notes: r.notes.trim(),
      })),
    };

    setSubmitting(true);
    try {
      const res = isEditing ? await updateMatchAction(initialMatch!.id, payload) : await createMatchAction(payload);
      if (!res.success || !res.data) {
        setError(res.error ?? "Could not save the match.");
        setSubmitting(false);
        return;
      }
      router.push(`/matches/${res.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the match.");
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!initialMatch) return;
    setDeleting(true);
    const res = await deleteMatchAction(initialMatch.id);
    setDeleting(false);
    if (!res.success) {
      setConfirmDelete(false);
      setError(res.error ?? "Could not delete the match.");
      return;
    }
    router.push("/matches");
    router.refresh();
  };

  const teamLabel = team.trim() || "Us";

  return (
    <form onSubmit={onSubmit} noValidate>
      <Masthead
        kicker={
          <>
            <Link href={isEditing ? `/matches/${initialMatch!.id}` : "/matches"} className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> {isEditing ? "Match report" : "Fixtures"}
            </Link>
            <span className="text-border">/</span>
            <span>{isEditing ? "Edit team sheet" : "New team sheet"}</span>
          </>
        }
        title={isEditing ? "Edit match" : "Log a match"}
        accent="the team sheet"
        actions={
          isEditing ? (
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)} className="text-loss hover:text-loss">
              <Trash2 /> Delete match
            </Button>
          ) : undefined
        }
      >
        Four numbers per player — <span className="text-rating">rating</span>, <span className="text-goals">goals</span>,{" "}
        <span className="text-assists">assists</span> and <span className="text-motm">man of the match</span>. Everything else on Panenka is built from them.
      </Masthead>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-10">
          {/* ===================== 01 FIXTURE ===================== */}
          <section>
            <SectionHeading index="01" title="The fixture" note="who, where, what score" />
            <div className="panel pitch-lines overflow-hidden">
              {/* Scoreboard */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b px-4 py-6 sm:gap-6 sm:px-8 sm:py-8">
                <div className="min-w-0 text-right">
                  <label className="eyebrow block" htmlFor="team">Your team</label>
                  <input
                    id="team"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Your team"
                    className="mt-1 w-full bg-transparent text-right font-display text-xl font-extrabold uppercase tracking-wide outline-none placeholder:text-muted-foreground/50 sm:text-3xl"
                  />
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    aria-label={`${teamLabel} score`}
                    inputMode="numeric"
                    value={ourScore}
                    onChange={(e) => setOurScore(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    placeholder="–"
                    className="numeral h-16 w-14 rounded-lg border bg-background/60 text-center text-5xl outline-none focus:border-primary sm:h-24 sm:w-20 sm:text-7xl"
                  />
                  <span className="numeral text-3xl text-muted-foreground sm:text-5xl">:</span>
                  <input
                    aria-label="Opponent score"
                    inputMode="numeric"
                    value={theirScore}
                    onChange={(e) => setTheirScore(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    placeholder="–"
                    className="numeral h-16 w-14 rounded-lg border bg-background/60 text-center text-5xl outline-none focus:border-primary sm:h-24 sm:w-20 sm:text-7xl"
                  />
                </div>
                <div className="min-w-0">
                  <label className="eyebrow block" htmlFor="opponent">Opponent *</label>
                  <input
                    id="opponent"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    placeholder="Opponent"
                    required
                    className="mt-1 w-full bg-transparent font-display text-xl font-extrabold uppercase tracking-wide outline-none placeholder:text-muted-foreground/50 sm:text-3xl"
                  />
                </div>
              </div>

              <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
                <div className="space-y-1.5">
                  <label className="eyebrow block" htmlFor="date">Kick-off *</label>
                  <Input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="eyebrow block" htmlFor="competition">Competition</label>
                    <button type="button" onClick={() => setNewComp((c) => ({ ...c, open: !c.open, error: null }))} className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-primary hover:underline">
                      {newComp.open ? "Cancel" : "+ New"}
                    </button>
                  </div>
                  {newComp.open ? (
                    <div className="space-y-2 rounded-md border border-dashed border-primary/40 p-2.5">
                      <div className="flex gap-2">
                        <Input value={newComp.name} onChange={(e) => setNewComp((c) => ({ ...c, name: e.target.value }))} placeholder="Name, e.g. Sunday League" aria-label="New competition name" />
                        <Input value={newComp.season} onChange={(e) => setNewComp((c) => ({ ...c, season: e.target.value }))} placeholder="2025/26" className="w-24" aria-label="Season" />
                      </div>
                      {newComp.error && <p className="text-xs text-loss">{newComp.error}</p>}
                      <Button type="button" size="sm" disabled={!newComp.name.trim() || newComp.saving} onClick={createComp}>
                        {newComp.saving ? <Loader2 className="animate-spin" /> : <Check />} Create competition
                      </Button>
                    </div>
                  ) : (
                    <select
                      id="competition"
                      value={competitionId}
                      onChange={(e) => setCompetitionId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background/60 px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Friendly / none</option>
                      {competitions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.season ? ` · ${c.season}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="eyebrow block">Venue</span>
                  <Segmented
                    label="Venue"
                    value={venue}
                    onChange={setVenue}
                    options={[
                      { value: "HOME", label: "Home" },
                      { value: "AWAY", label: "Away" },
                      { value: "NEUTRAL", label: "Neutral" },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="eyebrow block">Status</span>
                  <Segmented
                    label="Match status"
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: "COMPLETED", label: "Played" },
                      { value: "SCHEDULED", label: "Upcoming" },
                      { value: "ABANDONED", label: "Abandoned" },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="eyebrow block" htmlFor="venueName">Ground</label>
                  <Input id="venueName" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Optional" />
                </div>

                <div className="space-y-1.5 sm:row-span-1">
                  <label className="eyebrow block" htmlFor="notes">Match notes</label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional — conditions, talking points…" className="min-h-10" rows={1} />
                </div>
              </div>
              {status !== "COMPLETED" && (
                <p className="border-t px-6 py-3 font-serif text-sm italic text-muted-foreground">
                  Only played matches count towards stats, ratings and keywords.
                </p>
              )}
            </div>
          </section>

          {/* ===================== 02 TEAM SHEET ===================== */}
          <section>
            <SectionHeading
              index="02"
              title="Team sheet"
              note={`${rows.length} named · ${playing.length} played`}
              action={
                <div className="flex gap-2">
                  {bench.length > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={addSquad}>
                      <Users /> Whole squad
                    </Button>
                  )}
                  {rows.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setRows([])}>
                      Clear
                    </Button>
                  )}
                </div>
              }
            />

            {/* Add players */}
            <div className="panel mb-4 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={bench.length ? `Add a player — ${bench.length} available` : "Everyone is on the sheet"} className="pl-9" aria-label="Search players to add" disabled={bench.length === 0} />
              </div>
              {bench.length > 0 && (
                <div className="mt-2.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {searchHits.slice(0, 40).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        addPlayer(p);
                        setQuery("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background/50 py-1 pl-1 pr-3 text-xs transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-elevated px-1 font-mono text-[0.6rem]">{p.squadNumber ?? POSITION_SHORT(p.position)}</span>
                      {p.displayName || p.fullName}
                      <UserPlus className="h-3 w-3 opacity-60" />
                    </button>
                  ))}
                  {searchHits.length === 0 && <span className="px-1 text-xs text-muted-foreground">No match for “{query}”.</span>}
                </div>
              )}
              {playersById.size === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No players yet. <Link href="/players" className="text-primary underline-offset-4 hover:underline">Add your squad first</Link>.
                </p>
              )}
            </div>

            {/* Rows */}
            {rows.length === 0 ? (
              <div className="panel stripe-bg grid place-items-center px-6 py-14 text-center">
                <div className="font-display text-3xl font-black uppercase">Empty team sheet</div>
                <p className="mt-2 font-serif text-lg italic text-muted-foreground">Add players above, or drop the whole squad in at once.</p>
              </div>
            ) : (
              <ol className="space-y-2.5">
                {rows.map((r, idx) => {
                  const on = appeared(r.appearanceStatus);
                  const name = r.player.displayName || r.player.fullName;
                  return (
                    <li
                      key={r.player.id}
                      className={cn(
                        "panel grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3 p-3 sm:p-4 xl:grid-cols-[minmax(10rem,1.2fr)_auto_minmax(9rem,1fr)_auto_auto_auto_auto]",
                        r.isMotm && "border-motm/60 shadow-[0_0_30px_-12px_hsl(var(--motm)/0.8)]",
                        !on && "opacity-80",
                      )}
                    >
                      {/* identity */}
                      <div className="col-span-2 flex min-w-0 items-center gap-3 xl:col-span-1">
                        <span className="w-5 shrink-0 text-right font-mono text-[0.65rem] text-muted-foreground">{idx + 1}</span>
                        <PlayerAvatar name={r.player.fullName} imageUrl={r.player.imageUrl} number={r.player.squadNumber} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold" title={r.player.fullName}>{name}</div>
                          <div className="eyebrow !text-[0.6rem]">{POSITION_SHORT(r.player.position)}</div>
                        </div>
                      </div>
                      <button type="button" onClick={() => remove(r.player.id)} className="grid h-8 w-8 place-items-center justify-self-end rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground xl:order-last" aria-label={`Remove ${name}`}>
                        <X className="h-4 w-4" />
                      </button>

                      {/* status + minutes */}
                      <div className="col-span-3 flex flex-wrap items-end gap-2 xl:col-span-1">
                        <div className="flex flex-col gap-1">
                          <span className="eyebrow !text-[0.6rem]">Role</span>
                          <Segmented size="sm" label={`${name} appearance`} value={r.appearanceStatus} onChange={(v) => update(r.player.id, { appearanceStatus: v })} options={STATUS_OPTIONS} />
                        </div>
                        <div className={cn("flex flex-col gap-1", !on && "opacity-35")}>
                          <label className="eyebrow !text-[0.6rem]" htmlFor={`min-${r.player.id}`}>Min</label>
                          <input
                            id={`min-${r.player.id}`}
                            inputMode="numeric"
                            disabled={!on}
                            value={r.minutes}
                            onChange={(e) => update(r.player.id, { minutes: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                            placeholder="–"
                            className="h-8 w-12 rounded-md border bg-background/50 text-center font-mono text-sm outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* rating */}
                      <div className="col-span-3 sm:col-span-1 xl:col-span-1">
                        <RatingControl name={name} value={r.rating} disabled={!on} onChange={(v) => update(r.player.id, { rating: v })} />
                      </div>

                      {/* G / A / MOTM */}
                      <div className="col-span-3 flex items-end justify-between gap-3 sm:col-span-2 sm:justify-end xl:contents">
                        <Stepper label="Goals" who={name} tone="goals" value={r.goals} disabled={!on} onChange={(n) => update(r.player.id, { goals: n })} />
                        <Stepper label="Assists" who={name} tone="assists" value={r.assists} disabled={!on} onChange={(n) => update(r.player.id, { assists: n })} />
                        <div className={cn("flex flex-col items-center gap-1", !on && "opacity-35")}>
                          <span className="eyebrow !text-[0.6rem]">MOTM</span>
                          <button
                            type="button"
                            disabled={!on}
                            onClick={() => update(r.player.id, { isMotm: !r.isMotm })}
                            aria-pressed={r.isMotm}
                            aria-label={`${r.isMotm ? "Remove" : "Award"} man of the match for ${name}`}
                            className={cn(
                              "grid h-8 w-11 place-items-center rounded-full border transition-all",
                              r.isMotm ? "border-motm bg-motm text-background" : "bg-background/50 text-muted-foreground hover:border-motm hover:text-motm",
                            )}
                          >
                            <Star className={cn("h-4 w-4", r.isMotm && "fill-current")} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        {/* ===================== SUMMARY ===================== */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="panel overflow-hidden">
            <div className="border-b p-5">
              <div className="eyebrow mb-3">Full time</div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-display text-lg font-extrabold uppercase">{teamLabel}</div>
                  <div className="truncate font-serif text-sm italic text-muted-foreground">
                    {venue === "AWAY" ? "at" : "vs"} {opponent || "opponent"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="numeral text-5xl">{ourScore || "–"}</span>
                  <span className="numeral text-3xl text-muted-foreground">:</span>
                  <span className="numeral text-5xl text-muted-foreground">{theirScore || "–"}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <ResultBadge result={status === "COMPLETED" ? result : null} />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                  {status !== "COMPLETED" ? status.toLowerCase() : result === "W" ? "Win" : result === "L" ? "Defeat" : result === "D" ? "Draw" : "No score"}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-3 divide-x border-b text-center">
              <div className="p-3">
                <dt className="eyebrow !text-[0.58rem]">Goals</dt>
                <dd className="numeral mt-1 text-3xl text-goals">{sumGoals}</dd>
              </div>
              <div className="p-3">
                <dt className="eyebrow !text-[0.58rem]">Assists</dt>
                <dd className="numeral mt-1 text-3xl text-assists">{sumAssists}</dd>
              </div>
              <div className="p-3">
                <dt className="eyebrow !text-[0.58rem]">Avg rtg</dt>
                <dd className="mt-1 flex justify-center"><RatingPill rating={avgRating === null ? null : Math.round(avgRating * 10) / 10} /></dd>
              </div>
            </dl>

            <div className="space-y-3 border-b p-5">
              <div className="eyebrow">Man of the match</div>
              {motmRow ? (
                <div className="flex items-center gap-2.5">
                  <Star className="h-5 w-5 fill-motm text-motm" />
                  <span className="font-display text-xl font-extrabold uppercase">{shortName(motmRow.player)}</span>
                  <RatingPill rating={parseRating(motmRow.rating)} size="sm" className="ml-auto" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not awarded yet.</p>
              )}
              {suggested && suggested !== motmRow && (
                <button
                  type="button"
                  onClick={() => update(suggested.player.id, { isMotm: true })}
                  className="flex w-full items-center gap-2 rounded-md border border-dashed border-motm/50 px-3 py-2 text-left text-xs text-motm transition-colors hover:bg-motm/10"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Highest rated: <b>{shortName(suggested.player)}</b> ({parseRating(suggested.rating)?.toFixed(1)}) — award MOTM
                  </span>
                </button>
              )}
            </div>

            {warnings.length > 0 && (
              <ul className="space-y-2 border-b bg-warning/[0.06] p-5">
                {warnings.map((w) => (
                  <li key={w} className="flex gap-2 text-xs text-warning">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-3 p-5">
              {error && (
                <div role="alert" className="flex gap-2 rounded-md border border-loss/40 bg-loss/10 p-3 text-sm text-loss">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : <Check />}
                {isEditing ? "Save changes" : "Save match"}
              </Button>
              <p className="text-center text-[0.7rem] text-muted-foreground">
                {rated.length}/{playing.length} players rated
              </p>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this match?"
        description="The match and every player performance in it will be removed. Stats and keywords update immediately."
        confirmText="Delete match"
        variant="destructive"
        isLoading={deleting}
        onConfirm={onDelete}
      />
    </form>
  );
}
