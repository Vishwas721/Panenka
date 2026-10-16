"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";

export interface PickerOption {
  id: string;
  name: string;
  position: string;
  ovr: number | null;
}

/** Two native selects that drive ?a=&b= — native so they work great on mobile. */
export function PlayerPicker({ options, a, b }: { options: PickerOption[]; a: string; b: string }) {
  const router = useRouter();
  const go = (na: string, nb: string) => router.push(`/compare?a=${encodeURIComponent(na)}&b=${encodeURIComponent(nb)}`);

  const select = (value: string, onChange: (v: string) => void, label: string, tone: string) => (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="eyebrow" style={{ color: `hsl(var(${tone}))` }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full min-w-0 rounded-md border border-input bg-background/60 px-3 font-display text-lg font-extrabold uppercase tracking-wide focus-visible:border-primary"
        style={{ borderColor: `hsl(var(${tone}) / 0.5)` }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} · {o.position} · {o.ovr ?? "—"}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="panel flex flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-end">
      {select(a, (v) => go(v, b), "Corner one", "--primary")}
      <button
        type="button"
        onClick={() => go(b, a)}
        className="grid h-11 w-11 shrink-0 place-items-center self-center rounded-full border transition-colors hover:border-foreground/40 hover:bg-secondary sm:self-end"
        aria-label="Swap players"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </button>
      {select(b, (v) => go(a, v), "Corner two", "--assists")}
    </div>
  );
}
