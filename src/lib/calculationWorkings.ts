import { INTELLIGENCE_SOURCES, sourceCredibilityForCategory } from "@/data/intelligenceSources";
import { getAgency } from "@/data/waAgencies";
import {
  AgencyImpactBreakdown,
  calculateAgencyImpact,
  combinePriorityScore,
  rankAffectedAgencies,
} from "@/lib/agencyRanking";
import { alertToSignals } from "@/lib/alertSignals";
import {
  DOMAIN_LABELS,
  DOMAIN_WEIGHTS,
  VulnerabilitySignals,
  scoreVulnerability,
} from "@/lib/cyberPriorityScoring";
import { PRIORITY_WEIGHTS } from "@/lib/prioritisation";
import { AlertItem, severityFromScore } from "@/lib/scoring";

const TIER_MULT: Record<1 | 2 | 3, number> = { 1: 1.15, 2: 1, 3: 0.85 };

const round4 = (n: number) => Math.round(n * 10000) / 10000;
/** Rounding tolerance for 0–100 threat score (round2 on engine vs manual tensor sum). */
const SCORE_EPS = 0.25;
const EPS = 0.0002;

export interface WorkingsLine {
  label: string;
  expression: string;
  result: string;
  ok?: boolean;
}

export interface WorkingsSection {
  title: string;
  subtitle?: string;
  lines: WorkingsLine[];
  total?: string;
}

export interface AdvisoryCalculationWorkings {
  advisoryId: string;
  pipeline: string[];
  sections: WorkingsSection[];
  allChecksPass: boolean;
}

function signalLines(signals: VulnerabilitySignals): WorkingsLine[] {
  const entries: { key: keyof VulnerabilitySignals; label: string }[] = [
    { key: "cvss", label: "cvss" },
    { key: "exploit_available", label: "exploit_available" },
    { key: "active_exploitation", label: "active_exploitation" },
    { key: "attack_complexity", label: "attack_complexity" },
    { key: "privileges_required", label: "privileges_required" },
    { key: "user_interaction", label: "user_interaction" },
    { key: "internet_facing", label: "internet_facing" },
    { key: "public_service", label: "public_service" },
    { key: "auth_strength", label: "auth_strength" },
    { key: "network_segmentation", label: "network_segmentation" },
    { key: "remote_access", label: "remote_access" },
    { key: "critical_service", label: "critical_service" },
    { key: "data_sensitivity", label: "data_sensitivity" },
    { key: "citizen_impact", label: "citizen_impact" },
    { key: "dependency_count", label: "dependency_count" },
    { key: "uptime_importance", label: "uptime_importance" },
    { key: "asd_match", label: "asd_match" },
    { key: "vendor_advisory", label: "vendor_advisory" },
    { key: "source_count", label: "source_count" },
    { key: "source_quality", label: "source_quality" },
    { key: "recency", label: "recency" },
    { key: "patch_available", label: "patch_available" },
    { key: "workaround_exists", label: "workaround_exists" },
    { key: "version_prevalence", label: "version_prevalence" },
    { key: "historical_exploitation", label: "historical_exploitation" },
  ];
  return entries.map(({ key, label }) => {
    const val = signals[key];
    return {
      label,
      expression: "normalised 0–1",
      result: typeof val === "number" ? (key === "cvss" ? val.toFixed(1) : val.toFixed(4)) : String(val),
    };
  });
}

function checkLine(
  name: string,
  expected: number,
  actual: number,
  tolerance = EPS,
): WorkingsLine {
  const pass = Math.abs(expected - actual) <= tolerance;
  return {
    label: name,
    expression: `recomputed ${round4(expected)}`,
    result: pass ? `✓ matches ${round4(actual)}` : `✗ engine ${round4(actual)}`,
    ok: pass,
  };
}

