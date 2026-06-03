import type { TriageStats } from "@/data/generatedAlerts";

/** Plain-language labels for demo and leadership audiences. */
export const TRIAGE_AT_A_GLANCE =
  "This is the prioritised queue. Each row is one alert from WASOC feeds. Open a row to see scores, which agencies to call, and what to do next. For the live ingest stream before scoring, use Ingest log in the sidebar.";

export function formatTriageMetaLine(
  stats: Pick<TriageStats, "threatsAnalysed" | "bandCounts">,
): string {
  return `${stats.threatsAnalysed.toLocaleString()} alerts in queue · ${stats.bandCounts.Critical} critical (act today)`;
}

export function triageKpiTiles(stats: TriageStats) {
  return [
    {
      label: "Alerts in queue",
      value: stats.threatsAnalysed.toLocaleString(),
      sub: "Vulnerabilities and threat intelligence after ingest",
    },
    {
      label: "Critical: act today",
      value: String(stats.bandCounts.Critical),
      sub: "Emergencies. Highest severity. Statewide action now.",
      accent: "#f87171",
    },
    {
      label: "High: plan this week",
      value: String(stats.bandCounts.High),
      sub: "Serious but not in the critical emergency set",
      accent: "#fb923c",
    },
    {
      label: "WA agencies covered",
      value: String(stats.agencies),
      sub: `${stats.pairings.toLocaleString()} agency links ranked (who to notify and in what order)`,
    },
  ] as const;
}

export function buildAnalysisStreamSteps(
  stats: Pick<TriageStats, "threatsAnalysed" | "agencies" | "pairings">,
) {
  return [
    `Loading ${stats.threatsAnalysed.toLocaleString()} alerts from WASOC feeds`,
    "Checking sources: WASOC, ACSC/ASD, CISA KEV, and vendor PSIRTs",
    "Scoring how exploitable, how exposed, and how confident we are in the intel",
    `Checking which of ${stats.agencies} WA Government agencies are affected`,
    "Applying agency importance (critical services, citizens, data, tier)",
    "Applying Essential Eight control-gap weighting per agency",
    `Ranking ${stats.pairings.toLocaleString()} agency links (who to contact first)`,
    "Prioritisation ready",
  ];
}
