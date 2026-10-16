"use client";

import * as React from "react";
import type { PlayerComparisonData } from "@/server/services/stats.service";
import { AlertTriangle, Info } from "lucide-react";

interface SampleSizeWarningProps {
  players: PlayerComparisonData[];
  minThreshold?: number;
}

export function SampleSizeWarning({
  players,
  minThreshold = 3,
}: SampleSizeWarningProps) {
  if (players.length < 2) return null;

  const lowSamplePlayers = players.filter(
    (p) => p.stats.appearances < minThreshold
  );

  const appearances = players.map((p) => p.stats.appearances);
  const minApps = Math.min(...appearances);
  const maxApps = Math.max(...appearances);
  const diff = maxApps - minApps;
  const ratio = minApps > 0 ? maxApps / minApps : maxApps > 0 ? 99 : 1;
  const hasDisparity = diff >= 5 || (minApps > 0 && ratio >= 2.0);

  if (lowSamplePlayers.length === 0 && !hasDisparity) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500 shadow-2xs space-y-1.5">
      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Sample Size & Eligibility Notice</span>
      </div>

      <div className="text-xs text-foreground/90 space-y-1 pl-6">
        {lowSamplePlayers.length > 0 && (
          <p>
            <strong>Eligibility threshold not met: </strong>
            {lowSamplePlayers.map((p) => p.player.fullName).join(", ")}{" "}
            {lowSamplePlayers.length === 1 ? "has" : "have"} fewer than{" "}
            {minThreshold} appearances. Per-appearance rates may be volatile or statistically unrepresentative.
          </p>
        )}

        {hasDisparity && (
          <p>
            <strong>Exposure disparity: </strong>
            Appearances vary significantly across compared players (ranging from{" "}
            {minApps} to {maxApps} apps, a difference of {diff} matches). Direct rate
            and counting metric comparisons should be evaluated with this volume gap in mind.
          </p>
        )}
      </div>
    </div>
  );
}
