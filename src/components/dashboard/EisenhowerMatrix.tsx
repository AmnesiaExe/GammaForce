"use client";

import { useMemo } from "react";
import { Column, Flex, Heading, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { getEisenhowerPlacement, type EisenhowerQuadrant } from "@/lib/eisenhowerMatrix";
import type { AlertItem } from "@/lib/scoring";
import { scoreColor, scoreColorHex } from "@/lib/riskColors";

interface EisenhowerMatrixProps {
  alert: AlertItem;
  /** Small bordered block (e.g. case inspector) */
  compact?: boolean;
  /** Inside another panel; no outer Panel wrapper */
  embedded?: boolean;
  className?: string;
}

/** Grid order: top row = urgent; columns = low → high importance */
const QUADRANT_GRID: { id: EisenhowerQuadrant; label: string }[] = [
  { id: "interruption", label: "Interruption" },
  { id: "crises", label: "Crises" },
  { id: "distraction", label: "Distraction" },
  { id: "goals", label: "Goals + planning" },
];

const QUADRANT_TAG: Record<
  EisenhowerQuadrant,
  "danger" | "warning" | "brand" | "neutral"
> = {
  crises: "danger",
  interruption: "warning",
  goals: "brand",
  distraction: "neutral",
};

function EisenhowerChart({ alert }: { alert: AlertItem }) {
  const placement = useMemo(() => getEisenhowerPlacement(alert), [alert]);
  const dotColor = scoreColorHex(placement.urgency);

  return (
    <>
      <div className="gov-eisenhower-chart-surface">
        <div className="gov-eisenhower-chart-wrap">
          <span className="gov-eisenhower-axis-y" aria-hidden>
            Urgent
          </span>
          <div className="gov-eisenhower-chart">
            <div className="gov-eisenhower-grid" role="img" aria-hidden>
              {QUADRANT_GRID.map((q) => (
                <div
                  key={q.id}
                  className={`gov-eisenhower-quad gov-eisenhower-quad--${q.id}`}
                >
                  <span>{q.label}</span>
                </div>
              ))}
              <div className="gov-eisenhower-midline gov-eisenhower-midline--v" />
              <div className="gov-eisenhower-midline gov-eisenhower-midline--h" />
              <div
                className={`gov-eisenhower-dot gov-eisenhower-dot--${placement.quadrant}`}
                style={{
                  left: `${placement.importance}%`,
                  bottom: `${placement.urgency}%`,
                  borderColor: dotColor,
                  background: dotColor,
                  boxShadow: `0 0 0 4px color-mix(in srgb, ${dotColor} 28%, transparent), 0 2px 10px rgba(0,0,0,0.4)`,
                }}
                title={`Urgent ${placement.urgency}, important ${placement.importance}`}
              />
            </div>
            <div className="gov-eisenhower-axis-x" aria-hidden>
              <span>Less important</span>
              <span>More important</span>
            </div>
          </div>
          <div className="gov-eisenhower-axis-y-ticks" aria-hidden>
            <span>More</span>
            <span>Less</span>
          </div>
        </div>
      </div>

      <div className="gov-eisenhower-verdict">
        <Flex fillWidth gap="12" wrap vertical="center" horizontal="between">
          <Flex gap="8" vertical="center" wrap>
            <Tag
              size="s"
              variant={QUADRANT_TAG[placement.quadrant]}
              label={placement.quadrantLabel}
            />
            <Text variant="body-default-xs" onBackground="neutral-weak">
              This alert
            </Text>
          </Flex>
          <Flex gap="16" wrap>
            <Column gap="2" horizontal="center">
              <Text variant="label-default-xs" onBackground="neutral-weak">
                Urgent
              </Text>
              <Heading
                variant="heading-strong-s"
                className="gov-kpi-value"
                style={{ color: scoreColor(placement.urgency) }}
              >
                {placement.urgency}
              </Heading>
            </Column>
            <Column gap="2" horizontal="center">
              <Text variant="label-default-xs" onBackground="neutral-weak">
                Important
              </Text>
              <Heading variant="heading-strong-s" className="gov-kpi-value" style={{ color: "#38bdf8" }}>
                {placement.importance}
              </Heading>
            </Column>
          </Flex>
        </Flex>
        <Text variant="body-default-s" onBackground="neutral-weak">
          {placement.quadrantHint}
        </Text>
      </div>
    </>
  );
}

export function EisenhowerMatrix({
  alert,
  compact = false,
  embedded = false,
  className = "",
}: EisenhowerMatrixProps) {
  const placement = useMemo(() => getEisenhowerPlacement(alert), [alert]);

  const body = <EisenhowerChart alert={alert} />;

  if (compact) {
    return (
      <Column
        fillWidth
        gap="12"
        padding="16"
        radius="m"
        background="surface"
        border="surface"
        className={`gov-panel gov-eisenhower gov-eisenhower--compact${className ? ` ${className}` : ""}`}
        aria-label={`Eisenhower matrix: ${placement.quadrantLabel}`}
      >
        <Text variant="label-default-s" onBackground="brand-weak">
          Eisenhower matrix
        </Text>
        {body}
      </Column>
    );
  }

  if (embedded) {
    return (
      <Column
        fillWidth
        gap="16"
        className={`gov-eisenhower gov-eisenhower--embedded${className ? ` ${className}` : ""}`}
        aria-label={`Eisenhower matrix: ${placement.quadrantLabel}`}
      >
        {body}
      </Column>
    );
  }

  return (
    <Panel
      title="Eisenhower matrix"
      subtitle="Urgent from threat score · important from WA agency impact"
      padding="20"
      className={className ? `gov-eisenhower-panel ${className}` : "gov-eisenhower-panel"}
    >
      {body}
    </Panel>
  );
}
