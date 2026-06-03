import { IncidentIntelligence } from "@/lib/incidentIntelligence";
import { AlertItem, AlertStatus } from "@/lib/scoring";

export type ThreatProgressionState =
  | "done"
  | "active"
  | "upcoming"
  | "danger"
  | "skipped";

export interface ThreatProgressionStage {
  id: string;
  label: string;
  time: string;
  detail: string;
  state: ThreatProgressionState;
  statusLabel: string;
  score?: number;
  skipReason?: string;
}

export type TimelineStepOverride = "skip" | "include";

export interface BuildThreatProgressionOptions {
  aiDisregardReason?: string;
  /** Analyst overrides for auto-skipped or optional steps */
  stepOverrides?: Readonly<Record<string, TimelineStepOverride>>;
}

interface StageTemplate {
  id: string;
  label: string;
  time: (
    alert: AlertItem,
    intel: IncidentIntelligence,
    state: ThreatProgressionState,
  ) => string;
  detail: (alert: AlertItem, intel: IncidentIntelligence) => string;
  score?: (alert: AlertItem, intel: IncidentIntelligence) => number | undefined;
  activeWhenHighRisk?: boolean;
  autoSkip?: (
    alert: AlertItem,
    intel: IncidentIntelligence,
    opts: BuildThreatProgressionOptions,
  ) => string | null;
}

const STAGE_TEMPLATES: StageTemplate[] = [
  {
    id: "ingest",
    label: "Signal ingested",
    time: (a) => a.receivedDisplay,
    detail: (a) => `${a.source} · ${a.category}`,
  },
  {
    id: "corroborate",
    label: "Feed corroboration",
    time: (_, intel, state) =>
      state === "skipped"
        ? "Not relevant"
        : state === "done"
          ? intel.seenBefore
            ? (intel.lastSeen ?? "Complete")
            : "Complete"
          : state === "active"
            ? "In progress"
            : "Planned",
    detail: (_, intel) =>
      intel.seenBefore
        ? `${intel.priorOccurrences} prior pattern match(es) in WASOC memory`
        : "Cross-checking ACSC · KEV · WA CSU",
    autoSkip: (alert, intel) => {
      if (alert.severity === "Low" && !intel.seenBefore) {
        return "Low severity · single-source signal · memory match not required";
      }
      return null;
    },
  },
  {
    id: "exploit",
    label: "Exploitability assessed",
    time: (a, _, state) =>
      state === "skipped"
        ? "Not relevant"
        : state === "upcoming"
          ? "Planned"
          : a.kevListed
            ? "CISA KEV"
            : `CVSS ${a.cvss}`,
    detail: (a) =>
      a.kevListed
        ? "Known exploited vulnerability · exploit weight raised"
        : `Exploitability domain ${Math.round(a.scoreBreakdown.domainScores.exploitability)}/100`,
    score: (a) => a.scoreBreakdown.domainScores.final_score,
    activeWhenHighRisk: true,
    autoSkip: (alert) => {
      if (
        alert.category === "Threat Intelligence" &&
        !alert.kevListed &&
        alert.cvss < 7
      ) {
        return "Threat intel item · CVE exploit scoring not the primary path";
      }
      return null;
    },
  },
  {
    id: "footprint",
    label: "Agency footprint mapped",
    time: (_, __, state) =>
      state === "skipped"
        ? "Not relevant"
        : state === "done"
          ? "Complete"
          : state === "active"
            ? "In progress"
            : "Planned",
    detail: (a) => `${a.agencyCount} agencies · ${a.affectedAssets}`,
    score: (a) => Math.round(a.scoreBreakdown.agencyImpact.composite * 100),
    autoSkip: (alert) => {
      if (alert.agencyCount <= 1) {
        return "Single agency in scope · statewide footprint mapping not required";
      }
      return null;
    },
  },
  {
    id: "priority",
    label: "Statewide priority fused",
    time: (_, __, state) =>
      state === "skipped"
        ? "Not relevant"
        : state === "done"
          ? "Complete"
          : state === "active"
            ? "In progress"
            : "Planned",
    detail: (a) => {
      const p = Math.round(a.compositeScore * 100);
      return `Threat × agency blend · ${p}% (ranked for response · not yet executed)`;
    },
    score: (a) => Math.round(a.compositeScore * 100),
    autoSkip: (_, __, opts) => {
      if (opts.aiDisregardReason) {
        return "AI deprioritised · analyst review only · statewide fusion not applied";
      }
      return null;
    },
  },
  {
    id: "forecast",
    label: "6h escalation watch",
    time: (_, intel, state) =>
      state === "skipped"
        ? "Not relevant"
        : state === "upcoming"
          ? "Planned"
          : intel.predictionConfidence,
    detail: (_, intel) => intel.prediction,
    score: (_, intel) => parseInt(intel.predictionConfidence, 10) || undefined,
    activeWhenHighRisk: true,
    autoSkip: (alert, intel) => {
      const confidence = parseInt(intel.predictionConfidence, 10) || 0;
      if (!intel.seenBefore && confidence < 45) {
        return "No pattern history · baseline forecast only · watch not elevated";
      }
      if (alert.severity === "Low") {
        return "Low severity · 6 hour escalation watch not required";
      }
      return null;
    },
  },
  {
    id: "contact",
    label: "Lead agency contacted",
    time: (_, __, state) =>
      state === "skipped"
        ? "Not relevant"
        : state === "done"
          ? "Complete"
          : state === "active"
            ? "In progress"
            : "Not started",
    detail: (a, intel) => `Contact ${intel.leadAgencyName} · ${a.recommendedAction}`,
    autoSkip: (_, __, opts) => {
      if (opts.aiDisregardReason) {
        return "Deprioritised by AI · contact chain not started unless analyst promotes";
      }
      return null;
    },
  },
  {
    id: "contain",
    label: "Containment coordinated",
    time: (_, __, state) =>
      state === "skipped"
        ? "Not relevant"
        : state === "done"
          ? "Complete"
          : state === "active"
            ? "In progress"
            : "Not started",
    detail: (a) =>
      a.category === "Vulnerability"
        ? "Patch or isolate affected assets · statewide coordination if exposure spreads"
        : "Identity and network containment · shared WA services on watch",
    autoSkip: (alert, _, opts) => {
      if (opts.aiDisregardReason) {
        return "Deprioritised · containment planning not required at statewide level";
      }
      if (alert.severity === "Low" || alert.severity === "Medium") {
        return "Lower band severity · agency may self-contain without WASOC bridge";
      }
      return null;
    },
  },
  {
    id: "closed",
    label: "Verified closed",
    time: (_, __, state) =>
      state === "skipped" ? "Not relevant" : state === "done" ? "Closed" : "Not reached",
    detail: () => "Agencies confirm remediation · WASOC closes the record",
    autoSkip: (alert, _, opts) => {
      if (opts.aiDisregardReason && alert.status !== "Resolved") {
        return "Open deprioritised item · closure path not active";
      }
      return null;
    },
  },
];

