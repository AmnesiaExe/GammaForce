import { getAgency } from "@/data/waAgencies";
import { AlertItem } from "@/lib/scoring";

export type AiTriageLane = "incoming" | "processing" | "ranked" | "discarded";

export type ProcessingStage = "flash" | "correlate" | "predict" | "score";

export interface FeedStyle {
  key: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const FEED_STYLES: Record<string, FeedStyle> = {
  acsc: { key: "acsc", label: "ACSC", color: "#38bdf8", bg: "rgba(56,189,248,0.14)", border: "rgba(56,189,248,0.45)" },
  "cisa-kev": { key: "cisa-kev", label: "CISA KEV", color: "#f87171", bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.45)" },
  "wa-csu": { key: "wa-csu", label: "WA CSU", color: "#4ade80", bg: "rgba(74,222,128,0.14)", border: "rgba(74,222,128,0.45)" },
  siem: { key: "siem", label: "SIEM", color: "#a78bfa", bg: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.45)" },
  auscert: { key: "auscert", label: "AusCERT", color: "#fbbf24", bg: "rgba(251,191,36,0.14)", border: "rgba(251,191,36,0.45)" },
  "vendor-psirt": { key: "vendor-psirt", label: "PSIRT", color: "#fb923c", bg: "rgba(251,146,60,0.14)", border: "rgba(251,146,60,0.45)" },
  nvd: { key: "nvd", label: "NVD", color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.35)" },
  "open-feed": { key: "open-feed", label: "OSINT", color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.35)" },
  chrome: { key: "chrome", label: "Chrome", color: "#22d3ee", bg: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.35)" },
  openssl: { key: "openssl", label: "OpenSSL", color: "#e879f9", bg: "rgba(232,121,249,0.12)", border: "rgba(232,121,249,0.35)" },
  fortinet: { key: "fortinet", label: "Fortinet", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.35)" },
};

export interface SimulatedNarrative {
  displayTitle: string;
  aiTag: string;
  aiHint: string;
}

export const SIMULATED_NARRATIVES: SimulatedNarrative[] = [
  { displayTitle: "Suspicious PowerShell: encoded `-enc` child process from %TEMP%", aiTag: "Endpoint behaviour", aiHint: "Correlating EDR timeline with signed script block logs" },
  { displayTitle: "Impossible travel: VPN auth Perth then Singapore 4 minutes apart", aiTag: "Identity anomaly", aiHint: "Enriching geo-velocity against agency roster shift patterns" },
  { displayTitle: "Lateral movement: `wmic.exe` remote process spawn on Health VLAN", aiTag: "Lateral movement", aiHint: "Mapping blast radius across tier-1 clinical subnets" },
  { displayTitle: "OAuth consent grant: unknown multi-tenant app requested Mail.Read", aiTag: "Cloud identity", aiHint: "Checking consent policy drift vs Essential Eight #3" },
  { displayTitle: "DNS tunneling: high-entropy subdomains to newly registered TLD", aiTag: "Network hunting", aiHint: "Clustering PCAP metadata with threat feed IOC overlap" },
  { displayTitle: "Kerberoasting burst: 140 service ticket requests in 90 seconds", aiTag: "AD attack pattern", aiHint: "Distinguishing pen-test activity from live credential access" },
  { displayTitle: "Web shell upload: `.aspx` dropped under public-facing SharePoint path", aiTag: "Web compromise", aiHint: "Generating containment steps per affected agency CMS owner" },
  { displayTitle: "Ransomware pre-cursor: VSS shadow copy deletion on Treasury file server", aiTag: "Ransomware signal", aiHint: "Matching TTP to sector ISAC bulletin from last 48h" },
  { displayTitle: "Routine Chrome update: duplicate bulletin #7 (low urgency)", aiTag: "Noise", aiHint: "Matching against 6 prior identical vendor posts" },
  { displayTitle: "SSL cert expiry warning: non-production lab host", aiTag: "Hygiene", aiHint: "Asset tagged dev/test  auto-downgrading statewide priority" },
  { displayTitle: "Marketing site typo squatting: no WA Gov brand overlap", aiTag: "Low relevance", aiHint: "Disregarding  outside government footprint" },
];

export const AI_OPERATOR_TASKS = [
  "Correlating SIEM alerts with ACSC and CISA KEV context",
  "Deduplicating vendor bulletins that describe the same CVE",
  "Ranking which WA agencies to contact first for each incident",
  "Drafting analyst-ready summary in plain English",
  "Matching behaviour to MITRE ATT&CK for briefing slides",
  "Suppressing low-trust feed noise that failed corroboration",
  "Linking incident to Essential Eight control gaps per agency",
  "Building pattern graph: 4 related events in 72h window",
  "Predicting escalation probability in next 6 hours",
  "Clustering OAuth, VPN, and endpoint signals into one story",
];

export const TRIAGE_AI_ROLE =
  "Live triage: corroborates feeds, links patterns, scores threat and agency impact, ranks statewide contact order, and filters duplicates and low-value noise. Filtered items stay in the register for analyst review.";

export const STAGE_THINKING_LINES: Record<ProcessingStage, string[]> = {
  flash: [
    "Normalising ingest · WASOC severity bands…",
    "Corroborating ACSC · CISA KEV · WA CSU feeds…",
    "Scoring exploitability and internet exposure…",
  ],
  correlate: [
    "Querying WASOC memory graph for prior incidents…",
    "Clustering related signals and IOC overlap…",
    "Mapping behaviour to MITRE ATT&CK for briefing…",
  ],
  predict: [
    "Resolving WA agencies in the exposure footprint…",
    "Applying tier and citizen-facing impact weights…",
    "Forecasting 6 hour escalation probability…",
  ],
  score: [
    "Fusing threat score with agency impact…",
    "Ranking contact order · lead agency first…",
    "Placing alert in the prioritised statewide queue…",
  ],
};

export function stageActivityMessage(stage: ProcessingStage, card: { alert: { id: string }; agencyLabel: string }): string {
  switch (stage) {
    case "flash":
      return `TRIAGE · ${card.alert.id} · severity and feed corroboration`;
    case "correlate":
      return `TRIAGE · ${card.alert.id} · pattern links and related events`;
    case "predict":
      return `TRIAGE · ${card.alert.id} · agency impact and escalation forecast`;
    case "score":
      return `TRIAGE · ${card.alert.id} · statewide priority fusion`;
  }
}

/** How GammaForce differs from generic SIEM / Sentinel-style triage. */
export const WASOC_DIFFERENTIATORS = [
  "Ranks which WA agency to contact first using tier, criticality, and this threat score",
  "Remembers prior WASOC outcomes per agency (resolved locally vs needed statewide bridge)",
  "Links repeat patterns across incidents without mixing in escalation forecasts",
  "Surfaces citizen-impact and tier-1 service weight, not only CVE or alert count",
  "Keeps deprioritised items reviewable so analysts can overturn AI noise calls",
];

export const STAGE_LABELS: Record<ProcessingStage, string> = {
  flash: "Critical match",
  correlate: "Pattern links",
  predict: "Agency impact",
  score: "Priority score",
};

/** Live analysis stream lines (placeholders optional). */
export const AI_CHAT_LINES = [
  "Ingest normalised · {id}",
  "Severity band check against WASOC thresholds",
  "Feed corroboration · ACSC · KEV · WA CSU",
  "Exposure signals · internet-facing assets flagged",
  "Memory graph lookup · prior WA incidents",
  "Pattern cluster · {related}",
  "Deduplicating vendor duplicate bulletins",
  "Agency register resolve · {agency} in scope",
  "Tier and verified impact weights applied",
  "Citizen-facing service exposure estimate",
  "Contact order ranking · statewide coordination",
  "Past agency response outcomes checked",
  "Threat × agency fusion running",
  "Priority estimate · {priority}%",
  "Plain-language brief draft for analysts",
  "Queue slot allocation · finalising rank",
];

export const CORRELATION_RELATED = [
  "Prior VPN anomaly (same user)",
  "KEV match 11 days ago",
  "Essential Eight gap: patching",
  "Peer agency hit last week",
];

export function feedStyle(sourceKey: string): FeedStyle {
  return (
    FEED_STYLES[sourceKey] ?? {
      key: sourceKey,
      label: sourceKey.slice(0, 8),
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.1)",
      border: "rgba(148,163,184,0.3)",
    }
  );
}

