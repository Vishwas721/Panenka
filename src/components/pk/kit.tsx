/**
 * Panenka kit — small presentational building blocks shared by every page.
 * Server-safe: no hooks, no client state.
 */
import * as React from "react";
import Link from "next/link";
import {
  Target, Handshake, Zap, Shirt, Star, Flame, TrendingUp, Gauge, Trophy, Timer, Armchair,
  Home, Swords, Landmark, Crosshair, CalendarDays, Hexagon, Fingerprint, Medal, Crown,
  Skull, Award, Moon, Shield, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Family, Rarity, Keyword, KeywordDef } from "@/lib/stats/keywords";
import { fmtRating, ratingBg, resultVar, initials } from "./format";

// ---------------------------------------------------------------------------

export function Masthead({
  kicker,
  title,
  accent,
  children,
  actions,
  className,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  accent?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("rise relative mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        {kicker && <div className="eyebrow mb-3 flex items-center gap-2">{kicker}</div>}
        <h1 className="font-display text-[clamp(3rem,9vw,7.5rem)] font-black uppercase leading-[0.82] tracking-[-0.01em]">
          {title}
          {accent && <span className="ml-3 align-baseline font-serif text-[0.42em] font-normal normal-case italic tracking-normal text-primary">{accent}</span>}
        </h1>
        {children && <div className="mt-4 max-w-2xl text-[0.95rem] text-muted-foreground">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionHeading({
  index,
  title,
  note,
  action,
  className,
}: {
  index?: string;
  title: React.ReactNode;
  note?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="flex items-baseline gap-3">
        {index && <span className="font-mono text-xs text-primary">{index}</span>}
        <h2 className="font-display text-[1.7rem] font-extrabold uppercase leading-none tracking-wide">{title}</h2>
        {note && <span className="hidden font-serif text-lg italic text-muted-foreground sm:inline">{note}</span>}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
  size = "md",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "goals" | "assists" | "motm" | "rating" | "primary" | "win" | "loss";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = { sm: "text-3xl", md: "text-5xl", lg: "text-6xl", xl: "text-[5.5rem]" };
  const tones = {
    goals: "text-goals",
    assists: "text-assists",
    motm: "text-motm",
    rating: "text-rating",
    primary: "text-primary",
    win: "text-win",
    loss: "text-loss",
  };
  return (
    <div className={cn("min-w-0", className)}>
      <div className="eyebrow truncate">{label}</div>
      <div className={cn("numeral mt-1.5", sizes[size], tone && tones[tone])}>{value}</div>
      {sub && <div className="mt-1.5 truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function RatingPill({ rating, className, size = "md" }: { rating: number | null | undefined; className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-6 min-w-[2.3rem] text-[0.78rem]", md: "h-7 min-w-[2.7rem] text-sm", lg: "h-10 min-w-[3.6rem] text-xl" };
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-md border px-1.5 font-display font-extrabold tabular-nums", sizes[size], className)}
      style={ratingBg(rating)}
    >
      {fmtRating(rating)}
    </span>
  );
}

export function ResultBadge({ result, className }: { result: "W" | "D" | "L" | null; className?: string }) {
  return (
    <span
      className={cn("inline-grid h-6 w-6 place-items-center rounded-md font-display text-sm font-black text-background", className)}
      style={{ backgroundColor: `hsl(var(${resultVar(result)}))` }}
      aria-label={result === "W" ? "Win" : result === "L" ? "Loss" : result === "D" ? "Draw" : "No score"}
    >
      {result ?? "–"}
    </span>
  );
}

/** Horizontal strip of recent matches: result colour on top, rating below. */
export function FormStrip({
  items,
  className,
}: {
  items: { matchId: string; result: "W" | "D" | "L" | null; rating: number | null; goals: number; assists: number; motm: boolean; opponent: string }[];
  className?: string;
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No appearances yet.</p>;
  return (
    <div className={cn("flex gap-1.5", className)}>
      {items.map((t) => (
        <Link
          key={t.matchId}
          href={`/matches/${t.matchId}`}
          title={`vs ${t.opponent}${t.goals ? ` · ${t.goals}G` : ""}${t.assists ? ` · ${t.assists}A` : ""}${t.motm ? " · MOTM" : ""}`}
          className="group relative flex w-11 flex-col overflow-hidden rounded-md border bg-elevated/60 text-center transition-transform hover:-translate-y-0.5"
        >
          <span className="h-1.5" style={{ backgroundColor: `hsl(var(${resultVar(t.result)}))` }} />
          <span className="py-1.5 font-display text-base font-extrabold tabular-nums" style={{ color: ratingBg(t.rating).color }}>
            {fmtRating(t.rating)}
          </span>
          <span className="flex h-3.5 items-center justify-center gap-0.5 pb-1">
            {Array.from({ length: Math.min(t.goals, 3) }).map((_, i) => (
              <span key={`g${i}`} className="h-1.5 w-1.5 rounded-full bg-goals" />
            ))}
            {Array.from({ length: Math.min(t.assists, 3) }).map((_, i) => (
              <span key={`a${i}`} className="h-1.5 w-1.5 rotate-45 bg-assists" />
            ))}
            {t.motm && <Star className="h-2.5 w-2.5 fill-motm text-motm" />}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function Meter({ value, max = 1, tone = "primary", className }: { value: number; max?: number; tone?: string; className?: string }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0)) * 100;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]", className)}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, backgroundColor: `hsl(var(--${tone}))` }} />
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("panel pitch-lines flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="font-display text-4xl font-black uppercase tracking-wide">{title}</div>
      {children && <p className="mt-3 max-w-md font-serif text-lg italic text-muted-foreground">{children}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function PlayerAvatar({
  name,
  imageUrl,
  number,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  number?: number | null;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border bg-elevated font-display text-sm font-extrabold", className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
      {number != null && !imageUrl && (
        <span className="absolute -bottom-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-0.5 font-mono text-[0.55rem] text-background">
          {number}
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Keywords
// ---------------------------------------------------------------------------

export const FAMILY_ICONS: Record<Family, LucideIcon> = {
  goals: Target,
  assists: Handshake,
  ga: Zap,
  apps: Shirt,
  motm: Star,
  hauls: Crosshair,
  streaks: Flame,
  rating: Gauge,
  rates: TrendingUp,
  results: Trophy,
  minutes: Timer,
  bench: Armchair,
  venue: Home,
  opponents: Swords,
  career: Landmark,
  clutch: Skull,
  calendar: CalendarDays,
  attributes: Hexagon,
  archetype: Fingerprint,
  feat: Award,
  squad: Crown,
  rivalry: Swords,
  competition: Medal,
  season: Trophy,
  month: Moon,
  defence: Shield,
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

export function KeywordChip({
  keyword,
  locked,
  size = "md",
  className,
}: {
  keyword: Keyword | KeywordDef;
  locked?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const Icon = FAMILY_ICONS[keyword.family] ?? Award;
  const v = `--r-${keyword.rarity}`;
  const mythic = keyword.rarity === "mythic" && !locked;
  return (
    <span
      title={`${RARITY_LABEL[keyword.rarity]} · ${keyword.description}`}
      className={cn(
        "relative inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border font-semibold",
        size === "sm" ? "h-6 px-2 text-[0.7rem]" : "h-8 px-3 text-[0.8rem]",
        locked && "opacity-45 grayscale",
        className,
      )}
      style={{
        borderColor: `hsl(var(${v}) / ${mythic ? 0.7 : 0.4})`,
        backgroundColor: `hsl(var(${v}) / 0.1)`,
        color: `hsl(var(${v}))`,
        boxShadow: keyword.rarity === "legendary" || mythic ? `0 0 18px -6px hsl(var(${v}) / 0.8)` : undefined,
      }}
    >
      <Icon className={size === "sm" ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
      <span className={cn("truncate", mythic && "mythic-text")}>{keyword.name}</span>
    </span>
  );
}

export function RarityDot({ rarity, className }: { rarity: Rarity; className?: string }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", className)} style={{ backgroundColor: `hsl(var(--r-${rarity}))` }} />;
}
