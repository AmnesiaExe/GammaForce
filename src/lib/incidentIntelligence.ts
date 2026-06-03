import { getAgency } from "@/data/waAgencies";
import {
  buildLinkedIncidentRecords,
  LinkedIncidentRecord,
} from "@/lib/linkedIncidents";
import { AlertItem } from "@/lib/scoring";

export interface PastIncidentMatch {
  id: string;
  when: string;
  similarity: string;
  outcome: string;
}

export interface AgencyContactRecord {
  agencyId: string;
  agencyName: string;
  lastContact: string;
  responseStatus: "Acknowledged" | "In progress" | "Resolved" | "No response" | "Escalated";
  similarPast: boolean;
  notes: string;
}

export type PatternNodeKind = "current" | "past" | "intel" | "duplicate" | "predict";

export interface PatternGraphNode {
  id: string;
  kind: PatternNodeKind;
  label: string;
  title: string;
  similarity: string;
  aiTake: string;
  when?: string;
  outcome?: string;
  /** Register id to open when analyst clicks through */
  openableId?: string;
}

export interface IncidentIntelligence {
  seenBefore: boolean;
  priorOccurrences: number;
  lastSeen: string | null;
  patternSummary: string;
  linkedPatternIds: string[];
  prediction: string;
  predictionConfidence: string;
  aiConclusion: string;
  whyAiScoredHigh: string[];
  pastMatches: PastIncidentMatch[];
  agencyContacts: AgencyContactRecord[];
  graphNodes: PatternGraphNode[];
  linkedIncidents: LinkedIncidentRecord[];
  leadAgencyName: string;
}

export interface BuildIncidentIntelligenceOptions {
  allItems?: AlertItem[];
  aiDisregardReason?: string;
}

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 17) | 0;
  return Math.abs(h);
}

const RESPONSES: AgencyContactRecord["responseStatus"][] = [
  "Acknowledged",
  "In progress",
  "Resolved",
  "No response",
  "Escalated",
];