function progressStepCount(status: AlertStatus): number {
  switch (status) {
    case "New":
      return 1;
    case "Triaging":
      return 3;
    case "In progress":
      return 5;
    case "Blocked":
      return 7;
    case "Resolved":
      return STAGE_TEMPLATES.length;
    default:
      return 3;
  }
}

function statusLabelFor(state: ThreatProgressionState): string {
  switch (state) {
    case "done":
      return "Complete";
    case "active":
      return "Now";
    case "danger":
      return "At risk";
    case "skipped":
      return "Not relevant";
    default:
      return "Planned";
  }
}

function isSkipped(
  tpl: StageTemplate,
  alert: AlertItem,
  intel: IncidentIntelligence,
  opts: BuildThreatProgressionOptions,
): { skipped: boolean; reason?: string } {
  const override = opts.stepOverrides?.[tpl.id];
  if (override === "include") return { skipped: false };
  if (override === "skip") {
    return { skipped: true, reason: "Marked not relevant by analyst" };
  }
  const auto = tpl.autoSkip?.(alert, intel, opts);
  if (auto) return { skipped: true, reason: auto };
  return { skipped: false };
}

export function buildThreatProgression(
  alert: AlertItem,
  intel: IncidentIntelligence,
  options: BuildThreatProgressionOptions = {},
): ThreatProgressionStage[] {
  const activeTarget = progressStepCount(alert.status);
  const threat = alert.scoreBreakdown.domainScores.final_score;
  const forecastScore = parseInt(intel.predictionConfidence, 10) || 50;

  const entries = STAGE_TEMPLATES.map((tpl) => {
    const { skipped, reason } = isSkipped(tpl, alert, intel, options);
    return { tpl, skipped, skipReason: reason };
  });

  let activeAssigned = alert.status !== "Resolved";

  return entries.map(({ tpl, skipped, skipReason }, templateIndex) => {
    if (skipped) {
      return {
        id: tpl.id,
        label: tpl.label,
        time: tpl.time(alert, intel, "skipped"),
        detail: skipReason ?? "Not required for this incident",
        state: "skipped" as const,
        statusLabel: statusLabelFor("skipped"),
        skipReason,
      };
    }

    let state: ThreatProgressionState;
    if (alert.status === "Resolved") {
      state = "done";
      activeAssigned = false;
    } else if (templateIndex < activeTarget) {
      state = "done";
    } else if (activeAssigned) {
      const highRisk =
        tpl.activeWhenHighRisk &&
        (tpl.id === "exploit" ? threat >= 70 : forecastScore >= 65);
      state = highRisk ? "danger" : "active";
      activeAssigned = false;
    } else {
      state = "upcoming";
    }

    return {
      id: tpl.id,
      label: tpl.label,
      time: tpl.time(alert, intel, state),
      detail: tpl.detail(alert, intel),
      state,
      statusLabel: statusLabelFor(state),
      score:
        state === "upcoming" ? undefined : tpl.score?.(alert, intel),
      skipReason,
    };
  });
}

export function timelineSummary(stages: ThreatProgressionStage[]) {
  const applicable = stages.filter((s) => s.state !== "skipped");
  const done = applicable.filter((s) => s.state === "done").length;
  const skipped = stages.filter((s) => s.state === "skipped").length;
  return { done, skipped, applicable: applicable.length };
}
