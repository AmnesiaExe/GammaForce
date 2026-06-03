import { IncidentIntelligence } from "@/lib/incidentIntelligence";
import { AlertItem } from "@/lib/scoring";

export function buildImpactNarrative(alert: AlertItem, intel: IncidentIntelligence): string {
  return buildImpactAnalysisLines(alert, intel).join(" ");
}

export interface WorkbenchTriageContext {
  alertId: string;
  agencyLabel: string;
  related: string[];
  priority: number;
  severity: string;
  agencyCount: number;
  aiTag: string;
  isNoise?: boolean;
}

export function buildWorkbenchNarrative(ctx: WorkbenchTriageContext): string {
  return buildWorkbenchAnalysisLines(ctx).join(" ");
}

export function buildImpactAnalysisLines(
  alert: AlertItem,
  intel: IncidentIntelligence,
): string[] {
  const b = alert.scoreBreakdown;
  const impact = b.agencyImpact;
  const threat = b.domainScores.final_score;
  const priority = Math.round(alert.compositeScore * 100);
  const lead = intel.leadAgencyName;
  const top = b.agencyRanking.slice(0, 3);

  const agencyNames =
    alert.scoreBreakdown.affectedAgencyNames.slice(0, 4).join(", ") ||
    `${impact.agencyCount} mapped agencies`;

  const lines = [
    `Assessing statewide impact for ${alert.id}…`,
    `What is impacted: ${alert.affectedAssets} in ${alert.environment}.`,
    `Threat score ${threat}/100 drives how urgent this is on its own.`,
    `${impact.agencyCount} agencies sit in the exposure footprint (${agencyNames}).`,
    `Combined agency impact score is ${Math.round(impact.composite * 100)}/100 before statewide fusion.`,
    `Asset impact domain ${Math.round(b.domainScores.asset_impact)}/100 · citizen-facing exposure weighted.`,
    `Exposure domain ${Math.round(b.domainScores.exposure)}/100 · internet-facing and service placement matter here.`,
  ];

  if (alert.category === "Vulnerability") {
    lines.push(
      `Vulnerability class: patch or isolate ${alert.affectedAssets} before lateral movement into shared WA services.`,
    );
  } else {
    lines.push(
      `Threat intel class: monitor identity and mail flows tied to ${alert.affectedAssets} for follow-on activity.`,
    );
  }

  if (top[0]) {
    lines.push(
      `${lead} ranks first: tier ${top[0].agency.tier}, verified importance ${Math.round(top[0].agency.criticalityWeight * 100)}%.`,
    );
    lines.push(`Rationale: ${top[0].rationale}`);
  }
  if (top[1]) {
    lines.push(
      `Next contact ${top[1].agency.name} · priority ${top[1].urgencyPercent} for this threat.`,
    );
  }

  if (intel.seenBefore) {
    lines.push(
      `Historical pattern: ${intel.priorOccurrences} prior match(es) increases confidence this is material.`,
    );
  } else {
    lines.push("No close prior pattern; impact driven by live severity and agency weights.");
  }

  lines.push(
    `Fused statewide priority settling around ${priority}% (threat × agency blend).`,
  );
  lines.push(b.explanation.recommendation);
  lines.push(`Contact order should start with ${lead}, then widen if exposure spreads.`);

  return lines;
}

export function buildWorkbenchAnalysisLines(ctx: WorkbenchTriageContext): string[] {
  const relatedBit = ctx.related.slice(0, 2).join(" · ") || "no cluster yet";
  const lines = [
    `Live triage on ${ctx.alertId} (${ctx.severity}, ${ctx.aiTag}).`,
    "Ingest normalised · corroborating ACSC, KEV, and WA CSU context.",
    `Severity band check against WASOC act-today thresholds for ${ctx.severity} alerts.`,
    `Pattern cluster: ${relatedBit}.`,
    `${ctx.agencyCount} agencies in scope · lead footprint ${ctx.agencyLabel}.`,
    "Tier-1 and citizen-facing exposure weights applied to agency impact.",
    "6 hour escalation outlook included in fusion model.",
    `Threat × agency fusion · statewide priority forming at ${ctx.priority}%.`,
    "Contact order ranked for statewide coordination.",
    "Analyst-ready plain-language brief drafted.",
  ];
  if (ctx.isNoise) {
    lines.push(
      "Duplicate and low-value checks: likely vendor repost or out-of-scope · candidate for filtered queue.",
    );
  } else {
    lines.push(
      "Duplicate and false-positive pass: no blocking match · proceeding to ranked queue.",
    );
  }
  lines.push("Allocating slot in the prioritised WASOC queue.");
  return lines;
}
