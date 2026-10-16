import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to a fixed number of decimal places for display.
 * Returns "—" for null/undefined values.
 */
export function formatRate(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(decimals);
}

/**
 * Format a number with commas for display.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
