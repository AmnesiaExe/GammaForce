"use client";

import { scoreColorHex } from "@/lib/riskColors";

interface ScoreBarProps {
  value: number;
  height?: number;
}

/** Horizontal fill bar with solid hex colour (CSS variables often fail on fills). */
export function ScoreBar({ value, height = 8 }: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const color = scoreColorHex(pct);
  return (
    <div className="gov-bar-track" style={{ height }}>
      <div
        className="gov-bar-fill"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          boxShadow: pct > 0 ? `0 0 6px ${color}66` : undefined,
        }}
      />
    </div>
  );
}
