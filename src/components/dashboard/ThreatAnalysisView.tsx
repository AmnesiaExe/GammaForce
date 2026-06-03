"use client";

import { Column, Flex, Heading, Line, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AlertItem } from "@/lib/scoring";
import { DOMAIN_LABELS } from "@/lib/prioritisation";
import { scoreColor } from "@/lib/riskColors";

interface ThreatAnalysisViewProps {
  alert: AlertItem | null;
}

function DomainBar({ label, value }: { label: string; value: number }) {
  return (
    <Column gap="8" fillWidth>
      <Flex horizontal="between" fillWidth>
        <Text variant="label-default-xs" onBackground="neutral-weak">
          {label}
        </Text>
        <Text variant="label-default-xs" style={{ color: scoreColor(value) }}>
          {value}%
        </Text>
      </Flex>
      <div className="gov-factor-track">
        <div
          className="gov-factor-fill"
          style={{ width: `${value}%`, background: scoreColor(value) }}
        />
      </div>
    </Column>
  );
}

export function ThreatAnalysisView({ alert }: ThreatAnalysisViewProps) {
  if (!alert) {
    return (
      <Panel title="Threat analysis" subtitle="CyberPriority 25-signal model">
        <Text variant="body-default-s" onBackground="neutral-weak">
          Select an alert from the queue to run deep analysis.
        </Text>
      </Panel>
    );
  }

  const d = alert.scoreBreakdown.domainScores;
  const ex = alert.scoreBreakdown.explanation;

  return (
    <Column gap="16" fillWidth>
      <Panel title="Threat analysis" subtitle={`${alert.id} — 5-domain vulnerability scoring`}>
        <Column gap="16" fillWidth>
          <Flex gap="16" wrap vertical="end">
            <Heading
              variant="display-strong-s"
              className="gov-kpi-value"
              style={{ color: scoreColor(d.final_score) }}
            >
              {d.final_score}
            </Heading>
            <Tag variant="danger" size="m" label={alert.scoreBreakdown.cyberRiskLevel} />
            <Text variant="body-default-s" onBackground="neutral-weak">
              Combined statewide priority {Math.round(alert.compositeScore * 100)}%
            </Text>
          </Flex>

          {(Object.keys(DOMAIN_LABELS) as (keyof typeof DOMAIN_LABELS)[]).map((key) => (
            <DomainBar key={key} label={DOMAIN_LABELS[key]} value={d[key]} />
          ))}
        </Column>
      </Panel>

      <Panel title="AI reasoning" subtitle="Rule-based explanation from raw signals">
        <Column gap="12" fillWidth>
          <Text variant="body-default-s" onBackground="neutral-weak">
            {ex.summary}
          </Text>
          <Line background="neutral-alpha-weak" />
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Risk factors
          </Text>
          {ex.reasons.map((r) => (
            <Flex key={r} gap="8">
              <div className="gov-status-dot gov-status-dot--danger" />
              <Text variant="body-default-s">{r}</Text>
            </Flex>
          ))}
          {ex.mitigations.length > 0 && (
            <>
              <Text variant="label-default-xs" onBackground="neutral-weak">
                Mitigations
              </Text>
              {ex.mitigations.map((m) => (
                <Flex key={m} gap="8">
                  <div className="gov-status-dot gov-status-dot--success" />
                  <Text variant="body-default-s">{m}</Text>
                </Flex>
              ))}
            </>
          )}
          <Column gap="8" padding="12" background="neutral-weak" radius="m" border="brand-alpha-weak">
            <Text variant="body-default-s">{ex.recommendation}</Text>
          </Column>
        </Column>
      </Panel>
    </Column>
  );
}
