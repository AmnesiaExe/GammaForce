import type { AlertItem } from "@/lib/scoring";

/** Midpoint on 0–100 axes (Eisenhower quadrants). */
export const EISENHOWER_MIDPOINT = 50;

export type EisenhowerQuadrant = "crises" | "interruption" | "goals" | "distraction";

export interface EisenhowerPlacement {
  urgency: number;
  importance: number;
  quadrant: EisenhowerQuadrant;
  quadrantLabel: string;
  quadrantHint: string;
}

const QUADRANT_META: Record<
  EisenhowerQuadrant,
  { label: string; hint: string }
> = {
  crises: {
    label: "Crises",
    hint: "Urgent and important. Treat as a statewide crisis; lead WASOC response now.",
  },
  interruption: {
    label: "Interruption",
    hint: "Urgent with lower agency weight. Contain quickly and limit spread.",
  },
  goals: {
    label: "Goals + planning",
    hint: "Important but less urgent. Schedule hardening and coordinated agency planning.",
  },
  distraction: {
    label: "Distraction",
    hint: "Lower urgency and importance. Monitor; avoid pulling senior capacity here.",
  },
};

export function getEisenhowerPlacement(alert: AlertItem): EisenhowerPlacement {
  const b = alert.scoreBreakdown;
  const urgency = Math.round(Math.min(100, Math.max(0, b.domainScores.final_score)));
  const importance = Math.round(
    Math.min(100, Math.max(0, b.agencyImpact.composite * 100)),
  );

  const urgent = urgency >= EISENHOWER_MIDPOINT;
  const important = importance >= EISENHOWER_MIDPOINT;

  let quadrant: EisenhowerQuadrant;
  if (urgent && important) quadrant = "crises";
  else if (urgent && !important) quadrant = "interruption";
  else if (!urgent && important) quadrant = "goals";
  else quadrant = "distraction";

  const meta = QUADRANT_META[quadrant];
  return {
    urgency,
    importance,
    quadrant,
    quadrantLabel: meta.label,
    quadrantHint: meta.hint,
  };
}

/** Small offset so stacked dots remain clickable (percent of plot area). */
export function eisenhowerDotJitter(seed: string, index: number): { dx: number; dy: number } {
  let h = index;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const angle = ((h & 7) / 8) * Math.PI * 2;
  const r = 1.1 + (Math.abs(h) % 4) * 0.55;
  return {
    dx: Math.cos(angle) * r,
    dy: Math.sin(angle) * r,
  };
}
