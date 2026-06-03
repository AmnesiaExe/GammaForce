import { WA_AGENCIES } from "@/data/agencies";
import { INTELLIGENCE_SOURCES } from "@/data/intelligenceSources";
import { AlertItem, Severity } from "@/lib/scoring";

export type NetworkNodeKind = "agency" | "alert" | "source";

export interface ExposureNode {
  id: string;
  kind: NetworkNodeKind;
  label: string;
  x?: number;
  y?: number;
  /** Visual weight for force-graph nodeVal. */
  val: number;
  alertId?: string;
  severity?: Severity;
  priorityScore?: number;
  agencyCount?: number;
  sourceReputation?: number;
  tier?: number;
}

export interface ExposureLink {
  source: string;
  target: string;
  kind: "exposure" | "intel" | "coexposure";
  weight: number;
}

export interface ExposureGraphData {
  nodes: ExposureNode[];
  links: ExposureLink[];
  stats: {
    agencies: number;
    alerts: number;
    sources: number;
    exposureLinks: number;
    coExposureLinks: number;
  };
}

const SEVERITY_HEX: Record<Severity, string> = {
  Critical: "#f87171",
  High: "#fbbf24",
  Medium: "#60a5fa",
  Low: "#94a3b8",
};

export function severityNodeColor(severity: Severity) {
  return SEVERITY_HEX[severity];
}

export function nodeColor(node: ExposureNode, dimmed: boolean): string {
  if (dimmed) {
    if (node.kind === "agency") return "#334155";
    if (node.kind === "source") return "#1e293b";
    return "#334155";
  }
  if (node.kind === "agency") return "#38bdf8";
  if (node.kind === "source") return "#94a3b8";
  return node.severity ? severityNodeColor(node.severity) : "#60a5fa";
}

export function linkColor(link: ExposureLink, dimmed: boolean): string {
  if (dimmed) return "rgba(51, 65, 85, 0.25)";
  if (link.kind === "coexposure") return "rgba(56, 189, 248, 0.35)";
  if (link.kind === "intel") return "rgba(148, 163, 184, 0.5)";
  return "rgba(56, 189, 248, 0.65)";
}

export function buildExposureGraph(
  alerts: AlertItem[],
  options?: { minSeverity?: Severity | "All"; includeCoExposure?: boolean },
): ExposureGraphData {
  const minSeverity = options?.minSeverity ?? "All";
  const includeCoExposure = options?.includeCoExposure ?? true;

  const severityRank: Record<Severity, number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };

  const filtered =
    minSeverity === "All"
      ? alerts
      : alerts.filter(
          (a) => severityRank[a.severity] <= severityRank[minSeverity],
        );

  const nodeMap = new Map<string, ExposureNode>();
  const links: ExposureLink[] = [];

  const ensureNode = (node: ExposureNode) => {
    const existing = nodeMap.get(node.id);
    if (!existing || node.val > existing.val) {
      nodeMap.set(node.id, node);
    }
  };

  for (const alert of filtered) {
    const alertNodeId = `alert:${alert.id}`;
    ensureNode({
      id: alertNodeId,
      kind: "alert",
      label: alert.id,
      val: 6 + alert.compositeScore * 14 + alert.agencyCount * 0.8,
      alertId: alert.id,
      severity: alert.severity,
      priorityScore: alert.compositeScore,
      agencyCount: alert.agencyCount,
    });

    const sourceMeta = INTELLIGENCE_SOURCES[alert.sourceKey];
    const sourceNodeId = `source:${alert.sourceKey}`;
    ensureNode({
      id: sourceNodeId,
      kind: "source",
      label: sourceMeta?.label ?? alert.source,
      val: 4 + (sourceMeta ? 2 : 0),
      sourceReputation: alert.scoreBreakdown.sourceReputationPercent,
    });

    links.push({
      source: sourceNodeId,
      target: alertNodeId,
      kind: "intel",
      weight: 0.35 + alert.scoreBreakdown.sourceCredibility * 0.5,
    });

    for (const agencyId of alert.affectedAgencyIds) {
      const agency = WA_AGENCIES[agencyId];
      if (!agency) continue;

      const agencyNodeId = `agency:${agencyId}`;
      ensureNode({
        id: agencyNodeId,
        kind: "agency",
        label: agency.name,
        val: 5 + agency.criticalityWeight * 6,
        tier: agency.tier,
      });

      links.push({
        source: agencyNodeId,
        target: alertNodeId,
        kind: "exposure",
        weight: 0.4 + alert.compositeScore * 0.45 + agency.criticalityWeight * 0.15,
      });
    }

    if (includeCoExposure && alert.affectedAgencyIds.length >= 3) {
      const ids = alert.affectedAgencyIds;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          links.push({
            source: `agency:${ids[i]}`,
            target: `agency:${ids[j]}`,
            kind: "coexposure",
            weight: 0.15 + alert.compositeScore * 0.2,
          });
        }
      }
    }
  }

  const nodes = [...nodeMap.values()];
  const exposureLinks = links.filter((l) => l.kind === "exposure").length;
  const coExposureLinks = links.filter((l) => l.kind === "coexposure").length;

  return {
    nodes,
    links,
    stats: {
      agencies: nodes.filter((n) => n.kind === "agency").length,
      alerts: nodes.filter((n) => n.kind === "alert").length,
      sources: nodes.filter((n) => n.kind === "source").length,
      exposureLinks,
      coExposureLinks,
    },
  };
}

/** Node ids connected to the selected alert (including the alert and its sources/agencies). */
export function highlightNodeIds(
  graph: ExposureGraphData,
  selectedAlertId: string | null,
): Set<string> | null {
  if (!selectedAlertId) return null;

  const focus = new Set<string>([`alert:${selectedAlertId}`]);
  for (const link of graph.links) {
    const src = typeof link.source === "string" ? link.source : (link.source as ExposureNode).id;
    const tgt = typeof link.target === "string" ? link.target : (link.target as ExposureNode).id;
    if (src === `alert:${selectedAlertId}` || tgt === `alert:${selectedAlertId}`) {
      focus.add(src);
      focus.add(tgt);
    }
  }
  return focus;
}

export function isNodeDimmed(
  nodeId: string,
  focus: Set<string> | null,
): boolean {
  return focus !== null && !focus.has(nodeId);
}

export function isLinkDimmed(
  link: ExposureLink,
  focus: Set<string> | null,
): boolean {
  if (!focus) return false;
  const src = link.source as string;
  const tgt = link.target as string;
  return !focus.has(src) || !focus.has(tgt);
}
