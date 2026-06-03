"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flex, Tag, Text } from "@once-ui-system/core";
import { PatternGraphNode, PatternNodeKind } from "@/lib/incidentIntelligence";

const CENTER = { x: 100, y: 68 };

function nodeRadius(kind: PatternNodeKind) {
  if (kind === "current") return 14;
  if (kind === "predict") return 11;
  return 9;
}

function edgeStyle(kind: PatternNodeKind) {
  switch (kind) {
    case "intel":
      return { stroke: "#f87171", dash: undefined, width: 2 };
    case "duplicate":
      return { stroke: "#a78bfa", dash: "4 3", width: 2 };
    case "predict":
      return { stroke: "#fb923c", dash: "5 4", width: 2 };
    case "past":
      return { stroke: "#38bdf8", dash: undefined, width: 2 };
    default:
      return { stroke: "#94a3b8", dash: undefined, width: 1.5 };
  }
}

function nodeClass(kind: PatternNodeKind, hot: boolean) {
  const base =
    kind === "current"
      ? "gov-detail-pattern-node-center"
      : kind === "intel"
        ? "gov-detail-pattern-node gov-detail-pattern-node--intel"
        : kind === "predict"
          ? "gov-detail-pattern-node gov-detail-pattern-node--predict"
          : kind === "duplicate"
            ? "gov-detail-pattern-node gov-detail-pattern-node--duplicate"
            : "gov-detail-pattern-node";
  return hot ? `${base} gov-detail-pattern-node--hot` : base;
}

function nodeTagLabel(kind: PatternNodeKind) {
  if (kind === "current") return "This alert";
  if (kind === "intel") return "Intel link";
  if (kind === "duplicate") return "Duplicate";
  if (kind === "predict") return "6h forecast";
  return "Prior pattern";
}

interface InteractivePatternGraphProps {
  nodes: PatternGraphNode[];
  highlightId?: string | null;
  onHighlight?: (id: string | null) => void;
  onOpenIncident?: (openableId: string) => void;
}

