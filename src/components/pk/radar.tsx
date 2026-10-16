import * as React from "react";
import { ATTRIBUTE_KEYS, ATTRIBUTE_META, type Attributes } from "@/lib/stats/attributes";
import { cn } from "@/lib/utils";

export interface RadarSeries {
  label: string;
  values: Attributes;
  /** CSS variable name, e.g. "--primary" */
  colorVar: string;
}

/** Hexagonal attribute radar. Accepts one or two series for head-to-heads. */
export function Radar({ series, size = 320, className, showValues = true }: { series: RadarSeries[]; size?: number; className?: string; showValues?: boolean }) {
  const pad = 46;
  const c = size / 2;
  const r = c - pad;
  const angle = (i: number) => (Math.PI * 2 * i) / ATTRIBUTE_KEYS.length - Math.PI / 2;
  const pt = (i: number, v: number) => [c + Math.cos(angle(i)) * r * (v / 100), c + Math.sin(angle(i)) * r * (v / 100)] as const;
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={cn("h-auto w-full max-w-full overflow-visible", className)} role="img" aria-label={`Attribute radar: ${series.map((s) => `${s.label} ${ATTRIBUTE_KEYS.map((k) => `${k} ${s.values[k]}`).join(", ")}`).join("; ")}`}>
      {[25, 50, 75, 100].map((ring) => (
        <polygon
          key={ring}
          points={poly(ATTRIBUTE_KEYS.map(() => ring))}
          fill={ring === 100 ? "hsl(var(--foreground) / 0.025)" : "none"}
          stroke="hsl(var(--foreground) / 0.1)"
          strokeDasharray={ring === 100 ? undefined : "2 4"}
        />
      ))}
      {ATTRIBUTE_KEYS.map((k, i) => {
        const [x, y] = pt(i, 100);
        return <line key={k} x1={c} y1={c} x2={x} y2={y} stroke="hsl(var(--foreground) / 0.08)" />;
      })}
      {series.map((s, si) => {
        const vals = ATTRIBUTE_KEYS.map((k) => s.values[k]);
        return (
          <g key={s.label}>
            <polygon points={poly(vals)} fill={`hsl(var(${s.colorVar}) / ${series.length > 1 ? 0.14 : 0.2})`} stroke={`hsl(var(${s.colorVar}))`} strokeWidth={2} strokeLinejoin="round" />
            {vals.map((v, i) => {
              const [x, y] = pt(i, v);
              return <circle key={i} cx={x} cy={y} r={si === 0 ? 3.5 : 3} fill={`hsl(var(${s.colorVar}))`} />;
            })}
          </g>
        );
      })}
      {ATTRIBUTE_KEYS.map((k, i) => {
        const [x, y] = pt(i, 128);
        return (
          <g key={k}>
            <text x={x} y={y - (showValues ? 6 : 0)} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground font-mono" style={{ fontSize: 10.5, letterSpacing: "0.12em" }}>
              <title>{ATTRIBUTE_META[k].name}</title>
              {k}
            </text>
            {showValues && (
              <text x={x} y={y + 10} textAnchor="middle" dominantBaseline="middle" className="font-display" style={{ fontSize: 17, fontWeight: 800 }}>
                {series.map((s, si) => (
                  <tspan key={s.label} fill={`hsl(var(${s.colorVar}))`} dx={si ? 6 : 0}>
                    {s.values[k]}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
