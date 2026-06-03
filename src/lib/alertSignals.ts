import { getAgency } from "@/data/waAgencies";
import { Category } from "@/lib/scoring";
import { VulnerabilitySignals } from "@/lib/cyberPriorityScoring";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export interface AlertScoringInput {
  category: Category;
  cvss: number;
  exploitability: number;
  assetExposure: number;
  businessImpact: number;
  environment: string;
  kevListed: boolean;
  relatedIncidents: number;
  status: string;
  slaHoursRemaining: number;
  sourceKey: string;
  affectedAgencyIds: string[];
  agencyCount: number;
  sourceCredibility?: number;
  sourceReputationPercent?: number;
}

/** Map dashboard alert fields → 25 CyberPriority signals (0–1 normalised). */
export function alertToSignals(alert: AlertScoringInput): VulnerabilitySignals {
  const cvss = alert.cvss > 0 ? alert.cvss : alert.exploitability * 2;
  const exploitNorm = clamp01(alert.exploitability / 5);
  const exposureNorm = clamp01(alert.assetExposure / 5);
  const impactNorm = clamp01(alert.businessImpact / 5);
  const isVuln = alert.category === "Vulnerability";

  const internetFacing =
    alert.environment.toLowerCase().includes("dmz") ||
    alert.environment.toLowerCase().includes("perimeter") ||
    alert.environment.toLowerCase().includes("hybrid")
      ? 1
      : exposureNorm * 0.7;

  return {
    cvss: Math.min(Math.max(cvss, 0), 10),
    exploit_available: exploitNorm >= 0.8 || alert.kevListed ? 1 : exploitNorm,
    active_exploitation:
      alert.kevListed || alert.relatedIncidents > 0 ? 1 : exploitNorm * 0.5,
    attack_complexity: 1 - exploitNorm * 0.8,
    privileges_required: exploitNorm > 0.7 ? 0.1 : 0.4,
    user_interaction: alert.category === "Threat Intelligence" ? 0.6 : 0.1,
    internet_facing: internetFacing,
    public_service: internetFacing > 0.5 ? 0.9 : exposureNorm,
    auth_strength: alert.environment.toLowerCase().includes("identity")
      ? 0.5
      : 0.65,
    network_segmentation: 1 - exposureNorm * 0.85,
    remote_access:
      alert.environment.toLowerCase().includes("vpn") ||
      alert.environment.toLowerCase().includes("perimeter")
        ? 1
        : exposureNorm * 0.6,
    critical_service: impactNorm >= 0.8 || alert.agencyCount >= 5 ? 1 : impactNorm,
    data_sensitivity: impactNorm,
    citizen_impact: alert.affectedAgencyIds.some((id) => {
      const name = getAgency(id)?.name ?? "";
      return /health|education|police|treasury|premier/i.test(name);
    })
      ? Math.max(impactNorm, 0.85)
      : impactNorm * 0.7,
    dependency_count: clamp01(alert.agencyCount / 12),
    uptime_importance: impactNorm,
    asd_match: alert.sourceKey === "acsc" ? 1 : alert.sourceKey === "cisa-kev" ? 0.5 : 0,
    vendor_advisory: isVuln ? 1 : 0.3,
    source_count: Math.min(
      5,
      Math.round((alert.sourceReputationPercent ?? 50) / 25),
    ),
    source_quality: clamp01(alert.sourceCredibility ?? 0.6),
    recency: alert.slaHoursRemaining <= 12 ? 0.95 : 0.7,
    patch_available: alert.status !== "Blocked" ? 1 : 0.4,
    workaround_exists: alert.status === "Blocked" ? 1 : 0.5,
    version_prevalence: clamp01(alert.agencyCount / 15),
    historical_exploitation: alert.kevListed ? 0.85 : exploitNorm * 0.4,
  };
}
