import { getAgency } from "@/data/waAgencies";
import {
  rankAffectedAgencies,
  calculateAgencyImpact,
  combinePriorityScore,
  AgencyRankEntry,
} from "@/lib/agencyRanking";
import { alertToSignals } from "@/lib/alertSignals";
import {
  scoreVulnerability,
  explainThreat,
  cyberRiskLevel,
  DomainScores,
  CyberRiskLevel,
  DOMAIN_LABELS,
  DOMAIN_WEIGHTS,
} from "@/lib/cyberPriorityScoring";
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

/**
 * Main prioritisation model:
 * - CyberPriority 25-signal / 5-domain vulnerability score (52%)
 * - WA multi-agency exposure & criticality weighting (48%)
 */
export const PRIORITY_WEIGHTS = {
  vulnerabilityDomains: 0.52,
  agencyImpact: 0.48,
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

export function calculatePriorityScore(
  alert: Omit<
    AlertInput,
    "scoreBreakdown" | "compositeScore" | "severity" | "agencyCount"
  >,
): ScoreBreakdown {
  const sourceMeta = INTELLIGENCE_SOURCES[alert.sourceKey];
  const sourceCredibilityEarly = sourceCredibilityForCategory(
    alert.sourceKey,
    alert.category,
  );
  const agencyImpact = calculateAgencyImpact(alert.affectedAgencyIds);

  const signals = alertToSignals({
    ...alert,
    agencyCount: agencyImpact.agencyCount,
    sourceCredibility: sourceCredibilityEarly,
    sourceReputationPercent: sourceMeta
      ? alert.category === "Vulnerability"
        ? sourceMeta.reputation.vulnerability
        : sourceMeta.reputation.threatIntelligence
      : 50,
  });

  const domainScores = scoreVulnerability(signals);
  const sourceCredibility = sourceCredibilityEarly;
  const priorityScore = combinePriorityScore(domainScores, agencyImpact);

  const profiles = alert.affectedAgencyIds
    .map((id) => getAgency(id))
    .filter(Boolean);
  const names = profiles.map((a) => a!.name);
  const agencyRanking = rankAffectedAgencies(
    alert.affectedAgencyIds,
    domainScores.final_score,
  );

  const technical = clamp01(domainScores.final_score / 100);
  const contextSignals = clamp01(
    (alert.kevListed ? 0.35 : 0) +
      (alert.exploitability >= 4 ? 0.2 : 0) +
      (alert.slaHoursRemaining <= 4 && alert.slaHoursRemaining > 0 ? 0.15 : 0) +
      (alert.slaHoursRemaining <= 0 ? 0.2 : 0),
  );

  return {
    technical,
    sourceCredibility,
    agencyExposure: agencyImpact.composite,
    contextSignals,
    priorityScore,
    agencyCount: agencyImpact.agencyCount,
    agencyCriticality: agencyImpact.weightedCriticality,
    sourceReputationPercent: Math.round(
      sourceMeta
        ? alert.category === "Vulnerability"
          ? sourceMeta.reputation.vulnerability
          : sourceMeta.reputation.threatIntelligence
        : 50,
    ),
    sourceLabel: sourceMeta?.label ?? alert.source,
    affectedAgencyNames: names,
    domainScores,
    cyberRiskLevel: cyberRiskLevel(domainScores.final_score),
    agencyImpact,
    agencyRanking,
    explanation: explainThreat(signals, domainScores),
  };
}

export function buildPrioritisedAlert(
  partial: Omit<
    AlertInput,
    "compositeScore" | "severity" | "scoreBreakdown" | "agencyCount"
  >,
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

export function formatScore100(score: number) {
  return `${Math.round(score)}`;
}

export function weightLabel(key: keyof typeof PRIORITY_WEIGHTS) {
  return `${Math.round(PRIORITY_WEIGHTS[key] * 100)}%`;
}

export function sortAlertsByPriority(items: AlertItem[]): AlertItem[] {
  return [...items].sort((a, b) => b.compositeScore - a.compositeScore);
}

export {
  DOMAIN_LABELS,
  DOMAIN_WEIGHTS,
  type DomainScores,
  type CyberRiskLevel,
  type AgencyRankEntry,
};
