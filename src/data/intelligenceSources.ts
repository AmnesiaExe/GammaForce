import { Category } from "@/lib/scoring";

/** Source reputation for a given issue type (0-100). Higher = more trusted for prioritisation. */
export interface IntelligenceSource {
  key: string;
  label: string;
  reputation: {
    vulnerability: number;
    threatIntelligence: number;
  };
  notes: string;
}

export const INTELLIGENCE_SOURCES: Record<string, IntelligenceSource> = {
  "cisa-kev": {
    key: "cisa-kev",
    label: "CISA Known Exploited Vulnerabilities",
    reputation: { vulnerability: 98, threatIntelligence: 70 },
    notes: "Mandatory federal catalogue; highest weight for confirmed exploitation.",
  },
  acsc: {
    key: "acsc",
    label: "ACSC / ASD Advisory",
    reputation: { vulnerability: 94, threatIntelligence: 90 },
    notes: "National cyber authority; strong sector alignment for Australian government.",
  },
  "wa-csu": {
    key: "wa-csu",
    label: "WA Cyber Security Unit",
    reputation: { vulnerability: 88, threatIntelligence: 92 },
    notes: "State context and agency-specific intelligence.",
  },
  auscert: {
    key: "auscert",
    label: "AusCERT Member Advisory",
    reputation: { vulnerability: 82, threatIntelligence: 85 },
    notes: "Trusted coordination body; validate against state telemetry.",
  },
  "vendor-psirt": {
    key: "vendor-psirt",
    label: "Vendor PSIRT / Advisory",
    reputation: { vulnerability: 80, threatIntelligence: 55 },
    notes: "Authoritative for product defects; confirm deployment in WA estate.",
  },
  nvd: {
    key: "nvd",
    label: "NVD / CVE Programme",
    reputation: { vulnerability: 75, threatIntelligence: 40 },
    notes: "Baseline severity; requires local context and asset mapping.",
  },
  siem: {
    key: "siem",
    label: "Internal SIEM / Correlation",
    reputation: { vulnerability: 68, threatIntelligence: 78 },
    notes: "Behavioural detection; tune for false positives.",
  },
  "open-feed": {
    key: "open-feed",
    label: "Open-source Threat Feed",
    reputation: { vulnerability: 52, threatIntelligence: 58 },
    notes: "Useful early signal; corroborate before statewide escalation.",
  },
  chrome: {
    key: "chrome",
    label: "Chrome Stable Release Notes",
    reputation: { vulnerability: 85, threatIntelligence: 45 },
    notes: "Vendor channel for endpoint exposure at scale.",
  },
  openssl: {
    key: "openssl",
    label: "OpenSSL Security Advisory",
    reputation: { vulnerability: 83, threatIntelligence: 40 },
    notes: "Library-level; scope depends on dependency mapping.",
  },
  fortinet: {
    key: "fortinet",
    label: "Fortinet PSIRT",
    reputation: { vulnerability: 81, threatIntelligence: 50 },
    notes: "Perimeter and branch device context.",
  },
};

export function sourceCredibilityForCategory(
  sourceKey: string,
  category: Category,
): number {
  const source = INTELLIGENCE_SOURCES[sourceKey];
  if (!source) return 50;
  const raw =
    category === "Vulnerability"
      ? source.reputation.vulnerability
      : source.reputation.threatIntelligence;
  return raw / 100;
}
