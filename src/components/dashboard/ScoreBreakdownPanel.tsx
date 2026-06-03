"use client";

import { Column, Flex, Heading, Line, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AlertItem } from "@/lib/scoring";
import { formatPercent, weightLabel } from "@/lib/prioritisation";

function FactorRow({
  label,
  weight,
  value,
  detail,
}: {
  label: string;
  weight: string;
  value: number;
  detail?: string;
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
          {pct}%
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
            width: `${pct}%`,
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

  return (
    <Panel
      title="Prioritisation score model"
      subtitle="Qualitative context converted to quantitative factors (cyber economics)"
    >
      <Column gap="16" fillWidth>
        <Column gap="8" padding="16" background="neutral-weak" radius="m" border="neutral-alpha-weak">
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Composite priority score
          </Text>
          <Heading variant="display-strong-s" className="gov-kpi-value">
            {formatPercent(b.priorityScore)}
          </Heading>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Drives severity band and queue ordering
          </Text>
        </Column>

        <FactorRow
          label="Technical risk"
          weight={weightLabel("technical")}
          value={b.technical}
          detail="CVSS, exploitability, asset exposure, business impact"
        />
        <FactorRow
          label="Source credibility"
          weight={weightLabel("sourceCredibility")}
          value={b.sourceCredibility}
          detail={`${b.sourceLabel} rated ${b.sourceReputationPercent}/100 for this issue type`}
        />
        <FactorRow
          label="Agency exposure"
          weight={weightLabel("agencyExposure")}
          value={b.agencyExposure}
          detail={`${b.agencyCount} agencies affected. Same issue across many agencies increases statewide priority.`}
        />
        <FactorRow
          label="Context signals"
          weight={weightLabel("contextSignals")}
          value={b.contextSignals}
          detail="KEV listing, active exploitation, SLA pressure, IOC volume, related incidents"
        />

        <Line background="neutral-alpha-weak" />

        <Column gap="8" fillWidth>
          <Text variant="label-default-s" onBackground="neutral-weak">
            Affected agencies ({b.agencyCount})
          </Text>
          <Flex gap="8" wrap fillWidth>
            {b.affectedAgencyNames.map((name) => (
              <Tag key={name} variant="neutral" size="s" label={name} />
            ))}
          </Flex>
        </Column>
      </Column>
    </Panel>
  );
}
