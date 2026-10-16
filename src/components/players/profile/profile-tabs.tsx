"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Tab bar for the profile; panels are rendered on the server and passed in. */
export function ProfileTabs({ tabs }: { tabs: { id: string; label: string; count?: number; content: React.ReactNode }[] }) {
  const [active, setActive] = React.useState(tabs[0]!.id);

  React.useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (tabs.some((t) => t.id === fromHash)) setActive(fromHash);
  }, [tabs]);

  const select = (id: string) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div>
      <div role="tablist" aria-label="Profile sections" className="scrollbar-none sticky top-[6.1rem] z-30 -mx-4 mb-8 flex gap-1 overflow-x-auto border-b bg-background/80 px-4 backdrop-blur-xl sm:mx-0 sm:px-0">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            onClick={() => select(t.id)}
            className={cn(
              "relative flex shrink-0 items-baseline gap-2 px-4 py-3.5 font-display text-lg font-extrabold uppercase tracking-wide transition-colors",
              active === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="font-mono text-[0.6rem] text-primary">{String(i + 1).padStart(2, "0")}</span>
            {t.label}
            {t.count !== undefined && <span className="font-mono text-[0.65rem] text-muted-foreground">{t.count}</span>}
            {active === t.id && <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-primary" />}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={active !== t.id} className={active === t.id ? "rise" : undefined}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