export function buildAdvisoryCalculationWorkings(alert: AlertItem): AdvisoryCalculationWorkings {
  const b = alert.scoreBreakdown;
  const sourceMeta = INTELLIGENCE_SOURCES[alert.sourceKey];
  const sourceCred = sourceCredibilityForCategory(alert.sourceKey, alert.category);
  const sourceRep = sourceMeta
    ? alert.category === "Vulnerability"
      ? sourceMeta.reputation.vulnerability
      : sourceMeta.reputation.threatIntelligence
    : 50;

  const impactForSignals = calculateAgencyImpact(alert.affectedAgencyIds);

  const signals = alertToSignals({
    category: alert.category,
    cvss: alert.cvss,
    exploitability: alert.exploitability,
    assetExposure: alert.assetExposure,
    businessImpact: alert.businessImpact,
    environment: alert.environment,
    kevListed: alert.kevListed,
    relatedIncidents: alert.relatedIncidents,
    status: alert.status,
    slaHoursRemaining: alert.slaHoursRemaining,
    sourceKey: alert.sourceKey,
    affectedAgencyIds: alert.affectedAgencyIds,
    agencyCount: impactForSignals.agencyCount,
    sourceCredibility: sourceCred,
    sourceReputationPercent: sourceRep,
  });

  const v = signals;
  const exploitRaw =
    (v.cvss / 10) * 0.35 +
    v.exploit_available * 0.2 +
    v.active_exploitation * 0.25 +
    (1 - v.attack_complexity) * 0.1 +
    (1 - v.privileges_required) * 0.05 +
    (1 - v.user_interaction) * 0.05;

  const exposureRaw =
    v.internet_facing * 0.35 +
    v.public_service * 0.2 +
    (1 - v.auth_strength) * 0.2 +
    (1 - v.network_segmentation) * 0.1 +
    v.remote_access * 0.15;

  const assetRaw =
    v.critical_service * 0.3 +
    v.data_sensitivity * 0.25 +
    v.citizen_impact * 0.25 +
    v.dependency_count * 0.1 +
    v.uptime_importance * 0.1;

  const sourceCountNorm = Math.min(v.source_count / 5, 1);
  const intelRaw =
    v.asd_match * 0.3 +
    v.vendor_advisory * 0.1 +
    sourceCountNorm * 0.3 +
    v.source_quality * 0.15 +
    v.recency * 0.15;

  const remediationRaw =
    v.patch_available * 0.4 +
    v.workaround_exists * 0.3 +
    v.version_prevalence * 0.15 +
    v.historical_exploitation * 0.15;

  const domainRaws = {
    exploitability: exploitRaw,
    exposure: exposureRaw,
    asset_impact: assetRaw,
    intel_confidence: intelRaw,
    remediation: remediationRaw,
  };

  const domains = scoreVulnerability(signals);
  const remediationUrgency = 1 - remediationRaw;
  const vulnFinalRaw =
    exploitRaw * DOMAIN_WEIGHTS.exploitability +
    exposureRaw * DOMAIN_WEIGHTS.exposure +
    assetRaw * DOMAIN_WEIGHTS.asset_impact +
    intelRaw * DOMAIN_WEIGHTS.intel_confidence +
    remediationUrgency * DOMAIN_WEIGHTS.remediation;

  const impact = calculateAgencyImpact(alert.affectedAgencyIds);
  const impactRecomputed = Math.min(
    1,
    Math.max(
      0,
      impact.breadth * 0.28 +
        impact.weightedCriticality * 0.34 +
        impact.maxCriticality * 0.26 +
        impact.tier1Share * 0.12,
    ),
  );

  const priorityFromEngine = combinePriorityScore(domains, impact);
  const vulnNorm = domains.final_score / 100;
  const ranked = rankAffectedAgencies(alert.affectedAgencyIds, domains.final_score);

  const ctxParts = [
    alert.kevListed ? { label: "KEV listed", val: 0.35 } : null,
    alert.exploitability >= 4 ? { label: "exploitability ≥ 4", val: 0.2 } : null,
    alert.slaHoursRemaining <= 4 && alert.slaHoursRemaining > 0
      ? { label: "SLA under 4h", val: 0.15 }
      : null,
    alert.slaHoursRemaining <= 0 ? { label: "SLA breached", val: 0.2 } : null,
  ].filter(Boolean) as { label: string; val: number }[];

  const ctxSum = ctxParts.reduce((s, p) => s + p.val, 0);
  const ctxClamped = Math.min(1, ctxSum);

  const agencyLines: WorkingsLine[] = ranked.map((entry) => ({
    label: `#${entry.rank} ${entry.agency.name}`,
    expression: `(${domains.final_score}/100) × ${round4(entry.agency.criticalityWeight)} × tier${entry.agency.tier}(${TIER_MULT[entry.agency.tier]})`,
    result: `urgency ${entry.urgencyPercent} (raw ${round4(entry.urgencyScore)})`,
    ok:
      Math.abs(
        entry.urgencyScore -
          vulnNorm * entry.agency.criticalityWeight * TIER_MULT[entry.agency.tier],
      ) <= EPS,
  }));

  const threatFromTensor = Math.round(vulnFinalRaw * 10000) / 100;

  const verifyLines: WorkingsLine[] = [
    checkLine("threat final_score", domains.final_score, b.domainScores.final_score, SCORE_EPS),
    checkLine("agencyImpact.composite", impactRecomputed, b.agencyImpact.composite),
    checkLine("combinePriorityScore()", priorityFromEngine, b.priorityScore, SCORE_EPS),
    checkLine("alert.compositeScore", priorityFromEngine, alert.compositeScore, SCORE_EPS),
    checkLine(
      "threat fusion (tensor vs engine)",
      threatFromTensor,
      domains.final_score,
      SCORE_EPS,
    ),
  ];

  if (ranked[0] && b.agencyRanking[0]) {
    verifyLines.push(
      checkLine("top agency rank #1", ranked[0].urgencyScore, b.agencyRanking[0].urgencyScore),
    );
  }

  const allChecksPass = verifyLines.every((l) => l.ok !== false);

  const sections: WorkingsSection[] = [
    {
      title: "Stage 1 · Signal ingestion",
      subtitle: "25 normalised intelligence dimensions (0–1) from advisory + WASOC sources",
      lines: signalLines(signals),
    },
    {
      title: "Stage 2 · Exploitability tensor",
      subtitle: "30% weight in threat fusion",
      lines: domainTermLines(v, "exploitability", exploitRaw),
      total: `domain = ${round4(exploitRaw)} → display ${domains.exploitability}%`,
    },
    {
      title: "Stage 2 · Exposure tensor",
      subtitle: "25% weight",
      lines: [
        { label: "internet_facing × 0.35", expression: `${v.internet_facing}×0.35`, result: String(round4(v.internet_facing * 0.35)) },
        { label: "public_service × 0.20", expression: `${v.public_service}×0.20`, result: String(round4(v.public_service * 0.2)) },
        { label: "(1−auth_strength) × 0.20", expression: `(1−${v.auth_strength})×0.20`, result: String(round4((1 - v.auth_strength) * 0.2)) },
        { label: "(1−network_segmentation) × 0.10", expression: `(1−${v.network_segmentation})×0.10`, result: String(round4((1 - v.network_segmentation) * 0.1)) },
        { label: "remote_access × 0.15", expression: `${v.remote_access}×0.15`, result: String(round4(v.remote_access * 0.15)) },
      ],
      total: `domain = ${round4(exposureRaw)} → ${domains.exposure}%`,
    },
    {
      title: "Stage 2 · Asset impact tensor",
      subtitle: "25% weight",
      lines: domainTermLines(v, "asset_impact", assetRaw),
      total: `domain = ${round4(assetRaw)} → ${domains.asset_impact}%`,
    },
    {
      title: "Stage 2 · Intel confidence tensor",
      subtitle: "15% weight",
      lines: [
        { label: "asd_match × 0.30", expression: `${v.asd_match}×0.30`, result: String(round4(v.asd_match * 0.3)) },
        { label: "vendor_advisory × 0.10", expression: `${v.vendor_advisory}×0.10`, result: String(round4(v.vendor_advisory * 0.1)) },
        { label: "min(source_count/5,1) × 0.30", expression: `min(${v.source_count}/5,1)×0.30`, result: String(round4(sourceCountNorm * 0.3)) },
        { label: "source_quality × 0.15", expression: `${v.source_quality}×0.15`, result: String(round4(v.source_quality * 0.15)) },
        { label: "recency × 0.15", expression: `${v.recency}×0.15`, result: String(round4(v.recency * 0.15)) },
      ],
      total: `domain = ${round4(intelRaw)} → ${domains.intel_confidence}%`,
    },
    {
      title: "Stage 2 · Remediation tensor",
      subtitle: "5% weight (higher = easier to fix, lowers urgency slightly)",
      lines: domainTermLines(v, "remediation", remediationRaw),
      total: `domain = ${round4(remediationRaw)} → ${domains.remediation}%`,
    },
    {
      title: "Stage 3 · Threat score fusion",
      subtitle: "Weighted sum of five domain tensors → 0–100 threat score",
      lines: (Object.keys(DOMAIN_LABELS) as (keyof typeof DOMAIN_LABELS)[]).map((key) => {
        const raw = key === "remediation" ? remediationUrgency : domainRaws[key];
        const note = key === "remediation" ? " (1 − remediation readiness)" : "";
        return {
          label: DOMAIN_LABELS[key] + note,
          expression: `${round4(raw)} × ${DOMAIN_WEIGHTS[key]}`,
          result: round4(raw * DOMAIN_WEIGHTS[key]).toString(),
        };
      }),
      total: `threatScore = ${round4(vulnFinalRaw * 100)}/100 stored as ${domains.final_score} (${b.cyberRiskLevel})`,
    },
    {
      title: "Stage 4 · WA agency exposure field",
      subtitle: "Multi-agency breadth + criticality + tier-1 concentration",
      lines: agencyImpactLines(impact),
      total: `agencyImpact = clamp01(sum) = ${round4(impact.composite)} → ${Math.round(impact.composite * 100)}%`,
    },
    {
      title: "Stage 5 · Statewide prioritisation fusion",
      subtitle: `Innovative dual-layer merge: threat ${Math.round(PRIORITY_WEIGHTS.vulnerabilityDomains * 100)}% + agency ${Math.round(PRIORITY_WEIGHTS.agencyImpact * 100)}%`,
      lines: [
        {
          label: "threat layer",
          expression: `(${domains.final_score}/100) × ${PRIORITY_WEIGHTS.vulnerabilityDomains}`,
          result: round4(vulnNorm * PRIORITY_WEIGHTS.vulnerabilityDomains).toString(),
        },
        {
          label: "agency layer",
          expression: `${round4(impact.composite)} × ${PRIORITY_WEIGHTS.agencyImpact}`,
          result: round4(impact.composite * PRIORITY_WEIGHTS.agencyImpact).toString(),
        },
      ],
      total: `prioritisation = clamp01(${round4(priorityFromEngine)}) → ${Math.round(alert.compositeScore * 100)} · ${severityFromScore(priorityFromEngine)} (stored ${alert.severity})`,
    },
    {
      title: "Stage 6 · Per-agency act-first ordering",
      subtitle: "threatScore × agency criticality × tier multiplier",
      lines: agencyLines.length ? agencyLines : [{ label: "single agency", expression: "", result: "no cross-agency sort" }],
      total: "Same formula as rankAffectedAgencies() in engine",
    },
    {
      title: "Context layer (AI triage hints)",
      subtitle: "Stored for analyst urgency  not added into prioritisation score",
      lines: ctxParts.length
        ? ctxParts.map((p) => ({ label: p.label, expression: "context boost", result: `+${p.val}` }))
        : [{ label: "none", expression: "", result: "0" }],
      total: `contextSignals = ${round4(ctxClamped)} · source credibility ${round4(b.sourceCredibility)}`,
    },
    {
      title: "Integrity check · recomputed vs engine",
      subtitle: allChecksPass ? "All formulas match production code" : "Mismatch  inspect rounding",
      lines: verifyLines,
    },
  ];

  return {
    advisoryId: alert.id,
    pipeline: [
      "25 signals",
      "5 domains",
      "Threat score",
      "Agency field",
      "52/48 fusion",
      "Rank agencies",
    ],
    sections,
    allChecksPass,
  };
}

