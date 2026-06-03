"use client";

import { Column, Flex, Heading, Row, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AlertItem } from "@/lib/scoring";
import { scoreColor } from "@/lib/riskColors";

interface ThreatAnalysisViewProps {
  alert: AlertItem | null;
  showHeader?: boolean;
}

export function ThreatAnalysisView({ alert, showHeader = true }: ThreatAnalysisViewProps) {
  if (!alert) {
    return (
      <Panel title="Threat analysis" subtitle="Pick a threat above">
        <Text variant="body-default-s" onBackground="neutral-weak">
          Use the dropdown or Previous / Next to choose an item from the list.
        </Text>
      </Panel>
    );
  }

  const ex = alert.scoreBreakdown.explanation;
  const threatScore = alert.scoreBreakdown.domainScores.final_score;
  const priorityPct = Math.round(alert.compositeScore * 100);

  return (
    <Column gap="16" fillWidth>
      {showHeader && (
        <Panel title={alert.title} subtitle={alert.id}>
          <Row fillWidth gap="16" wrap>
            <Column gap="8" flex={1} style={{ minWidth: "12rem" }}>
              <Text variant="label-default-xs" onBackground="neutral-weak">
                Threat score (how serious)
              </Text>
              <Heading variant="display-strong-s" style={{ color: scoreColor(threatScore) }}>
                {threatScore}
              </Heading>
            </Column>
            <Column gap="8" flex={1} style={{ minWidth: "12rem" }}>
              <Text variant="label-default-xs" onBackground="neutral-weak">
                Prioritisation (act now?)
              </Text>
              <Heading variant="display-strong-s" style={{ color: scoreColor(priorityPct) }}>
                {priorityPct}
              </Heading>
              <Flex gap="8" wrap>
                <Tag variant="danger" size="s" label={alert.severity} />
                <Tag variant="neutral" size="s" label={`${alert.agencyCount} agencies`} />
              </Flex>
            </Column>
          </Row>
        </Panel>
      )}

      <Panel title="Why this threat scores high" subtitle="What drives the threat score number">
        <Column gap="12" fillWidth>
          <Text variant="body-default-s">{ex.summary}</Text>
          {ex.reasons.map((r) => (
            <Flex key={r} gap="8">
              <div className="gov-status-dot gov-status-dot--danger" />
              <Text variant="body-default-s">{r}</Text>
            </Flex>
          ))}
          <Text variant="body-default-s" onBackground="brand-weak">
            {ex.recommendation}
          </Text>
        </Column>
      </Panel>
    </Column>
  );
}
