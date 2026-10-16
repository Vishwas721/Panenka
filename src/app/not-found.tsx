export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-secondary/60 p-4 mb-4 border border-border">
        <span className="text-3xl font-display font-black text-primary">404</span>
      </div>
      <h1 className="text-2xl font-bold font-display tracking-tight text-foreground sm:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The requested tactical view, match report, or player profile does not exist or has been relocated.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        >
          Return to Overview
        </a>
        <a
          href="/players"
          className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        >
          View Squad
        </a>
      </div>
    </div>
  );
}
