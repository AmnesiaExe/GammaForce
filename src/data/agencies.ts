/** WA Government agencies used for cross-agency exposure weighting. */
export type AgencyTier = 1 | 2 | 3;

export interface AgencyProfile {
  id: string;
  name: string;
  tier: AgencyTier;
  /** Higher = more critical in statewide prioritisation (0-1). */
  criticalityWeight: number;
}

export const WA_AGENCIES: Record<string, AgencyProfile> = {
  "wa-health": { id: "wa-health", name: "WA Health", tier: 1, criticalityWeight: 1 },
  "wa-treasury": { id: "wa-treasury", name: "WA Treasury", tier: 1, criticalityWeight: 1 },
  "wa-police": { id: "wa-police", name: "WA Police Force", tier: 1, criticalityWeight: 1 },
  "wa-education": { id: "wa-education", name: "Department of Education", tier: 1, criticalityWeight: 0.95 },
  "wa-transport": { id: "wa-transport", name: "Main Roads / Transport", tier: 2, criticalityWeight: 0.8 },
  "wa-justice": { id: "wa-justice", name: "Department of Justice", tier: 2, criticalityWeight: 0.8 },
  "wa-dpc": { id: "wa-dpc", name: "Department of Premier and Cabinet", tier: 1, criticalityWeight: 1 },
  "wa-finance": { id: "wa-finance", name: "Department of Finance", tier: 2, criticalityWeight: 0.85 },
  "wa-water": { id: "wa-water", name: "Water Corporation", tier: 2, criticalityWeight: 0.75 },
  "wa-energy": { id: "wa-energy", name: "Energy Policy WA", tier: 2, criticalityWeight: 0.75 },
  "wa-local-gov": { id: "wa-local-gov", name: "Local Government sector", tier: 3, criticalityWeight: 0.55 },
  "wa-courts": { id: "wa-courts", name: "Courts and Tribunal Services", tier: 2, criticalityWeight: 0.7 },
};
