"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Theme } from "./theme-provider";

export interface ThemeMeta {
  id: Theme;
  name: string;
  palette: string;
  accentColor: string;
  baseColor: string;
}

export const THEMES: readonly ThemeMeta[] = [
  {
    id: "floodlight",
    name: "Floodlight",
    palette: "Night match: violet-black, chalk and ember",
    accentColor: "#ff6a3d",
    baseColor: "#0b0a10",
  },
  {
    id: "programme",
    name: "Programme",
    palette: "Printed matchday programme: paper and ink",
    accentColor: "#da3a0e",
    baseColor: "#f3eee3",
  },
];

/** Two-position toggle styled like a stadium light switch. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const night = !mounted || theme !== "programme";

  return (
    <button
      type="button"
      onClick={() => setTheme(night ? "programme" : "floodlight")}
      className={cn(
        "group relative inline-flex h-9 w-[4.25rem] items-center rounded-full border bg-elevated/70 p-1 transition-colors hover:border-foreground/30",
        className,
      )}
      aria-label={`Switch to ${night ? "Programme (light)" : "Floodlight (dark)"} theme`}
      title={night ? "Programme theme" : "Floodlight theme"}
    >
      <span
        className={cn(
          "absolute top-1 h-7 w-7 rounded-full bg-foreground shadow transition-transform duration-300",
          night ? "translate-x-0" : "translate-x-[1.95rem]",
        )}
      />
      <Moon className={cn("relative z-10 ml-1.5 h-3.5 w-3.5 transition-colors", night ? "text-background" : "text-muted-foreground")} />
      <Newspaper className={cn("relative z-10 ml-auto mr-1.5 h-3.5 w-3.5 transition-colors", night ? "text-muted-foreground" : "text-background")} />
    </button>
  );
}
