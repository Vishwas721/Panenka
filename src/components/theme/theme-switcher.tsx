"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ThemeId = "touchline" | "matchday" | "champions";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  palette: string;
  accentColor: string;
  baseColor: string;
}

export const THEMES: readonly ThemeMeta[] = [
  {
    id: "touchline",
    name: "Touchline",
    palette: "Midnight navy & electric lime",
    accentColor: "#c8ff00",
    baseColor: "#0b101e",
  },
  {
    id: "matchday",
    name: "Matchday",
    palette: "Warm ivory & forest pitch green",
    accentColor: "#206040",
    baseColor: "#f6f4ee",
  },
  {
    id: "champions",
    name: "Champions",
    palette: "Deep black & metallic gold",
    accentColor: "#e6ad19",
    baseColor: "#0d0d0d",
  },
];

/**
 * Color chip representing a theme's palette (base surface and primary accent).
 */
export function ThemeColorDots({
  theme,
  className,
}: {
  theme: ThemeMeta;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center -space-x-1 shrink-0", className)}
      aria-hidden="true"
    >
      <span
        className="h-3 w-3 rounded-full border border-border/80 shadow-xs"
        style={{ backgroundColor: theme.baseColor }}
        title={`Surface: ${theme.palette}`}
      />
      <span
        className="h-3 w-3 rounded-full border border-border/60 shadow-xs"
        style={{ backgroundColor: theme.accentColor }}
        title={`Accent: ${theme.palette}`}
      />
    </span>
  );
}

/**
 * Segmented control toggle between the three themes.
 * Keyboard accessible (arrow keys, home, end, space/enter) and aria-compliant.
 */
export function ThemeSegmentedControl({
  className,
}: {
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: ThemeId =
    mounted && (theme === "matchday" || theme === "champions" || theme === "touchline")
      ? (theme as ThemeId)
      : "touchline";

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (index + 1) % THEMES.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (index - 1 + THEMES.length) % THEMES.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = THEMES.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const targetTheme = THEMES[nextIndex];
      if (targetTheme) {
        setTheme(targetTheme.id);
        buttonRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme selector"
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-muted/40 p-1 text-muted-foreground",
        className
      )}
    >
      {THEMES.map((item, index) => {
        const isSelected = currentTheme === item.id;
        return (
          <button
            key={item.id}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => setTheme(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            title={`${item.name} (${item.palette})`}
            aria-label={`${item.name} theme: ${item.palette}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isSelected
                ? "bg-background text-foreground shadow-sm font-semibold border border-border/40"
                : "hover:bg-background/50 hover:text-foreground"
            )}
          >
            <ThemeColorDots theme={item} />
            <span>{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Interactive dropdown switcher for the three themes using the shadcn Select component.
 */
export function ThemeDropdown({
  className,
}: {
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: ThemeId =
    mounted && (theme === "matchday" || theme === "champions" || theme === "touchline")
      ? (theme as ThemeId)
      : "touchline";

  const selectedThemeMeta: ThemeMeta =
    THEMES.find((t) => t.id === currentTheme) ?? THEMES[0]!;

  return (
    <Select value={currentTheme} onValueChange={(val) => setTheme(val)}>
      <SelectTrigger
        aria-label={`Current theme: ${selectedThemeMeta.name}. Select a theme.`}
        className={cn("w-[180px] h-9 gap-2", className)}
      >
        <div className="flex items-center gap-2 truncate">
          <ThemeColorDots theme={selectedThemeMeta} />
          <SelectValue placeholder="Select theme">
            <span>{selectedThemeMeta.name}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent align="end">
        {THEMES.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            <div className="flex items-center gap-2">
              <ThemeColorDots theme={item} />
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {item.palette}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface ThemeSwitcherProps {
  variant?: "segmented" | "dropdown";
  className?: string;
}

/**
 * Universal Theme Switcher component supporting segmented control or dropdown variants.
 */
export function ThemeSwitcher({
  variant = "segmented",
  className,
}: ThemeSwitcherProps) {
  if (variant === "dropdown") {
    return <ThemeDropdown className={className} />;
  }
  return <ThemeSegmentedControl className={className} />;
}

export default ThemeSwitcher;
