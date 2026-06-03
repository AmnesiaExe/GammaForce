import { CyberRiskLevel } from "@/lib/cyberPriorityScoring";

export function riskColor(level: CyberRiskLevel | string): string {
  switch (level) {
    case "CRITICAL":
      return "var(--danger-solid)";
    case "HIGH":
      return "var(--warning-solid)";
    case "MEDIUM":
      return "var(--brand-solid)";
    case "LOW":
      return "var(--success-solid)";
    default:
      return "var(--neutral-solid)";
  }
}

export function scoreColor(score: number): string {
  if (score >= 85) return "var(--danger-solid)";
  if (score >= 70) return "var(--warning-solid)";
  if (score >= 50) return "var(--brand-solid)";
  return "var(--success-solid)";
}
