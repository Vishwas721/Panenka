"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export const THEMES = ["touchline", "matchday", "champions"] as const;
export type Theme = (typeof THEMES)[number];

export function ThemeProvider({
  children,
  defaultTheme = "touchline",
  attribute = "data-theme",
  enableSystem = false,
  themes = ["touchline", "matchday", "champions"],
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      themes={themes}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
