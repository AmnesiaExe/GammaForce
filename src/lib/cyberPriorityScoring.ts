/**
 * CyberPriority WA scoring engine (ported from cyber-priority backend).
 * 25 normalised signals → 5 weighted domains → final priority score (0–100).
 */

export interface VulnerabilitySignals {
  cvss: number;
  exploit_available: number;
  active_exploitation: number;
  attack_complexity: number;
  privileges_required: number;
  user_interaction: number;
  internet_facing: number;
  public_service: number;
  auth_strength: number;
  network_segmentation: number;
  remote_access: number;
  critical_service: number;
  data_sensitivity: number;
  citizen_impact: number;
  dependency_count: number;
  uptime_importance: number;
  asd_match: number;
  vendor_advisory: number;
  source_count: number;
  source_quality: number;
  recency: number;
  patch_available: number;
  workaround_exists: number;
  version_prevalence: number;
  historical_exploitation: number;
}

export interface DomainScores {
  exploitability: number;
  exposure: number;
  asset_impact: number;
  intel_confidence: number;
  remediation: number;
  final_score: number;
}

export type CyberRiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export const DOMAIN_WEIGHTS = {
  exploitability: 0.3,
  exposure: 0.25,
  asset_impact: 0.25,
  intel_confidence: 0.15,
  remediation: 0.05,
} as const;

export const DOMAIN_LABELS: Record<keyof typeof DOMAIN_WEIGHTS, string> = {
  exploitability: "Exploitability",
  exposure: "Exposure",
  asset_impact: "Asset impact",
  intel_confidence: "Intel confidence",
  remediation: "Remediation",
};

export function scoreVulnerability(v: VulnerabilitySignals): DomainScores {
  const exploitability =
    (v.cvss / 10) * 0.35 +
    v.exploit_available * 0.2 +
    v.active_exploitation * 0.25 +
    (1 - v.attack_complexity) * 0.1 +
    (1 - v.privileges_required) * 0.05 +
    (1 - v.user_interaction) * 0.05;

  const exposure =
    v.internet_facing * 0.35 +
    v.public_service * 0.2 +
    (1 - v.auth_strength) * 0.2 +
    (1 - v.network_segmentation) * 0.1 +
    v.remote_access * 0.15;

  const asset_impact =
    v.critical_service * 0.3 +
    v.data_sensitivity * 0.25 +
    v.citizen_impact * 0.25 +
    v.dependency_count * 0.1 +
    v.uptime_importance * 0.1;

  const intel_confidence =
    v.asd_match * 0.3 +
    v.vendor_advisory * 0.1 +
    Math.min(v.source_count / 5, 1) * 0.3 +
    v.source_quality * 0.15 +
    v.recency * 0.15;

  const remediation =
    v.patch_available * 0.4 +
    v.workaround_exists * 0.3 +
    v.version_prevalence * 0.15 +
    v.historical_exploitation * 0.15;

  // Higher remediation = easier to fix → slightly lower urgency (invert for fusion only).
  const remediationUrgency = 1 - remediation;

  const final =
    exploitability * DOMAIN_WEIGHTS.exploitability +
    exposure * DOMAIN_WEIGHTS.exposure +
    asset_impact * DOMAIN_WEIGHTS.asset_impact +
    intel_confidence * DOMAIN_WEIGHTS.intel_confidence +
    remediationUrgency * DOMAIN_WEIGHTS.remediation;

  return {
    exploitability: round1(exploitability * 100),
    exposure: round1(exposure * 100),
    asset_impact: round1(asset_impact * 100),
    intel_confidence: round1(intel_confidence * 100),
    remediation: round1(remediation * 100),
    final_score: round2(final * 100),
  };
}

export function cyberRiskLevel(score: number): CyberRiskLevel {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

export function topDomain(scores: DomainScores): string {
  const domains: Record<string, number> = {
    exploitability: scores.exploitability,
    exposure: scores.exposure,
    "asset impact": scores.asset_impact,
    "intelligence confidence": scores.intel_confidence,
  };
  return Object.entries(domains).sort((a, b) => b[1] - a[1])[0][0];
}

export interface ThreatExplanation {
  summary: string;
  reasons: string[];
  mitigations: string[];
  recommendation: string;
}

export function explainThreat(
  v: VulnerabilitySignals,
  scores: DomainScores,
): ThreatExplanation {
  const reasons: string[] = [];

  if (v.active_exploitation) {
    reasons.push("Active exploitation confirmed in the wild");
  }
  if (v.internet_facing) {
    reasons.push("System is directly internet-facing");
  }
  if (v.asd_match) {
    reasons.push("Validated by Australian Signals Directorate advisory");
  }
  if (v.source_count >= 3) {
    reasons.push(
      `${v.source_count} independent threat intelligence sources confirm this risk`,
    );
  }
  if (v.critical_service) {
    reasons.push("Impacts a critical government service");
  }
  if (v.data_sensitivity >= 0.8) {
    reasons.push(
      "Affects high-sensitivity data (PII / financial / classified)",
    );
  }
  if (v.citizen_impact >= 0.8) {
    reasons.push("Direct citizen-facing impact if exploited");
  }
  if (v.cvss >= 9) {
    reasons.push(`Extremely high CVSS base score (${v.cvss})`);
  }

  const mitigations: string[] = [];
  if (v.patch_available) {
    mitigations.push("Patch is available  immediate deployment recommended");
  }
  if (v.workaround_exists) {
    mitigations.push(
      "Temporary workaround available while patching is staged",
    );
  }

  const priority =
    scores.final_score >= 85
      ? "IMMEDIATE"
      : scores.final_score >= 70
        ? "URGENT"
        : "SCHEDULED";

  const window =
    priority === "IMMEDIATE"
      ? "4 hours"
      : priority === "URGENT"
        ? "24 hours"
        : "72 hours";

  return {
    summary: `This vulnerability scores ${scores.final_score}/100 (${cyberRiskLevel(scores.final_score)}) driven primarily by ${topDomain(scores)}.`,
    reasons,
    mitigations,
    recommendation: `Priority: ${priority}. Patch and reduce exposure within ${window}.`,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