export function buildIncidentIntelligence(
  alert: AlertItem,
  options: BuildIncidentIntelligenceOptions = {},
): IncidentIntelligence {
  const { allItems = [], aiDisregardReason } = options;
  const h = hashId(alert.id);
  const seenBefore = h % 3 !== 0;
  const priorOccurrences = seenBefore ? 1 + (h % 4) : 0;
  const lastSeen = seenBefore ? `${14 + (h % 40)} days ago` : null;

  const pastMatches: PastIncidentMatch[] = seenBefore
    ? [
        {
          id: `SOC-20260${(h % 500) + 100}`,
          when: lastSeen ?? "Unknown",
          similarity: "Same vendor product family and exploit class",
          outcome: h % 2 === 0 ? "Resolved without statewide escalation" : "Required agency patch window",
        },
        ...(priorOccurrences > 1
          ? [
              {
                id: `SOC-20260${(h % 300) + 200}`,
                when: `${45 + (h % 30)} days ago`,
                similarity: "Overlapping agency footprint (Health, DPC)",
                outcome: "Handled at agency level  no WASOC bridge call",
              },
            ]
          : []),
      ]
    : [];

  const agencyContacts: AgencyContactRecord[] = alert.affectedAgencyIds
    .slice(0, 6)
    .map((agencyId, i) => {
      const agency = getAgency(agencyId);
      const name = agency?.name ?? agencyId;
      const status = RESPONSES[(h + i) % RESPONSES.length];
      const similarPast = seenBefore && (h + i) % 2 === 0;
      return {
        agencyId,
        agencyName: name,
        lastContact: `${2 + ((h + i) % 9)} days ago`,
        responseStatus: status,
        similarPast,
        notes: similarPast
          ? "Similar incident closed locally  monitoring only this time unless severity rises"
          : status === "No response"
            ? "Reminder sent  escalate to agency CISO if no ack in 4h"
            : "Standard WASOC coordination channel active",
      };
    });

  const patternSummary = seenBefore
    ? `AI matched this to ${priorOccurrences} prior statewide record(s). The behaviour chain (${alert.category === "Vulnerability" ? "exploit + exposure" : "identity + lateral movement"}) repeats across the same agency cluster.`
    : "No close prior match in the WASOC memory graph. Treated as a novel pattern until corroboration arrives.";

  const prediction = seenBefore
    ? `Elevated chance of follow-on attempts against ${alert.agencyCount} agencies in the next 6 hours if the initial path is not contained.`
    : "Insufficient history  prediction held at baseline until more telemetry is ingested.";

  const predictionConfidence = seenBefore ? `${72 + (h % 18)}%` : `${38 + (h % 15)}%`;

  const whyAiScoredHigh = [
    seenBefore
      ? "Historical recurrence increases confidence this is not a one-off false positive."
      : "Novel signal  score driven by live exploitability and source trust, not memory match.",
    alert.kevListed
      ? "Listed on CISA KEV  confirmed exploitation in the wild."
      : "Not on KEV  weighting relies on WA telemetry and vendor corroboration.",
    `${alert.agencyCount} agencies in scope  AI raised priority because tier-weighted impact is material.`,
    alert.severity === "Critical"
      ? "Severity band Critical after fusion  meets act-today threshold."
      : `Severity ${alert.severity}  urgency reflects fused threat and agency scores, not a single CVSS number.`,
  ];

  const aiConclusion = seenBefore
    ? `AI recommends treating this as a recurring pattern. Contact lead agencies in ranked order. ${agencyContacts.filter((a) => a.similarPast && a.responseStatus === "Resolved").length > 0 ? "At least one agency resolved a similar event without statewide intervention previously  confirm whether that playbook still applies." : "No agency has a clean prior resolution  expect coordinated WASOC-led response."}`
    : `AI treats this as a new incident. Prioritise verification on ${agencyContacts[0]?.agencyName ?? "lead agency"} first, then expand if exposure spreads.`;

  const leadAgency = alert.scoreBreakdown.agencyRanking[0]?.agency.name ?? agencyContacts[0]?.agencyName ?? "lead agency";

  const isDuplicate =
    Boolean(aiDisregardReason?.toLowerCase().includes("duplicate")) ||
    (seenBefore && h % 5 === 0);

  const duplicateEntries = isDuplicate
    ? [
        {
          displayId: `SOC-20260${(h % 400) + 50}`,
          title: "Earlier bulletin for the same vendor issue (ranked queue)",
          when: `${3 + (h % 8)} hours ago`,
          kind: "duplicate" as const,
          similarity: "Same CVE / product family · vendor repost",
          outcome: "Still in ranked queue · analyst may merge records",
        },
        ...(alert.relatedIncidents > 0
          ? [
              {
                displayId: `SOC-20260${(h % 600) + 80}`,
                title: "Correlated feed item from alternate source",
                when: `${6 + (h % 12)} hours ago`,
                kind: "duplicate" as const,
                similarity: "Cross-source dedupe · shared IOC hash",
                outcome: "Linked for pattern graph · not a separate statewide response",
              },
            ]
          : []),
      ]
    : [];

  const linkedPatternIds = [
    ...(seenBefore ? pastMatches.map((p) => p.id) : [`SOC-20260${(h % 900) + 300}`]),
    ...duplicateEntries.map((d) => d.displayId),
  ];

  const linkedIncidents = buildLinkedIncidentRecords(alert, allItems, [
    ...pastMatches.map((m) => ({
      displayId: m.id,
      title: m.similarity,
      when: m.when,
      kind: "prior" as const,
      similarity: m.similarity,
      outcome: m.outcome,
    })),
    ...duplicateEntries,
  ]);

  const graphNodes: PatternGraphNode[] = [
    {
      id: alert.id,
      kind: "current",
      label: alert.id,
      title: alert.title,
      similarity: "Current alert under triage",
      aiTake: patternSummary,
    },
    ...linkedIncidents
      .filter((l) => l.kind === "prior" || l.kind === "duplicate")
      .slice(0, 4)
      .map((l) => ({
        id: l.displayId,
        kind: (l.kind === "duplicate" ? "duplicate" : "past") as PatternNodeKind,
        label: l.displayId,
        title: l.title,
        similarity: l.similarity,
        aiTake:
          l.kind === "duplicate"
            ? `Duplicate link: ${l.outcome ?? "same issue already tracked"}`
            : `Linked pattern: ${l.outcome ?? "prior WASOC handling"}`,
        when: l.when,
        outcome: l.outcome,
        openableId: l.openableId,
      })),
    {
      id: "prediction-6h",
      kind: "predict" as const,
      label: "6h forecast",
      title: "Escalation outlook (next 6 hours)",
      similarity: `${predictionConfidence} confidence in follow-on activity`,
      aiTake: prediction,
    },
    ...(alert.kevListed
      ? [
          {
            id: "cisa-kev",
            kind: "intel" as const,
            label: "CISA KEV",
            title: "Known exploited vulnerability",
            similarity: "Confirmed exploitation in the wild (CISA catalogue)",
            aiTake: "AI raised exploitability weight because this CVE is on the KEV list.",
          },
        ]
      : []),
  ];

  return {
    seenBefore,
    priorOccurrences,
    lastSeen,
    patternSummary,
    linkedPatternIds,
    prediction,
    predictionConfidence,
    aiConclusion,
    whyAiScoredHigh,
    pastMatches,
    agencyContacts,
    graphNodes,
    linkedIncidents,
    leadAgencyName: leadAgency,
  };
}

