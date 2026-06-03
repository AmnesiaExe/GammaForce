import { AlertStatus, Category } from "@/lib/scoring";

export const OPS_METRICS = {
  meanTimeToTriageHours: 2.4,
  slaAtRisk: 3,
  kevOpen: 4,
  internetExposed: 7,
  agenciesAffected: 140,
  autoEnrichedPercent: 68,
} as const;

export const ALERT_VOLUME_TREND = [
  { label: "28 May", critical: 1, high: 2, medium: 3, low: 1 },
  { label: "29 May", critical: 2, high: 1, medium: 2, low: 2 },
  { label: "30 May", critical: 1, high: 3, medium: 4, low: 1 },
  { label: "31 May", critical: 3, high: 2, medium: 3, low: 0 },
  { label: "01 Jun", critical: 2, high: 4, medium: 5, low: 2 },
  { label: "02 Jun", critical: 4, high: 3, medium: 4, low: 1 },
  { label: "03 Jun", critical: 4, high: 2, medium: 5, low: 1 },
];

export const CATEGORY_BREAKDOWN = [
  { name: "Vulnerability", value: 8, color: "blue" },
  { name: "Threat intelligence", value: 4, color: "cyan" },
];

export const WORKFLOW_COUNTS: Record<AlertStatus, number> = {
  New: 3,
  Triaging: 2,
  "In progress": 4,
  Blocked: 1,
  Resolved: 2,
};

export const ACTIVITY_FEED = [
  {
    time: "09:28 AWST",
    label: "KEV sync completed",
    description: "2 new catalogue entries matched open VPN and Exchange alerts.",
    state: "success" as const,
  },
  {
    time: "09:12 AWST",
    label: "Correlation rule fired",
    description: "Credential stuffing pattern linked to SOC-202606030008.",
    state: "active" as const,
  },
  {
    time: "08:55 AWST",
    label: "Patch validation queued",
    description: "Change advisory CAB-4412 awaiting approval for vCenter cluster.",
    state: "default" as const,
  },
  {
    time: "08:30 AWST",
    label: "SLA warning",
    description: "SOC-202606030001 response window under 4 hours.",
    state: "danger" as const,
  },
  {
    time: "07:45 AWST",
    label: "Threat feed ingest",
    description: "WA CSU bulletin merged into intelligence queue.",
    state: "default" as const,
  },
];

export const CATEGORY_FILTER_CHIPS: { label: string; value: "All" | Category }[] = [
  { label: "All", value: "All" },
  { label: "Vulnerability", value: "Vulnerability" },
  { label: "Threat intel", value: "Threat Intelligence" },
];
