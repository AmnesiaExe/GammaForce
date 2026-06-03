export type Severity = "Critical" | "High" | "Medium" | "Low";
export type Category = "Vulnerability" | "Threat Intelligence";
export type AlertStatus =
  | "New"
  | "Triaging"
  | "In progress"
  | "Blocked"
  | "Resolved";

import type { AgencyImpactBreakdown, AgencyRankEntry } from "@/lib/agencyRanking";
import type { CyberRiskLevel, DomainScores, ThreatExplanation } from "@/lib/cyberPriorityScoring";

export interface ScoreBreakdown {
  technical: number;
  sourceCredibility: number;
  agencyExposure: number;
  contextSignals: number;
  priorityScore: number;
  agencyCount: number;
  agencyCriticality: number;
  sourceReputationPercent: number;
  sourceLabel: string;
  affectedAgencyNames: string[];
  /** CyberPriority 5-domain vulnerability breakdown (0–100 each). */
  domainScores: DomainScores;
  cyberRiskLevel: CyberRiskLevel;
  agencyImpact: AgencyImpactBreakdown;
  /** Per-agency urgency when multiple WA agencies share this issue. */
  agencyRanking: AgencyRankEntry[];
  explanation: ThreatExplanation;
}

export interface AlertItem {
  id: string;
  title: string;
  category: Category;
  source: string;
  sourceKey: string;
  cvss: number;
  exploitability: number;
  assetExposure: number;
  businessImpact: number;
  compositeScore: number;
  severity: Severity;
  status: AlertStatus;
  slaHoursRemaining: number;
  kevListed: boolean;
  assignee: string;
  environment: string;
  iocCount: number;
  relatedIncidents: number;
  receivedAt: string;
  receivedDisplay: string;
  affectedAssets: string;
  affectedAgencyIds: string[];
  agencyCount: number;
  scoreBreakdown: ScoreBreakdown;
  recommendedAction: string;
  analystNotes: string;
}

/** Fused priority (0–1). Bands align with cyberRiskLevel (85 / 70 / 50 on 0–100). */
export function severityFromScore(score: number): Severity {
  const pct = score * 100;
  if (pct >= 85) return "Critical";
  if (pct >= 70) return "High";
  if (pct >= 50) return "Medium";
  return "Low";
}

export function matrixBand(value: number): "Low" | "Medium" | "High" {
  if (value >= 4) return "High";
  if (value >= 2.5) return "Medium";
  return "Low";
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export function severityTagVariant(
  severity: Severity,
): "danger" | "warning" | "brand" | "neutral" {
  switch (severity) {
    case "Critical":
      return "danger";
    case "High":
      return "warning";
    case "Medium":
      return "brand";
    default:
      return "neutral";
  }
}

export function severityStripColor(severity: Severity): string {
  switch (severity) {
    case "Critical":
      return "var(--danger-solid)";
    case "High":
      return "var(--warning-solid)";
    case "Medium":
      return "var(--brand-solid)";
    default:
      return "var(--neutral-solid)";
  }
}

export function statusTagVariant(
  status: AlertStatus,
): "danger" | "warning" | "brand" | "success" | "neutral" {
  switch (status) {
    case "Blocked":
      return "danger";
    case "In progress":
      return "brand";
    case "Triaging":
      return "warning";
    case "Resolved":
      return "success";
    default:
      return "neutral";
  }
}

export function formatSla(hours: number): string {
  if (hours <= 0) return "SLA breached";
  if (hours < 1) return `${Math.round(hours * 60)}m remaining`;
  if (hours < 24) return `${Math.round(hours)}h remaining`;
  return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h remaining`;
}
