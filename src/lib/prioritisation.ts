import { WA_AGENCIES, AgencyProfile } from "@/data/agencies";
import {
  INTELLIGENCE_SOURCES,
  sourceCredibilityForCategory,
} from "@/data/intelligenceSources";
import {
  AlertItem,
  Category,
  ScoreBreakdown,
  severityFromScore,
} from "@/lib/scoring";

/** Tunable weights: technical + trusted intelligence + agency spread + context. */
export const PRIORITY_WEIGHTS = {
  technical: 0.38,
  sourceCredibility: 0.14,
  agencyExposure: 0.32,
  contextSignals: 0.16,
} as const;

export interface AlertInput extends Omit<
  AlertItem,
  "compositeScore" | "severity" | "scoreBreakdown" | "agencyCount"
> {
  sourceKey: string;
  affectedAgencyIds: string[];
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function technicalScore(alert: Pick<
  AlertItem,
  "cvss" | "exploitability" | "assetExposure" | "businessImpact"
>): number {
  const cvssNorm = Math.min(Math.max(alert.cvss, 0), 10) / 10;
  const exploitNorm = Math.min(Math.max(alert.exploitability, 1), 5) / 5;
  const exposureNorm = Math.min(Math.max(alert.assetExposure, 1), 5) / 5;
  const impactNorm = Math.min(Math.max(alert.businessImpact, 1), 5) / 5;

  return clamp01(
    cvssNorm * 0.35 +
      exploitNorm * 0.25 +
      exposureNorm * 0.2 +
      impactNorm * 0.2,
  );
}

/** More agencies on same issue = higher statewide priority (caps at 10 for model). */
export function agencyExposureScore(agencyIds: string[]): {
  exposure: number;
  criticality: number;
  names: string[];
} {
  const profiles = agencyIds
    .map((id) => WA_AGENCIES[id])
    .filter((a): a is AgencyProfile => Boolean(a));

  if (profiles.length === 0) {
    return { exposure: 0, criticality: 0, names: [] };
  }

  const count = profiles.length;
  const breadth = clamp01(count / 10);
  const criticality =
    profiles.reduce((sum, a) => sum + a.criticalityWeight, 0) / count;

  return {
    exposure: clamp01(breadth * 0.55 + criticality * 0.45),
    criticality,
    names: profiles.map((a) => a.name),
  };
}

function contextScore(alert: Pick<
  AlertItem,
  "kevListed" | "exploitability" | "relatedIncidents" | "slaHoursRemaining" | "iocCount"
>): number {
  let score = 0;
  if (alert.kevListed) score += 0.35;
  if (alert.exploitability >= 4) score += 0.25;
  if (alert.relatedIncidents > 0) score += 0.15;
  if (alert.slaHoursRemaining <= 4 && alert.slaHoursRemaining > 0) score += 0.15;
  if (alert.slaHoursRemaining <= 0) score += 0.25;
  if (alert.iocCount >= 10) score += 0.1;
  return clamp01(score);
}

export function calculatePriorityScore(
  alert: Omit<AlertInput, "scoreBreakdown" | "compositeScore" | "severity" | "agencyCount">,
): ScoreBreakdown {
  const technical = technicalScore(alert);
  const sourceCredibility = sourceCredibilityForCategory(
    alert.sourceKey,
    alert.category,
  );
  const sourceMeta = INTELLIGENCE_SOURCES[alert.sourceKey];
  const { exposure: agencyExposure, criticality, names } = agencyExposureScore(
    alert.affectedAgencyIds,
  );
  const contextSignals = contextScore(alert);

  const priorityScore = clamp01(
    technical * PRIORITY_WEIGHTS.technical +
      sourceCredibility * PRIORITY_WEIGHTS.sourceCredibility +
      agencyExposure * PRIORITY_WEIGHTS.agencyExposure +
      contextSignals * PRIORITY_WEIGHTS.contextSignals,
  );

  return {
    technical,
    sourceCredibility,
    agencyExposure,
    contextSignals,
    priorityScore,
    agencyCount: alert.affectedAgencyIds.length,
    agencyCriticality: criticality,
    sourceReputationPercent: Math.round(
      (sourceMeta
        ? alert.category === "Vulnerability"
          ? sourceMeta.reputation.vulnerability
          : sourceMeta.reputation.threatIntelligence
        : 50),
    ),
    sourceLabel: sourceMeta?.label ?? alert.source,
    affectedAgencyNames: names,
  };
}

export function buildPrioritisedAlert(
  partial: Omit<AlertInput, "compositeScore" | "severity" | "scoreBreakdown" | "agencyCount">,
): AlertItem {
  const scoreBreakdown = calculatePriorityScore(partial);

  return {
    ...partial,
    compositeScore: scoreBreakdown.priorityScore,
    severity: severityFromScore(scoreBreakdown.priorityScore),
    scoreBreakdown,
    agencyCount: scoreBreakdown.agencyCount,
  };
}

export function formatPercent(score: number) {
  return `${Math.round(score * 100)}%`;
}

export function weightLabel(key: keyof typeof PRIORITY_WEIGHTS) {
  return `${Math.round(PRIORITY_WEIGHTS[key] * 100)}%`;
}