function domainTermLines(
  v: VulnerabilitySignals,
  domain: "exploitability" | "asset_impact" | "remediation",
  _raw: number,
): WorkingsLine[] {
  if (domain === "exploitability") {
    return [
      { label: "cvss/10 × 0.35", expression: `(${v.cvss}/10)×0.35`, result: String(round4((v.cvss / 10) * 0.35)) },
      { label: "exploit_available × 0.20", expression: `${v.exploit_available}×0.20`, result: String(round4(v.exploit_available * 0.2)) },
      { label: "active_exploitation × 0.25", expression: `${v.active_exploitation}×0.25`, result: String(round4(v.active_exploitation * 0.25)) },
      { label: "(1−attack_complexity) × 0.10", expression: `(1−${v.attack_complexity})×0.10`, result: String(round4((1 - v.attack_complexity) * 0.1)) },
      { label: "(1−privileges_required) × 0.05", expression: `(1−${v.privileges_required})×0.05`, result: String(round4((1 - v.privileges_required) * 0.05)) },
      { label: "(1−user_interaction) × 0.05", expression: `(1−${v.user_interaction})×0.05`, result: String(round4((1 - v.user_interaction) * 0.05)) },
    ];
  }
  if (domain === "asset_impact") {
    return [
      { label: "critical_service × 0.30", expression: `${v.critical_service}×0.30`, result: String(round4(v.critical_service * 0.3)) },
      { label: "data_sensitivity × 0.25", expression: `${v.data_sensitivity}×0.25`, result: String(round4(v.data_sensitivity * 0.25)) },
      { label: "citizen_impact × 0.25", expression: `${v.citizen_impact}×0.25`, result: String(round4(v.citizen_impact * 0.25)) },
      { label: "dependency_count × 0.10", expression: `${v.dependency_count}×0.10`, result: String(round4(v.dependency_count * 0.1)) },
      { label: "uptime_importance × 0.10", expression: `${v.uptime_importance}×0.10`, result: String(round4(v.uptime_importance * 0.1)) },
    ];
  }
  return [
    { label: "patch_available × 0.40", expression: `${v.patch_available}×0.40`, result: String(round4(v.patch_available * 0.4)) },
    { label: "workaround_exists × 0.30", expression: `${v.workaround_exists}×0.30`, result: String(round4(v.workaround_exists * 0.3)) },
    { label: "version_prevalence × 0.15", expression: `${v.version_prevalence}×0.15`, result: String(round4(v.version_prevalence * 0.15)) },
    { label: "historical_exploitation × 0.15", expression: `${v.historical_exploitation}×0.15`, result: String(round4(v.historical_exploitation * 0.15)) },
  ];
}

