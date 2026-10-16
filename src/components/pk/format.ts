import type { CSSProperties } from "react";

export const dash = "—";

export function fmtRating(r: number | null | undefined): string {
  if (r === null || r === undefined) return dash;
  return r.toFixed(1);
}

export function fmtNum(n: number | null | undefined, dp = 2): string {
  if (n === null || n === undefined) return dash;
  return Number.isInteger(n) && dp > 0 ? String(n) : n.toFixed(dp);
}

export function fmtPct(n: number | null | undefined, dp = 0): string {
  if (n === null || n === undefined) return dash;
  return `${(n * 100).toFixed(dp)}%`;
}

export function fmtSigned(n: number | null | undefined, dp = 2): string {
  if (n === null || n === undefined) return dash;
  return `${n > 0 ? "+" : ""}${n.toFixed(dp)}`;
}

export function fmtDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });
}

export function shortName(p: { fullName: string; displayName?: string | null }) {
  if (p.displayName) return p.displayName;
  const parts = p.fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1]! : parts[0]!;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/**
 * Colour band for a 1–10 match rating, as a CSS variable name.
 * Mirrors the familiar broadcast scale: red → amber → neutral → green → teal → orchid → gold.
 */
export function ratingVar(r: number | null | undefined): string {
  if (r === null || r === undefined) return "--muted-foreground";
  if (r >= 10) return "--motm";
  if (r >= 9) return "--rating";
  if (r >= 8) return "--assists";
  if (r >= 7) return "--win";
  if (r >= 6) return "--draw";
  if (r >= 5) return "--warning";
  return "--loss";
}

export function ratingStyle(r: number | null | undefined, alpha = 1): CSSProperties {
  return { color: `hsl(var(${ratingVar(r)}) / ${alpha})` };
}

export function ratingBg(r: number | null | undefined, alpha = 0.16): CSSProperties {
  const v = ratingVar(r);
  return { backgroundColor: `hsl(var(${v}) / ${alpha})`, color: `hsl(var(${v}))`, borderColor: `hsl(var(${v}) / 0.35)` };
}

export const POSITION_LABEL: Record<string, string> = {
  GK: "Goalkeeper",
  CB: "Centre-back",
  LB: "Left-back",
  RB: "Right-back",
  CDM: "Defensive mid",
  CM: "Central mid",
  CAM: "Attacking mid",
  LW: "Left wing",
  RW: "Right wing",
  ST: "Striker",
  UNKNOWN: "Utility",
};

export const POSITION_SHORT = (p: string) => (p === "UNKNOWN" ? "UTL" : p);

export const resultVar = (r: "W" | "D" | "L" | null) =>
  r === "W" ? "--win" : r === "L" ? "--loss" : r === "D" ? "--draw" : "--muted-foreground";
