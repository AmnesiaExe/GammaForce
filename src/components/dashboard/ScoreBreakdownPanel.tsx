"use client";

import { PriorityBreakdownPanel } from "@/components/dashboard/PriorityBreakdownPanel";
import { AlertItem } from "@/lib/scoring";

interface ScoreBreakdownPanelProps {
  alert: AlertItem | null;
}

export function ScoreBreakdownPanel({ alert }: ScoreBreakdownPanelProps) {
  if (!alert) return null;
  return <PriorityBreakdownPanel alert={alert} />;
}
