"use client";

import { useMemo } from "react";
import { Column, Flex, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import {
  buildThreatProgression,
  timelineSummary,
  ThreatProgressionStage,
} from "@/lib/threatProgression";
import { IncidentIntelligence } from "@/lib/incidentIntelligence";
import { AlertItem, statusTagVariant } from "@/lib/scoring";
import { scoreColorHex } from "@/lib/riskColors";

function stateClass(state: string) {
  switch (state) {
    case "danger":
      return "gov-threat-stage--danger";
    case "active":
      return "gov-threat-stage--active";
    case "done":
      return "gov-threat-stage--done";
    case "skipped":
      return "gov-threat-stage--skipped";
    default:
      return "gov-threat-stage--upcoming";
  }
}

function statusTagVariantFor(
  state: string,
): "success" | "warning" | "danger" | "neutral" {
  if (state === "done") return "success";
  if (state === "danger") return "danger";
  if (state === "active") return "warning";
  return "neutral";
}

function connectorClass(stage: ThreatProgressionStage, next?: ThreatProgressionStage) {
  if (stage.state === "skipped" || next?.state === "skipped") {
    return "gov-threat-stage-line--skipped";
  }
  if (stage.state === "done") return "gov-threat-stage-line--done";
  return "";
}

interface ThreatProgressionTimelineProps {
  alert: AlertItem;
  intel: IncidentIntelligence;
  aiDisregardReason?: string;
}

export function ThreatProgressionTimeline({
  alert,
  intel,
  aiDisregardReason,
}: ThreatProgressionTimelineProps) {
  const stages = useMemo(
    () => buildThreatProgression(alert, intel, { aiDisregardReason }),
    [alert, intel, aiDisregardReason],
  );

  const summary = useMemo(() => timelineSummary(stages), [stages]);

  return (
    <Panel
      title="Threat progression"
      subtitle={`${summary.done} of ${summary.applicable} steps complete · ${summary.skipped} not relevant · ${alert.status.toLowerCase()}`}
      padding="20"
    >
      <Flex gap="8" wrap vertical="center" className="gov-threat-timeline-head">
        <Tag size="s" variant={statusTagVariant(alert.status)} label={alert.status} />
        <Text variant="body-default-xs" onBackground="neutral-weak">
          Steps that do not apply to this incident are omitted from the active path.
        </Text>
      </Flex>

      <ol className="gov-threat-timeline" aria-label="Threat progression timeline">
        {stages.map((stage, i) => {
          const next = stages[i + 1];
          const isLast = i === stages.length - 1;
          const lineClass = connectorClass(stage, next);

          return (
            <li
              key={stage.id}
              className={`gov-threat-stage ${stateClass(stage.state)}${stage.state === "active" || stage.state === "danger" ? " gov-threat-stage--current" : ""}`}
            >
              <div className="gov-threat-stage-rail">
                <span className="gov-threat-stage-dot" aria-hidden />
                {!isLast && (
                  <span className={`gov-threat-stage-line ${lineClass}`.trim()} aria-hidden />
                )}
              </div>
              <Column gap="4" flex={1} className="gov-threat-stage-body">
                <Flex gap="8" wrap vertical="center" horizontal="between" fillWidth>
                  <Text
                    variant="label-strong-s"
                    className={
                      stage.state === "skipped"
                        ? "gov-threat-stage-label--skipped"
                        : undefined
                    }
                  >
                    {stage.label}
                  </Text>
                  <Tag
                    size="s"
                    variant={statusTagVariantFor(stage.state)}
                    label={stage.statusLabel}
                  />
                </Flex>
                <Text variant="label-default-xs" onBackground="neutral-weak">
                  {stage.time}
                </Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  {stage.state === "skipped" && stage.skipReason
                    ? stage.skipReason
                    : stage.detail}
                </Text>
                {stage.score !== undefined && (
                  <Text
                    variant="label-default-xs"
                    style={{ color: scoreColorHex(stage.score) }}
                  >
                    Score {stage.score}
                  </Text>
                )}
              </Column>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
