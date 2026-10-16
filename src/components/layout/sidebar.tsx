"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Trophy,
  Scale,
  Activity,
  CircleDot,
} from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Players",
    href: "/players",
    icon: Users,
  },
  {
    label: "Matches",
    href: "/matches",
    icon: CalendarDays,
  },
  {
    label: "Goal & Assist Breakdown",
    href: "/breakdown",
    icon: Trophy,
  },
  {
    label: "Compare",
    href: "/compare",
    icon: Scale,
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-card text-card-foreground select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary shadow-xs transition-transform group-hover:scale-105">
            <Activity className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-black tracking-widest text-foreground">
              {brand.wordmark}
            </span>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
              Tactical Analytics
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3">
          <p className="text-[10px] font-mono font-semibold tracking-widest text-muted-foreground uppercase">
            Navigation
          </p>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "border border-primary/25 bg-primary/10 text-primary shadow-xs font-semibold"
                    : "border border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {/* Tactical active vertical bar indicator */}
                {active && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-primary shadow-xs"
                    aria-hidden="true"
                  />
                )}

                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />

                <span className="truncate">{item.label}</span>

                {/* Tactical indicator dot for active view */}
                {active && (
                  <CircleDot
                    className="ml-auto h-3 w-3 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tactical Status & Diagnostics Footer */}
      <div className="p-3 border-t border-border">
        <div className="rounded-md border border-border/70 bg-secondary/30 p-3">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-muted-foreground">LOCAL ENGINE</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-muted-foreground/80">
            <span>DATABASE</span>
            <span className="tabular-nums">POSTGRES :5434</span>
          </div>
        </div>
      </div>
    </div>
  );
}
