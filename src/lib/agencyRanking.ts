import {
  AgencyProfile,
  getAgency,
  resolveAgencyId,
  WA_AGENCY_COUNT,
} from "@/data/waAgencies";
import { DomainScores } from "@/lib/cyberPriorityScoring";

export interface AgencyRankEntry {
  agencyId: string;
  agency: AgencyProfile;
  urgencyScore: number;
  urgencyPercent: number;
  rank: number;
  rationale: string;
}

export interface AgencyImpactBreakdown {
  breadth: number;
  weightedCriticality: number;
  maxCriticality: number;
  tier1Share: number;
  composite: number;
  tier1Count: number;
  agencyCount: number;
}

const TIER_MULTIPLIER: Record<1 | 2 | 3, number> = {
  1: 1.15,
  2: 1,
  3: 0.85,
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function resolveAgencyProfiles(ids: string[]): AgencyProfile[] {
  const seen = new Set<string>();
  const profiles: AgencyProfile[] = [];
  for (const raw of ids) {
    const id = resolveAgencyId(raw);
    if (seen.has(id)) continue;
    const agency = getAgency(raw);
    if (agency) {
      seen.add(id);
      profiles.push(agency);
    }
  }
  return profiles;
}

/**
 * Statewide agency exposure when the same vulnerability hits multiple WA agencies.
 * Breadth + weighted criticality + highest-tier agency concentration.
 */
export function calculateAgencyImpact(agencyIds: string[]): AgencyImpactBreakdown {
  const profiles = resolveAgencyProfiles(agencyIds);

  if (profiles.length === 0) {
    return {
      breadth: 0,
      weightedCriticality: 0,
      maxCriticality: 0,
      tier1Share: 0,
      composite: 0,
      tier1Count: 0,
      agencyCount: 0,
    };
  }

  const count = profiles.length;
  const breadth = clamp01(count / 15);
  const weightedCriticality =
    profiles.reduce((sum, a) => sum + a.criticalityWeight, 0) / count;
  const maxCriticality = Math.max(...profiles.map((a) => a.criticalityWeight));
  const tier1Count = profiles.filter((a) => a.tier === 1).length;
  const tier1Share = tier1Count / count;

  const composite = clamp01(
    breadth * 0.28 +
      weightedCriticality * 0.34 +
      maxCriticality * 0.26 +
      tier1Share * 0.12,
  );

  return {
    breadth,
    weightedCriticality,
    maxCriticality,
    tier1Share,
    composite,
    tier1Count,
    agencyCount: count,
  };
}

/**
 * Rank which WA agencies should be treated first when multiple are affected
 * by the same vulnerability (vulnerability score × agency criticality × tier).
 */
export function rankAffectedAgencies(
  agencyIds: string[],
  vulnerabilityScore100: number,
): AgencyRankEntry[] {
  const vulnNorm = vulnerabilityScore100 / 100;
  const profiles = resolveAgencyProfiles(agencyIds);

  const entries = profiles.map((agency) => {
    const urgencyScore =
      vulnNorm *
      agency.criticalityWeight *
      TIER_MULTIPLIER[agency.tier];
    const tierLabel =
      agency.tier === 1
        ? "Tier 1 critical agency"
        : agency.tier === 2
          ? "Tier 2 core agency"
          : "Tier 3 supporting agency";

    return {
      agencyId: agency.id,
      agency,
      urgencyScore,
      urgencyPercent: Math.round(urgencyScore * 100),
      rank: 0,
      rationale: `${tierLabel} · criticality weight ${Math.round(agency.criticalityWeight * 100)}%`,
    };
  });

  entries.sort((a, b) => b.urgencyScore - a.urgencyScore);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  return entries;
}

export function combinePriorityScore(
  domains: DomainScores,
  agencyImpact: AgencyImpactBreakdown,
): number {
  const vulnNorm = domains.final_score / 100;
  return clamp01(vulnNorm * 0.52 + agencyImpact.composite * 0.48);
}

export { WA_AGENCY_COUNT };
