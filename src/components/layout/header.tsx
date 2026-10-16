"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Plus, Search } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenMobileNav?: () => void;
  className?: string;
}

export function Header({ onOpenMobileNav, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8",
        className
      )}
    >
      {/* Left Area: Mobile Trigger & Search Input Mockup */}
      <div className="flex flex-1 items-center gap-3">
        {/* Mobile Hamburger Trigger */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenMobileNav}
          className="h-9 w-9 shrink-0 md:hidden border-border/80 text-muted-foreground hover:text-foreground"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Small Screen Mobile Wordmark */}
        <div className="flex items-center gap-1.5 md:hidden">
          <span className="font-display text-sm font-black tracking-widest text-foreground">
            {brand.wordmark}
          </span>
        </div>

        {/* Global Search Bar Mockup */}
        <div className="relative w-full max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search players, matches..."
            readOnly
            className="h-9 w-full cursor-pointer rounded-md border border-border/80 bg-secondary/35 pl-9 pr-12 text-xs text-foreground placeholder:text-muted-foreground transition-colors hover:bg-secondary/60 focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Global search input mockup"
          />
          <div className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:flex items-center gap-0.5">
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Area: Theme Switcher & Log Match Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeSwitcher variant="dropdown" className="w-[130px] sm:w-[160px]" />

        <Button
          asChild
          size="sm"
          className="h-9 gap-1.5 px-3 sm:px-4 font-semibold shadow-xs"
        >
          <Link href="/matches/new">
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">Log Match</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
