import { ALERTS } from "@/data/alerts";
import { WA_AGENCY_LIST, WA_AGENCY_COUNT } from "@/data/waAgencies";
import { buildPrioritisedAlert } from "@/lib/prioritisation";
import { formatSocAdvisoryId } from "@/lib/socAdvisoryId";
import { AlertItem, AlertStatus, Category, Severity } from "@/lib/scoring";

/** Deterministic PRNG so the 1000 records are identical on server and client. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0x9e3779b9);
const rand = () => rng();
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => a + rand() * (b - a);
const round1 = (n: number) => Math.round(n * 10) / 10;

const VENDORS = [
  "Microsoft", "Cisco", "Fortinet", "Palo Alto", "Citrix", "VMware", "Ivanti",
  "Apache", "OpenSSL", "Atlassian", "Oracle", "SAP", "Adobe", "Google Chrome",
  "Mozilla", "F5", "Juniper", "Zoho", "Progress MOVEit", "GitLab", "Drupal",
  "Linux Kernel", "PostgreSQL", "Elastic", "Jenkins", "Veeam",
];
const VULN_CLASSES = [
  "remote code execution", "SQL injection", "authentication bypass",
  "privilege escalation", "server-side request forgery", "deserialisation flaw",
  "path traversal", "use-after-free", "heap overflow", "command injection",
  "cross-site scripting", "XML external entity", "information disclosure",
  "out-of-bounds write",
];
const PRODUCTS = [
  "VPN gateway", "email server", "web application firewall", "identity provider",
  "file transfer appliance", "hypervisor", "endpoint agent", "API gateway",
  "load balancer", "database cluster", "CMS platform", "remote desktop gateway",
  "backup appliance", "directory service",
];
const TI_ACTORS = [
  "State-sponsored actor", "Ransomware affiliate", "Access broker",
  "Hacktivist collective", "Financially motivated group", "Supply-chain actor",
];
const TI_PATTERNS = [
  "credential stuffing campaign", "phishing wave targeting government mailboxes",
  "ransomware pre-cursor activity", "edge device exploitation",
  "living-off-the-land activity", "data exfiltration attempt",
  "malicious OAuth consent grants", "web shell deployment",
];
const ENVIRONMENTS = [
  "Production DMZ", "Perimeter network", "Hybrid cloud", "Identity platform",
  "Branch offices", "VPN concentrators", "Internal application tier",
  "Data centre core", "Citizen-facing portal", "CI/CD",
];
const SOURCES_VULN = ["acsc", "cisa-kev", "wa-csu", "vendor-psirt", "nvd", "auscert", "fortinet", "chrome", "openssl"];
const SOURCES_TI = ["wa-csu", "acsc", "siem", "auscert", "open-feed"];
const STATUSES: AlertStatus[] = ["New", "Triaging", "In progress", "Blocked", "Resolved"];
const ANALYSTS = ["L. Nguyen", "S. Patel", "R. Kim", "J. Walsh", "M. Okafor", "T. Hughes", "Unassigned"];

const SOURCE_LABELS: Record<string, string> = {
  acsc: "ACSC Advisory", "cisa-kev": "CISA KEV Catalogue", "wa-csu": "WA Cyber Security Unit",
  "vendor-psirt": "Vendor PSIRT", nvd: "NVD / CVE", auscert: "AusCERT", fortinet: "Fortinet PSIRT",
  chrome: "Chrome Release", openssl: "OpenSSL Advisory", siem: "WASOC Sentinel", "open-feed": "Open-source feed",
};

const AGENCY_IDS = WA_AGENCY_LIST.map((a) => a.id);
// Bias selection toward higher-criticality agencies so the top of the queue is realistic.
const WEIGHTED_IDS: string[] = WA_AGENCY_LIST.flatMap((a) =>
  Array.from({ length: a.tier === 1 ? 4 : a.tier === 2 ? 2 : 1 }, () => a.id),
);

function pickAgencies(): string[] {
  const count = 2 + Math.floor(rand() * 7); // 2-8
  const set = new Set<string>();
  let guard = 0;
  while (set.size < count && guard < 50) {
    set.add(rand() < 0.7 ? pick(WEIGHTED_IDS) : pick(AGENCY_IDS));
    guard += 1;
  }
  return [...set];
}

function dayOffset(daysAgo: number) {
  const base = new Date("2026-06-03T09:00:00+08:00").getTime();
  const d = new Date(base - daysAgo * 86400000);
  return {
    iso: d.toISOString(),
    display: d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) + ", AWST",
  };
}

function generateOne(index: number): AlertItem {
  const isVuln = rand() < 0.68;
  const category: Category = isVuln ? "Vulnerability" : "Threat Intelligence";
  const hot = rand() < 0.16;

  const sourceKey = isVuln ? pick(SOURCES_VULN) : pick(SOURCES_TI);
  const daysAgo = Math.floor(between(0, 40));
  const { iso, display } = dayOffset(daysAgo);
  const title = isVuln
    ? `${pick(VENDORS)} ${pick(PRODUCTS)} ${pick(VULN_CLASSES)}`
    : `${pick(TI_ACTORS)} ${pick(TI_PATTERNS)}`;

  const status = pick(STATUSES);
  const slaHoursRemaining = hot ? round1(between(-6, 8)) : round1(between(4, 120));

  return buildPrioritisedAlert({
    id: formatSocAdvisoryId(1000 + index),
    title,
    category,
    source: SOURCE_LABELS[sourceKey] ?? sourceKey,
    sourceKey,
    affectedAgencyIds: pickAgencies(),
    cvss: isVuln ? round1(hot ? between(8.2, 10) : between(3.5, 9.2)) : 0,
    exploitability: Math.round(between(hot ? 4 : 1, 5)),
    assetExposure: Math.round(between(1, 5)),
    businessImpact: Math.round(between(hot ? 3 : 1, 5)),
    status,
    slaHoursRemaining,
    kevListed: isVuln && (hot ? rand() < 0.8 : rand() < 0.2),
    assignee: pick(ANALYSTS),
    environment: pick(ENVIRONMENTS),
    iocCount: Math.floor(between(0, hot ? 20 : 8)),
    relatedIncidents: hot ? Math.floor(between(0, 3)) : 0,
    receivedAt: iso,
    receivedDisplay: display,
    affectedAssets: `${Math.floor(between(2, 240))} assets across affected agencies`,
    recommendedAction: isVuln
      ? "Patch or isolate affected systems within the SLA window; reduce internet exposure and force re-authentication."
      : "Hunt for indicators across affected agencies, harden the targeted path, and raise advisory to agency contacts.",
    analystNotes: hot
      ? "Elevated signal: corroborated by multiple sources and matched against WASOC telemetry."
      : "Queued for triage; awaiting asset confirmation from affected agencies.",
  });
}

export const GENERATED_ALERTS: AlertItem[] = Array.from({ length: 1000 }, (_, i) =>
  generateOne(i),
);

/** Curated demo alerts + 1000 generated signals, used by the triage console. */
export const ALL_ALERTS: AlertItem[] = [...ALERTS, ...GENERATED_ALERTS];

export interface TriageStats {
  threatsAnalysed: number;
  agencies: number;
  pairings: number;
  bandCounts: Record<Severity, number>;
}

export const TRIAGE_STATS: TriageStats = (() => {
  const bandCounts: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  let pairings = 0;
  for (const a of ALL_ALERTS) {
    bandCounts[a.severity] += 1;
    pairings += a.agencyCount;
  }
  return {
    threatsAnalysed: ALL_ALERTS.length,
    agencies: WA_AGENCY_COUNT,
    pairings,
    bandCounts,
  };
})();
