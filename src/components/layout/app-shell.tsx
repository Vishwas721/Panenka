"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, CalendarDays, Swords, Trophy, Sparkles, Plus, Crown } from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import type { TickerItem } from "@/server/services/insights.service";

export const NAV_ITEMS = [
  { label: "Matchday", short: "Home", href: "/", icon: Home, exact: true },
  { label: "Squad", short: "Squad", href: "/players", icon: Users },
  { label: "Fixtures", short: "Games", href: "/matches", icon: CalendarDays },
  { label: "Records", short: "Records", href: "/records", icon: Trophy },
  { label: "Ballon d'Or", short: "Ballon", href: "/ballon-dor", icon: Crown },
  { label: "Head to Head", short: "H2H", href: "/compare", icon: Swords },
  { label: "Codex", short: "Codex", href: "/keywords", icon: Sparkles },
] as const;

/** The Panenka chip: a ball floating over a crossbar on a soft arc. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M5 33 Q 20 2 35 33" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2.5 3.5" strokeLinecap="round" opacity="0.55" />
      <path d="M8 34 H32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 34 V24 M30 34 V24 M10 24 H30" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle cx="20" cy="13" r="5" fill="hsl(var(--primary))" />
    </svg>
  );
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/records") return pathname.startsWith("/records") || pathname.startsWith("/breakdown");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Ticker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;
  const row = items.map((m) => (
    <Link
      key={m.id}
      href={`/matches/${m.id}`}
      className="flex shrink-0 items-center gap-2.5 px-5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
    >
      <span
        className={cn(
          "grid h-4 w-4 place-items-center rounded-[3px] text-[0.6rem] font-bold text-background",
          m.result === "W" ? "bg-win" : m.result === "L" ? "bg-loss" : m.result === "D" ? "bg-draw" : "bg-muted-foreground",
        )}
      >
        {m.result ?? "–"}
      </span>
      <span className="text-foreground">
        {m.venue === "AWAY" ? "@" : "vs"} {m.opponent}
      </span>
      {m.goalsFor !== null && (
        <span className="font-semibold tabular-nums text-foreground">
          {m.goalsFor}–{m.goalsAgainst}
        </span>
      )}
      {m.scorers.length > 0 && (
        <span className="normal-case tracking-normal">
          {m.scorers.map((s) => `${s.name}${s.goals > 1 ? ` ×${s.goals}` : ""}`).join(", ")}
        </span>
      )}
      {m.motm && (
        <span className="text-motm">★ {m.motm}</span>
      )}
      <span className="pl-3 text-border">/</span>
    </Link>
  ));
  return (
    <div className="relative overflow-hidden border-b bg-card/40 py-1.5 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
      <div className="marquee flex w-max" style={{ ["--marquee-duration" as string]: `${Math.max(25, items.length * 7)}s` }}>
        {row}
        {row}
      </div>
    </div>
  );
}

export function AppShell({ children, ticker }: { children: React.ReactNode; ticker: TickerItem[] }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-2.5" aria-label={`${brand.name} home`}>
            <Logo className="h-9 w-9 text-foreground transition-transform duration-500 group-hover:-rotate-6" />
            <span className="font-display text-2xl font-black uppercase leading-none tracking-[0.06em]">
              {brand.wordmark}
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && <span className="absolute inset-0 -z-10 rounded-full border border-foreground/15 bg-elevated" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <ThemeSwitcher />
            <Link
              href="/matches/new"
              className="hidden h-9 items-center gap-1.5 rounded-full bg-primary px-4 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] transition-transform hover:scale-[1.03] sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" /> Log match
            </Link>
          </div>
        </div>
        <Ticker items={ticker} />
      </header>

      <main className="mx-auto w-full max-w-[90rem] px-4 pb-32 pt-8 sm:px-6 lg:px-10 lg:pb-20">{children}</main>

      {/* Mobile / tablet bottom tab bar */}
      <nav
        className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-between rounded-2xl border bg-card/90 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden"
        aria-label="Main"
      >
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 font-mono text-[0.56rem] uppercase tracking-normal", active ? "bg-elevated text-foreground" : "text-muted-foreground")}>
              <Icon className="h-4 w-4" />
              {item.short}
            </Link>
          );
        })}
        <Link href="/matches/new" className="mx-1 grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground" aria-label="Log match">
          <Plus className="h-5 w-5" />
        </Link>
        {NAV_ITEMS.slice(4).map((item) => {
          const active = isActive(pathname, item.href, false);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 font-mono text-[0.56rem] uppercase tracking-normal", active ? "bg-elevated text-foreground" : "text-muted-foreground")}>
              <Icon className="h-4 w-4" />
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
