"use client";

import * as React from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error to stderr in development
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-4 border border-destructive/20 text-destructive">
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold font-display tracking-tight text-foreground sm:text-3xl">
        System Interruption
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        An unexpected error occurred while rendering this view. Your match logs and player stats remain secure.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        >
          Retry View
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        >
          Return to Overview
        </a>
      </div>
    </div>
  );
}