export function primaryAgencyLabel(alert: AlertItem): string {
  const id = alert.affectedAgencyIds[0];
  if (!id) return "WA Government";
  const agency = getAgency(id);
  if (!agency) return id;
  const short = agency.name.replace(/, Department of$/, "").replace(/, Department of /, "");
  return short.length > 28 ? `${short.slice(0, 25)}…` : short;
}

export function narrativeForIndex(index: number): SimulatedNarrative {
  return SIMULATED_NARRATIVES[index % SIMULATED_NARRATIVES.length];
}

export function deprioritiseReasonFor(card: {
  aiTag: string;
  aiHint: string;
}): string {
  if (card.aiTag === "Noise") return "Duplicate bulletin · already in queue";
  if (card.aiTag === "Low relevance") return "Out of scope · not WA Government";
  if (card.aiTag === "Hygiene") return "Low value · dev/test hygiene only";
  return card.aiHint || "Low value · not worth statewide action";
}

export function enrichAlertForDemo(alert: AlertItem, index: number) {
  const n = narrativeForIndex(index);
  const useCreative =
    index < SIMULATED_NARRATIVES.length || alert.category === "Threat Intelligence";
  const isNoise = useCreative && (n.aiTag === "Noise" || n.aiTag === "Low relevance");
  return {
    displayTitle: useCreative ? n.displayTitle : alert.title,
    aiTag: useCreative ? n.aiTag : alert.category,
    aiHint: isNoise
      ? n.aiTag === "Noise"
        ? "Duplicate bulletin · same issue already in queue"
        : "Out of scope · not WA Government footprint"
      : n.aiHint,
    isNoise,
  };
}
