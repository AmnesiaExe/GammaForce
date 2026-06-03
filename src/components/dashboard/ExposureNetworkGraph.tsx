"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Chip,
  Column,
  Flex,
  Row,
  SegmentedControl,
  Text,
} from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import {
  buildExposureGraph,
  ExposureLink,
  ExposureNode,
  highlightNodeIds,
  isLinkDimmed,
  isNodeDimmed,
  linkColor,
  nodeColor,
} from "@/lib/exposureNetwork";
import { AlertItem, Severity } from "@/lib/scoring";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="gov-network-loading">
        <Text variant="body-default-s" onBackground="neutral-weak">
          Building exposure graph…
        </Text>
      </div>
    ),
  },
);

type SeverityFilter = "All" | Severity;

interface ExposureNetworkGraphProps {
  items: AlertItem[];
  selectedId: string | null;
  onSelectAlert: (id: string) => void;
}

function NetworkLegend() {
  const items = [
    { color: "#38bdf8", label: "Agency" },
    { color: "#f87171", label: "Critical alert" },
    { color: "#fbbf24", label: "High alert" },
    { color: "#94a3b8", label: "Intelligence source" },
    { color: "rgba(56, 189, 248, 0.65)", label: "Exposure link" },
    { color: "rgba(56, 189, 248, 0.35)", label: "Co-exposure (3+ agencies)" },
  ];

  return (
    <Row gap="16" wrap className="gov-network-legend">
      {items.map((item) => (
        <Flex key={item.label} gap="8" vertical="center">
          <span
            className="gov-network-legend-swatch"
            style={{ background: item.color }}
          />
          <Text variant="label-default-xs" onBackground="neutral-weak">
            {item.label}
          </Text>
        </Flex>
      ))}
    </Row>
  );
}

