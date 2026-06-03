"use client";

import { Text } from "@once-ui-system/core";

interface AiCorrelationMiniGraphProps {
  centerLabel: string;
  related: string[];
  stage: "flash" | "correlate" | "predict" | "score";
}

export function AiCorrelationMiniGraph({
  centerLabel,
  related,
  stage,
}: AiCorrelationMiniGraphProps) {
  const nodes = [
    { x: 50, y: 18, label: related[0] ?? "Prior event", hot: stage === "flash" },
    { x: 18, y: 52, label: related[1] ?? "KEV link", hot: false },
    { x: 82, y: 50, label: related[2] ?? "Agency hit", hot: stage === "predict" },
    { x: 50, y: 82, label: "Predicted?", hot: stage === "predict" },
  ];

  return (
    <div className="gov-corr-graph">
      <svg viewBox="0 0 100 100" className="gov-corr-graph-svg" aria-hidden>
        <line x1="50" y1="50" x2="50" y2="18" className="gov-corr-edge" />
        <line x1="50" y1="50" x2="18" y2="52" className="gov-corr-edge" />
        <line x1="50" y1="50" x2="82" y2="50" className="gov-corr-edge" />
        <line x1="50" y1="50" x2="50" y2="82" className="gov-corr-edge gov-corr-edge--predict" />
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.hot ? 6 : 4.5}
              className={`gov-corr-node${n.hot ? " gov-corr-node--hot" : ""}`}
            />
          </g>
        ))}
        <circle cx="50" cy="50" r="8" className="gov-corr-node-center" />
      </svg>
      <div className="gov-corr-labels">
        <Text variant="label-strong-s" className="gov-corr-center">
          {centerLabel.slice(0, 32)}
        </Text>
        <Text variant="body-default-xs" onBackground="neutral-weak">
          {stage === "flash" && "Critical match  pulling history"}
          {stage === "correlate" && "Building pattern graph"}
          {stage === "predict" && "Estimating 6h escalation risk"}
          {stage === "score" && "Finalising priority"}
        </Text>
      </div>
      <ul className="gov-corr-related-list">
        {related.map((r) => (
          <li key={r}>
            <Text variant="body-default-xs">{r}</Text>
          </li>
        ))}
      </ul>
    </div>
  );
}