function agencyImpactLines(impact: AgencyImpactBreakdown): WorkingsLine[] {
  const sum =
    impact.breadth * 0.28 +
    impact.weightedCriticality * 0.34 +
    impact.maxCriticality * 0.26 +
    impact.tier1Share * 0.12;
  return [
    {
      label: "breadth",
      expression: `min(1, ${impact.agencyCount}/15)`,
      result: `${round4(impact.breadth)} × 0.28 = ${round4(impact.breadth * 0.28)}`,
    },
    {
      label: "mean criticality",
      expression: "avg(criticalityWeight)",
      result: `${round4(impact.weightedCriticality)} × 0.34 = ${round4(impact.weightedCriticality * 0.34)}`,
    },
    {
      label: "peak criticality",
      expression: "max(criticalityWeight)",
      result: `${round4(impact.maxCriticality)} × 0.26 = ${round4(impact.maxCriticality * 0.26)}`,
    },
    {
      label: "tier-1 share",
      expression: `${impact.tier1Count}/${impact.agencyCount}`,
      result: `${round4(impact.tier1Share)} × 0.12 = ${round4(impact.tier1Share * 0.12)}`,
    },
    {
      label: "sum → clamp01",
      expression: "0.28+0.34+0.26+0.12 weights",
      result: round4(sum).toString(),
    },
  ];
}
