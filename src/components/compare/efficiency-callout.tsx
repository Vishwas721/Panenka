"use client";

import * as React from "react";
import type { PlayerComparisonData } from "@/server/services/stats.service";
import { Lightbulb, TrendingUp, BarChart2 } from "lucide-react";

interface EfficiencyCalloutProps {
  players: PlayerComparisonData[];
}

export function EfficiencyCallout({ players }: EfficiencyCalloutProps) {
  if (players.length < 2) return null;

  // Find goal volume leader
  const sortedByGoals = [...players].sort(
    (a, b) => b.stats.goals - a.stats.goals
  );
  const goalVolumeLeader = sortedByGoals[0];

  // Find goal rate leader
  const eligibleRatePlayers = players.filter(
    (p) => p.stats.goalsPerAppearance !== null
  );
  const sortedByGoalRate = [...eligibleRatePlayers].sort(
    (a, b) =>
      (b.stats.goalsPerAppearance ?? 0) - (a.stats.goalsPerAppearance ?? 0)
  );
  const goalRateLeader = sortedByGoalRate[0];

  // Find assist volume leader
  const sortedByAssists = [...players].sort(
    (a, b) => b.stats.assists - a.stats.assists
  );
  const assistVolumeLeader = sortedByAssists[0];

  // Find assist rate leader
  const eligibleAssistRatePlayers = players.filter(
    (p) => p.stats.assistsPerAppearance !== null
  );
  const sortedByAssistRate = [...eligibleAssistRatePlayers].sort(
    (a, b) =>
      (b.stats.assistsPerAppearance ?? 0) - (a.stats.assistsPerAppearance ?? 0)
  );
  const assistRateLeader = sortedByAssistRate[0];

  const hasDivergentGoalLeaders =
    goalVolumeLeader &&
    goalRateLeader &&
    goalVolumeLeader.player.id !== goalRateLeader.player.id &&
    goalVolumeLeader.stats.goals > 0 &&
    (goalRateLeader.stats.goalsPerAppearance ?? 0) > 0;

  const hasDivergentAssistLeaders =
    assistVolumeLeader &&
    assistRateLeader &&
    assistVolumeLeader.player.id !== assistRateLeader.player.id &&
    assistVolumeLeader.stats.assists > 0 &&
    (assistRateLeader.stats.assistsPerAppearance ?? 0) > 0;

  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 shadow-2xs space-y-2">
      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary">
        <Lightbulb className="h-4 w-4 shrink-0" />
        <span>Tactical Analysis: Total Output vs. Per-Appearance Efficiency</span>
      </div>

      <div className="text-xs text-foreground/90 space-y-2 pl-6">
        {hasDivergentGoalLeaders && goalVolumeLeader && goalRateLeader ? (
          <p>
            <strong>Scoring Dynamic: </strong>
            <span className="font-semibold">{goalVolumeLeader.player.fullName}</span>{" "}
            leads in cumulative scoring volume (
            <span className="font-mono font-bold text-primary">
              {goalVolumeLeader.stats.goals} goals
            </span>{" "}
            across {goalVolumeLeader.stats.appearances} appearances). Meanwhile,{" "}
            <span className="font-semibold">{goalRateLeader.player.fullName}</span>{" "}
            holds the edge in match efficiency with{" "}
            <span className="font-mono font-bold text-primary">
              {goalRateLeader.stats.goalsPerAppearance?.toFixed(2)} goals/app
            </span>{" "}
            over {goalRateLeader.stats.appearances} fixtures. While a higher rate
            indicates explosive impact per match, sustained volume tests consistency
            against shifting opponents and wear across a season.
          </p>
        ) : goalVolumeLeader && (goalVolumeLeader.stats.goalsPerAppearance ?? 0) > 0 ? (
          <p>
            <strong>Scoring Dominance: </strong>
            <span className="font-semibold">{goalVolumeLeader.player.fullName}</span>{" "}
            commands both total goal output (
            <span className="font-mono font-bold text-primary">
              {goalVolumeLeader.stats.goals} goals
            </span>
            ) and per-match efficiency (
            <span className="font-mono font-bold text-primary">
              {goalVolumeLeader.stats.goalsPerAppearance?.toFixed(2)} goals/app
            </span>
            ), exhibiting both the required stamina and finishing consistency.
          </p>
        ) : null}

        {hasDivergentAssistLeaders && assistVolumeLeader && assistRateLeader ? (
          <p>
            <strong>Playmaking Dynamic: </strong>
            <span className="font-semibold">{assistVolumeLeader.player.fullName}</span>{" "}
            leads in raw assist tally ({assistVolumeLeader.stats.assists} assists), whereas{" "}
            <span className="font-semibold">{assistRateLeader.player.fullName}</span>{" "}
            delivers higher creativity per appearance (
            <span className="font-mono font-bold text-sky-400">
              {assistRateLeader.stats.assistsPerAppearance?.toFixed(2)} ast/app
            </span>
            ).
          </p>
        ) : null}

        <p className="text-muted-foreground text-[11px] pt-1 border-t border-border/40 font-mono">
          Note: In football analytics, rate metrics provide rapid talent evaluation, while total volume accounts for availability, defensive scouting adjustments, and sample reliability.
        </p>
      </div>
    </div>
  );
}
