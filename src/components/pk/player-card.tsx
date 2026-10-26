"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { cardKeys, type Attributes, type CardTier } from "@/lib/stats/attributes";
import type { Keyword } from "@/lib/stats/keywords";
import { initials, POSITION_SHORT, fmtRating } from "./format";

export interface PlayerCardData {
  id: string;
  fullName: string;
  displayName: string | null;
  /** Position the card is rated at (best fit). */
  position: string;
  /** Position on the original game card, when different. */
  cardPosition?: string;
  squadNumber: number | null;
  imageUrl: string | null;
  nationality?: string | null;
  team?: string | null;
  ovr: number | null;
  tier: CardTier;
  attrs: Attributes | null;
  archetype?: { name: string } | null;
  signature?: Keyword[];
  apps: number;
  goals: number;
  assists: number;
  motm: number;
  avgRating: number | null;
}

/**
 * Collectible player card with pointer-driven 3D tilt and holographic foil.
 * `size="lg"` is the profile hero; `size="sm"` is the squad grid.
 */
export function PlayerCard({
  data,
  size = "sm",
  href,
  className,
}: {
  data: PlayerCardData;
  size?: "sm" | "lg";
  href?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [tilting, setTilting] = React.useState(false);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const max = size === "lg" ? 14 : 10;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--ry", `${(x - 0.5) * max * 2}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * max * 2}deg`);
    if (!tilting) setTilting(true);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "30%");
    setTilting(false);
  };

  const lg = size === "lg";
  const name = data.displayName || data.fullName;
  const surname = data.displayName || data.fullName.trim().split(/\s+/).slice(-1)[0]!;
  const unrated = data.ovr === null;

  const card = (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-tilting={tilting}
      className={cn(
        "pcard relative isolate select-none overflow-hidden",
        `tier-${data.tier.id}`,
        lg ? "w-[min(22rem,86vw)] text-[16px]" : "w-full text-[11.5px]",
        className,
      )}
      style={{ aspectRatio: "5 / 7.2" }}
    >
      {/* Background layers */}
      <div className="pcard-stripes absolute inset-0" />
      <div
        className="pointer-events-none absolute -right-[0.08em] top-[8%] font-display font-black leading-none opacity-[0.09]"
        style={{ fontSize: "16em", color: "var(--card-ink)" }}
        aria-hidden="true"
      >
        {data.squadNumber ?? POSITION_SHORT(data.position)}
      </div>
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] w-full opacity-[0.16]" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 40 V8 H100 V40 M30 8 V22 H70 V8 M42 8 V14 H58 V8 M38 22 A12 12 0 0 0 62 22" fill="none" stroke="var(--card-ink)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col p-[1.25em]">
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-start">
            <span className={cn("pcard-prism font-display font-black leading-[0.8] tabular-nums")} style={{ fontSize: "4.1em" }}>
              {unrated ? "—" : data.ovr}
            </span>
            <span className="mt-[0.2em] font-display font-extrabold uppercase tracking-[0.08em]" style={{ fontSize: "1.45em" }}>
              {POSITION_SHORT(data.position)}
              {data.cardPosition && data.cardPosition !== data.position && (
                <span className="pcard-muted ml-[0.35em] font-mono font-medium tracking-[0.1em]" style={{ fontSize: "0.42em" }} title={`Card position: ${data.cardPosition}`}>
                  CARD {POSITION_SHORT(data.cardPosition)}
                </span>
              )}
            </span>
            <span className="pcard-rule my-[0.45em] h-px w-[2.2em]" />
            <span className="pcard-accent font-mono font-semibold uppercase tracking-[0.18em]" style={{ fontSize: "0.68em" }}>
              {unrated ? "Unrated" : data.tier.name}
            </span>
          </div>

          {/* Portrait */}
          <div className="relative" style={{ width: "8.4em", height: "8.4em" }}>
            {data.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                style={{ maskImage: "linear-gradient(to bottom, black 70%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent)" }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center rounded-full border-2" style={{ borderColor: "var(--card-line-strong)" }}>
                <span className="font-display font-black tracking-tight" style={{ fontSize: "3.6em", color: "var(--card-ink)" }}>
                  {initials(data.fullName)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Name band */}
        <div className="mt-auto">
          <div className="pcard-muted truncate font-serif italic" style={{ fontSize: "1.05em" }}>
            {data.archetype?.name ?? (data.team || " ")}
          </div>
          <div className="truncate font-display font-black uppercase leading-[0.9] tracking-[0.02em]" style={{ fontSize: name.length > 14 ? "2.15em" : "2.6em" }} title={data.fullName}>
            {surname}
          </div>
          <div className="pcard-rule mt-[0.6em] h-px w-full" />
        </div>

        {/* Attributes */}
        <div className="mt-[0.7em] grid grid-cols-3 gap-x-[0.9em] gap-y-[0.35em]">
          {cardKeys(data.position).map((k) => (
            <div key={k} className="flex items-baseline justify-between gap-1">
              <span className="pcard-muted font-mono font-medium tracking-[0.1em]" style={{ fontSize: "0.72em" }}>
                {k}
              </span>
              <span className="font-display font-black tabular-nums" style={{ fontSize: "1.45em" }}>
                {data.attrs ? data.attrs[k] : "–"}
              </span>
            </div>
          ))}
        </div>

        {/* Footer: raw output line */}
        <div className="pcard-rule mt-[0.7em] h-px w-full" />
        <div className="mt-[0.55em] flex items-center justify-between font-mono uppercase tracking-[0.1em]" style={{ fontSize: "0.66em" }}>
          <span>
            <b className="font-semibold">{data.apps}</b> <span className="pcard-muted">APP</span>
          </span>
          <span>
            <b className="font-semibold">{data.goals}</b> <span className="pcard-muted">G</span>
          </span>
          <span>
            <b className="font-semibold">{data.assists}</b> <span className="pcard-muted">A</span>
          </span>
          <span>
            <b className="font-semibold">{data.motm}</b> <span className="pcard-muted">★</span>
          </span>
          <span>
            <b className="font-semibold">{fmtRating(data.avgRating)}</b> <span className="pcard-muted">AVG</span>
          </span>
        </div>
      </div>

      {/* Foil + frame on top */}
      <div className="pcard-foil pointer-events-none absolute inset-0 z-20" />
      <div className="pcard-frame pointer-events-none absolute inset-0 z-30" />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-sm focus-visible:outline-offset-4" aria-label={`${name} — overall ${data.ovr ?? "unrated"}`}>
        {card}
      </Link>
    );
  }
  return card;
}
