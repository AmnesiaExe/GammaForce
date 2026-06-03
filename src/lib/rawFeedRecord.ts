import { alertToSignals } from "@/lib/alertSignals";
import { AlertItem } from "@/lib/scoring";

/** Fields as ingested from feeds, before prioritisation scoring. */
export function toRawFeedRecord(alert: AlertItem) {
  return {
    reference: alert.id,
    title: alert.title,
    type: alert.category,
    feed: alert.source,
    feed_key: alert.sourceKey,
    received_utc: alert.receivedAt,
    received_display: alert.receivedDisplay,
    status: alert.status,
    assignee: alert.assignee,
    cvss: alert.cvss,
    exploitability: alert.exploitability,
    asset_exposure: alert.assetExposure,
    business_impact: alert.businessImpact,
    environment: alert.environment,
    kev_listed: alert.kevListed,
    ioc_count: alert.iocCount,
    related_incidents: alert.relatedIncidents,
    affected_assets: alert.affectedAssets,
    affected_agency_ids: alert.affectedAgencyIds,
    analyst_notes: alert.analystNotes,
  };
}

/** Normalised inputs sent to the scoring engine (still pre-priority band). */
export function toScoringInputsRecord(alert: AlertItem) {
  const signals = alertToSignals({
    category: alert.category,
    cvss: alert.cvss,
    exploitability: alert.exploitability,
    assetExposure: alert.assetExposure,
    businessImpact: alert.businessImpact,
    environment: alert.environment,
    kevListed: alert.kevListed,
    relatedIncidents: alert.relatedIncidents,
    status: alert.status,
    slaHoursRemaining: alert.slaHoursRemaining,
    sourceKey: alert.sourceKey,
    affectedAgencyIds: alert.affectedAgencyIds,
    agencyCount: alert.agencyCount,
    sourceCredibility: alert.scoreBreakdown.sourceCredibility,
    sourceReputationPercent: alert.scoreBreakdown.sourceReputationPercent,
  });
  return { scoring_inputs: signals };
}

function logTimestamp(alert: AlertItem): string {
  try {
    const d = new Date(alert.receivedAt);
    const date = d.toLocaleDateString("en-AU", {
      timeZone: "Australia/Perth",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-AU", {
      timeZone: "Australia/Perth",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `${date} ${time} AWST`;
  } catch {
    return alert.receivedDisplay;
  }
}

export type IngestLogLevel = "KEV" | "CRIT" | "HIGH" | "INFO";

export function ingestLogLevel(alert: AlertItem): IngestLogLevel {
  if (alert.kevListed) return "KEV";
  if (alert.severity === "Critical") return "CRIT";
  if (alert.severity === "High") return "HIGH";
  return "INFO";
}

/** Single-line ingest log (syslog style). */
export function formatIngestLogLine(alert: AlertItem): string {
  const type = alert.category === "Vulnerability" ? "VULN" : "INTEL";
  const feed = alert.sourceKey.padEnd(11).slice(0, 11);
  const cvss = alert.cvss.toFixed(1).padStart(4, " ");
  const agencies = String(alert.agencyCount).padStart(2, " ");
  const title =
    alert.title.length > 72 ? `${alert.title.slice(0, 69)}...` : alert.title;
  return `INGEST  feed=${feed}  ref=${alert.id}  type=${type}  cvss=${cvss}  agencies=${agencies}  ${title}`;
}

export function formatIngestLogEntry(alert: AlertItem) {
  return {
    id: alert.id,
    timestamp: logTimestamp(alert),
    level: ingestLogLevel(alert),
    message: formatIngestLogLine(alert),
    payload: toRawFeedRecord(alert),
  };
}