export function InteractivePatternGraph({
  nodes,
  highlightId,
  onHighlight,
  onOpenIncident,
}: InteractivePatternGraphProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  useEffect(() => {
    setPinned(null);
    setHovered(null);
  }, [nodes]);

  const activeId = pinned ?? hovered ?? highlightId ?? null;

  const positioned = useMemo(() => {
    const pastSlots = [
      { x: 28, y: 24 },
      { x: 172, y: 24 },
      { x: 100, y: 12 },
    ];
    const dupSlots = [
      { x: 28, y: 100 },
      { x: 172, y: 100 },
    ];
    const predictSlot = { x: 100, y: 108 };
    const intelSlot = { x: 172, y: 52 };
    let pastIdx = 0;
    let dupIdx = 0;
    return nodes.map((n) => {
      if (n.kind === "past") {
        const pos = pastSlots[pastIdx] ?? pastSlots[0];
        pastIdx += 1;
        return { ...n, ...pos };
      }
      if (n.kind === "duplicate") {
        const pos = dupSlots[dupIdx] ?? dupSlots[0];
        dupIdx += 1;
        return { ...n, ...pos };
      }
      if (n.kind === "predict") return { ...n, ...predictSlot };
      if (n.kind === "intel") return { ...n, ...intelSlot };
      return { ...n, ...CENTER };
    });
  }, [nodes]);

  const center = positioned.find((n) => n.kind === "current");
  const active = positioned.find((n) => n.id === activeId) ?? null;
  const canOpen =
    active &&
    active.openableId &&
    (active.kind === "past" || active.kind === "duplicate") &&
    onOpenIncident;

  const onNodeClick = useCallback(
    (id: string) => {
      const next = pinnedRef.current === id ? null : id;
      setPinned(next);
      onHighlight?.(next);
    },
    [onHighlight],
  );

  return (
    <div className="gov-detail-pattern-graph">
      <svg viewBox="0 0 200 128" className="gov-detail-pattern-svg" role="img" aria-label="Pattern link graph">
        <g className="gov-detail-pattern-edges" fill="none" pointerEvents="none">
          {center &&
            positioned
              .filter((n) => n.id !== center.id)
              .map((n) => {
                const es = edgeStyle(n.kind);
                return (
                  <line
                    key={`edge-${n.id}`}
                    x1={center.x}
                    y1={center.y}
                    x2={n.x}
                    y2={n.y}
                    stroke={es.stroke}
                    strokeWidth={es.width}
                    strokeDasharray={es.dash}
                    strokeLinecap="round"
                    opacity={activeId && activeId !== n.id && activeId !== center.id ? 0.3 : 1}
                  />
                );
              })}
        </g>
        <g className="gov-detail-pattern-nodes">
          {positioned.map((n) => {
            const r = nodeRadius(n.kind);
            const hot = n.id === activeId;
            return (
              <g
                key={n.id}
                className="gov-detail-pattern-node-group"
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                onClick={() => onNodeClick(n.id)}
                style={{ cursor: "pointer" }}
              >
                {hot && <circle cx={n.x} cy={n.y} r={r + 5} className="gov-detail-pattern-node-halo" />}
                <circle cx={n.x} cy={n.y} r={r} className={nodeClass(n.kind, hot)} />
                <title>{n.label}</title>
              </g>
            );
          })}
        </g>
      </svg>

      <ul className="gov-detail-pattern-legend">
        <li>
          <span className="gov-detail-pattern-legend-line gov-detail-pattern-legend-line--past" />
          Prior incident
        </li>
        <li>
          <span className="gov-detail-pattern-legend-line gov-detail-pattern-legend-line--dup" />
          Duplicate link
        </li>
        <li>
          <span className="gov-detail-pattern-legend-line gov-detail-pattern-legend-line--predict" />
          6h forecast
        </li>
        <li>
          <span className="gov-detail-pattern-legend-line gov-detail-pattern-legend-line--intel" />
          Intel corroboration
        </li>
      </ul>

      <Flex gap="8" wrap horizontal="center">
        {positioned.map((n) => (
          <button
            key={`chip-${n.id}`}
            type="button"
            className={`gov-detail-pattern-chip${n.id === activeId ? " gov-detail-pattern-chip--active" : ""}`}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onNodeClick(n.id)}
          >
            {n.label}
          </button>
        ))}
      </Flex>

      {active && (
        <div className="gov-pattern-popover" role="tooltip">
          <div className="gov-pattern-popover-head">
            <Text variant="label-strong-s" className="gov-pattern-popover-id">
              {active.label}
            </Text>
            <Tag size="s" variant={active.kind === "current" ? "brand" : "neutral"} label={nodeTagLabel(active.kind)} />
          </div>
          <Text variant="body-default-xs" onBackground="neutral-weak" className="gov-pattern-popover-title">
            {active.title}
          </Text>
          <div className="gov-pattern-popover-block">
            <Text variant="label-default-xs" onBackground="neutral-weak">
              Why it is linked
            </Text>
            <Text variant="body-default-s">{active.similarity}</Text>
          </div>
          <div className="gov-pattern-popover-block">
            <Text variant="label-default-xs" onBackground="neutral-weak">
              Pattern read
            </Text>
            <Text variant="body-default-s">{active.aiTake}</Text>
          </div>
          {active.when && (
            <Text variant="body-default-xs" onBackground="neutral-weak" className="gov-pattern-popover-meta">
              {active.when}
              {active.outcome ? ` · Outcome: ${active.outcome}` : ""}
            </Text>
          )}
          {canOpen && (
            <button
              type="button"
              className="gov-pattern-popover-open"
              onClick={() => onOpenIncident(active.openableId!)}
            >
              Open linked record
            </button>
          )}
        </div>
      )}
    </div>
  );
}