export function ExposureNetworkGraph({
  items,
  selectedId,
  onSelectAlert,
}: ExposureNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<{
    zoomToFit: (ms?: number, padding?: number) => void;
    centerAt: (x?: number, y?: number, ms?: number) => void;
    d3Force: (name: string) => { strength?: (v: number) => void; distance?: (fn: (l: ExposureLink) => number) => void };
  } | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("All");
  const [showCoExposure, setShowCoExposure] = useState(true);
  const [hovered, setHovered] = useState<ExposureNode | null>(null);
  const [focusMode, setFocusMode] = useState(true);

  const graphData = useMemo(
    () =>
      buildExposureGraph(items, {
        minSeverity: severityFilter,
        includeCoExposure: showCoExposure,
      }),
    [items, severityFilter, showCoExposure],
  );

  const focusSet = useMemo(
    () =>
      focusMode && selectedId
        ? highlightNodeIds(graphData, selectedId)
        : null,
    [graphData, selectedId, focusMode],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? { width: 800, height: 480 };
      setDimensions({
        width: Math.max(320, Math.floor(width)),
        height: Math.max(360, Math.floor(height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    const linkForce = fg.d3Force("link");
    if (linkForce?.distance) {
      linkForce.distance((link: ExposureLink) => {
        if (link.kind === "coexposure") return 55;
        if (link.kind === "intel") return 90;
        return 70;
      });
    }

    const charge = fg.d3Force("charge");
    if (charge?.strength) {
      charge.strength(-220);
    }

    const t = window.setTimeout(() => fg.zoomToFit(400, 48), 120);
    return () => window.clearTimeout(t);
  }, [graphData, dimensions]);

  useEffect(() => {
    if (!selectedId || !graphRef.current) return;
    const t = window.setTimeout(() => graphRef.current?.zoomToFit(500, 56), 80);
    return () => window.clearTimeout(t);
  }, [selectedId]);

  const handleNodeClick = useCallback(
    (node: ExposureNode) => {
      if (node.kind === "alert" && node.alertId) {
        onSelectAlert(node.alertId);
      }
    },
    [onSelectAlert],
  );

  const nodeCanvasObject = useCallback(
    (obj: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const node = obj as ExposureNode;
      const dimmed = isNodeDimmed(node.id, focusSet);
      const color = nodeColor(node, dimmed);
      const r = Math.sqrt(Math.max(node.val, 1)) * 2.2;
      const selected = node.alertId === selectedId;
      const hoveredNode = hovered?.id === node.id;

      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.globalAlpha = dimmed ? 0.35 : 1;
      ctx.fill();

      if (selected || hoveredNode) {
        ctx.strokeStyle = selected ? "#f8fafc" : "#38bdf8";
        ctx.lineWidth = (selected ? 2.5 : 1.5) / globalScale;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }

      if (node.kind === "alert" && node.agencyCount && node.agencyCount >= 5 && !dimmed) {
        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, r + 4 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      if (globalScale > 0.85 || hoveredNode || selected) {
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `${selected || hoveredNode ? "600" : "500"} ${fontSize}px var(--font-label), system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = dimmed ? "rgba(148, 163, 184, 0.5)" : "#e2e8f0";
        const label =
          node.kind === "alert"
            ? node.label
            : node.label.length > 22
              ? `${node.label.slice(0, 20)}…`
              : node.label;
        ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + r + 2 / globalScale);
      }
    },
    [focusSet, hovered, selectedId],
  );

  const graphPayload = useMemo(
    () => ({
      nodes: graphData.nodes.map((n) => ({ ...n })),
      links: graphData.links.map((l) => ({
        ...l,
        source: l.source,
        target: l.target,
      })),
    }),
    [graphData],
  );

  return (
    <Panel
      title="Statewide exposure network"
      subtitle="Agencies, intelligence sources, and shared issues. Drag nodes, scroll to zoom, click an alert to inspect."
      padding="0"
    >
      <Column padding="24" gap="16" fillWidth>
        <Row fillWidth gap="16" wrap vertical="center" horizontal="between">
          <NetworkLegend />
          <Row gap="8" wrap>
            <Chip
              label={focusMode ? "Focus: on" : "Focus: off"}
              selected={focusMode}
              onClick={() => setFocusMode((v) => !v)}
            />
            <Chip
              label={showCoExposure ? "Co-exposure: on" : "Co-exposure: off"}
              selected={showCoExposure}
              onClick={() => setShowCoExposure((v) => !v)}
            />
          </Row>
        </Row>

        <SegmentedControl
          fillWidth
          buttons={(
            ["All", "Critical", "High", "Medium", "Low"] as SeverityFilter[]
          ).map((value) => ({ value, label: value === "All" ? "All severities" : value }))}
          selected={severityFilter}
          onToggle={(value) => setSeverityFilter(value as SeverityFilter)}
        />

        <Row gap="16" wrap className="gov-network-stats">
          <Text variant="label-default-xs" onBackground="neutral-weak">
            {graphData.stats.agencies} agencies
          </Text>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            {graphData.stats.alerts} alerts
          </Text>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            {graphData.stats.sources} sources
          </Text>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            {graphData.stats.exposureLinks} exposure edges
          </Text>
          {graphData.stats.coExposureLinks > 0 && (
            <Text variant="label-default-xs" onBackground="brand-weak">
              {graphData.stats.coExposureLinks} co-exposure edges
            </Text>
          )}
        </Row>

        <div ref={containerRef} className="gov-network-canvas-wrap">
          <ForceGraph2D
            ref={graphRef as never}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphPayload}
            nodeId="id"
            nodeLabel={(n) => {
              const node = n as ExposureNode;
              if (node.kind === "alert") {
                return `${node.label}\n${node.severity} · ${Math.round((node.priorityScore ?? 0) * 100)}% · ${node.agencyCount} agencies`;
              }
              if (node.kind === "agency") {
                return `${node.label}\nTier ${node.tier ?? "n/a"}`;
              }
              return `${node.label}\nSource reputation ${node.sourceReputation ?? "n/a"}/100`;
            }}
            linkDirectionalParticles={(link) => {
              const l = link as ExposureLink;
              if (isLinkDimmed(l, focusSet)) return 0;
              return l.kind === "exposure" ? 2 : 0;
            }}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.004}
            linkWidth={(link) => {
              const l = link as ExposureLink;
              const base = l.kind === "coexposure" ? 0.6 : l.kind === "intel" ? 1 : 1.2;
              return base + l.weight * 1.5;
            }}
            linkColor={(link) => linkColor(link as ExposureLink, isLinkDimmed(link as ExposureLink, focusSet))}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node, color, ctx) => {
              const n = node as ExposureNode;
              const r = Math.sqrt(Math.max(n.val, 1)) * 2.2;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(n.x ?? 0, n.y ?? 0, r + 2, 0, 2 * Math.PI);
              ctx.fill();
            }}
            onNodeClick={(node) => handleNodeClick(node as unknown as ExposureNode)}
            onNodeHover={(node) =>
              setHovered(node ? (node as unknown as ExposureNode) : null)
            }
            onBackgroundClick={() => setHovered(null)}
            cooldownTicks={120}
            d3AlphaDecay={0.022}
            d3VelocityDecay={0.35}
            enableNodeDrag
            enableZoomInteraction
            enablePanInteraction
          />

          {hovered && (
            <div className="gov-network-tooltip">
              <Text variant="label-strong-s">{hovered.label}</Text>
              <Text variant="body-default-xs" onBackground="neutral-weak">
                {hovered.kind === "alert" &&
                  `${hovered.severity} · priority ${Math.round((hovered.priorityScore ?? 0) * 100)}% · ${hovered.agencyCount} agencies`}
                {hovered.kind === "agency" && `Government agency · tier ${hovered.tier}`}
                {hovered.kind === "source" &&
                  `Intelligence feed · reputation ${hovered.sourceReputation}/100`}
              </Text>
              {hovered.kind === "alert" && (
                <Text variant="label-default-xs" onBackground="brand-weak">
                  Click to open case inspector
                </Text>
              )}
            </div>
          )}
        </div>
      </Column>
    </Panel>
  );
}
