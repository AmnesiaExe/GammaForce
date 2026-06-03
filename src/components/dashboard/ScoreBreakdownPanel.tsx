"use client";

import { Column, Flex, Heading, Line, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AlertItem } from "@/lib/scoring";
import {
  DOMAIN_LABELS,
  DOMAIN_WEIGHTS,
  formatPercent,
  weightLabel,
} from "@/lib/prioritisation";
import { scoreColor } from "@/lib/riskColors";

function FactorRow({
  label,
  weight,
  value,
  detail,
  valueDisplay,
}: {
  label: string;
  weight: string;
  value: number;
  detail?: string;
  valueDisplay?: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <Column gap="8" fillWidth>
      <Flex horizontal="between" fillWidth wrap gap="8">
        <Column gap="4">
          <Text variant="label-strong-s">{label}</Text>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Weight {weight}
          </Text>
        </Column>
        <Text variant="heading-strong-s" className="gov-kpi-value">
          {valueDisplay ?? `${pct}%`}
        </Text>
      </Flex>
      {detail && (
        <Text variant="body-default-xs" onBackground="neutral-weak">
          {detail}
        </Text>
      )}
      <div className="gov-factor-track">
        <div
          className="gov-factor-fill"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: "var(--brand-solid)",
          }}
        />
      </div>
    </Column>
  );
}

interface ScoreBreakdownPanelProps {
  alert: AlertItem | null;
}

export function ScoreBreakdownPanel({ alert }: ScoreBreakdownPanelProps) {
  if (!alert) return null;

  const b = alert.scoreBreakdown;
  const d = b.domainScores;

  return (
    <Panel
      title="Ranking score model"
      subtitle="CyberPriority vulnerability domains + WA agency criticality (main system)"
    >
      <Column gap="16" fillWidth>
        <Column gap="8" padding="16" background="neutral-weak" radius="m" border="neutral-alpha-weak">
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Statewide priority score
          </Text>
          <Heading variant="display-strong-s" className="gov-kpi-value">
            {formatPercent(b.priorityScore)}
          </Heading>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Vulnerability {d.final_score}/100 ({b.cyberRiskLevel}) × agency impact
          </Text>
        </Column>

        <FactorRow
          label="Vulnerability domains"
          weight={weightLabel("vulnerabilityDomains")}
          value={d.final_score / 100}
          valueDisplay={`${d.final_score}/100`}
          detail={`Exploitability ${d.exploitability}%, exposure ${d.exposure}%, asset ${d.asset_impact}%`}
        />

        <FactorRow
          label="WA agency impact"
          weight={weightLabel("agencyImpact")}
          value={b.agencyExposure}
          detail={`${b.agencyCount} agencies · Tier 1 concentration ${Math.round(b.agencyImpact.tier1Share * 100)}% · peak weight ${Math.round(b.agencyImpact.maxCriticality * 100)}%`}
        />

        <Line background="neutral-alpha-weak" />

        <Text variant="label-default-s" onBackground="neutral-weak">
          Domain weights (vulnerability layer)
        </Text>
        {(Object.keys(DOMAIN_LABELS) as (keyof typeof DOMAIN_LABELS)[]).map((key) => (
          <Flex key={key} horizontal="between" fillWidth>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {DOMAIN_LABELS[key]} ({Math.round(DOMAIN_WEIGHTS[key] * 100)}%)
            </Text>
            <Text variant="label-default-xs" style={{ color: scoreColor(d[key]) }}>
              {d[key]}%
            </Text>
          </Flex>
        ))}

        <Line background="neutral-alpha-weak" />

        <Column gap="8" fillWidth>
          <Text variant="label-default-s" onBackground="neutral-weak">
            Top agencies to action first
          </Text>
          <Flex gap="8" wrap fillWidth>
            {b.agencyRanking.slice(0, 5).map((entry) => (
              <Tag
                key={entry.agencyId}
                variant="neutral"
                size="s"
                label={`#${entry.rank} ${entry.agency.name}`}
              />
            ))}
          </Flex>
        </Column>
      </Column>
    </Panel>
  );
}
