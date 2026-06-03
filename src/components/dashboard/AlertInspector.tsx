"use client";

import {
  Column,
  Flex,
  Heading,
  LinearGauge,
  Line,
  Tag,
  Text,
} from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import {
  AlertItem,
  formatSla,
  severityTagVariant,
  statusTagVariant,
} from "@/lib/scoring";
import { formatPercent, weightLabel } from "@/lib/prioritisation";

function FactorBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <Column gap="8" fillWidth>
      <Flex horizontal="between" fillWidth>
        <Text variant="label-default-xs" onBackground="neutral-weak">
          {label}
        </Text>
        <Text variant="label-default-xs" className="gov-kpi-value">
          {value}/{max}
        </Text>
      </Flex>
      <div className="gov-factor-track">
        <div
          className="gov-factor-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </Column>
  );
}

interface AlertInspectorProps {
  alert: AlertItem | null;
}

export function AlertInspector({ alert }: AlertInspectorProps) {
  if (!alert) {
    return (
      <Panel
        title="Case inspector"
        subtitle="Select an alert from the register to review scoring and response guidance"
        fillHeight
      >
        <Text variant="body-default-s" onBackground="neutral-weak">
          The inspector displays CVSS and contextual factors, SLA position,
          enrichment metadata, analyst notes, and the recommended government
          response sequence for the selected case.
        </Text>
      </Panel>
    );
  }

  const slaBreached = alert.slaHoursRemaining <= 0;
  const b = alert.scoreBreakdown;
  const meta: [string, string][] = [
    ["Intelligence source", `${b.sourceLabel} (${b.sourceReputationPercent}/100)`],
    ["Agencies affected", String(b.agencyCount)],
    ["Source", alert.source],
    ["Category", alert.category],
    ["Environment", alert.environment],
    ["Assigned analyst", alert.assignee],
    ["Received", alert.receivedDisplay],
    ["Affected assets", alert.affectedAssets],
    ["IOCs attached", String(alert.iocCount)],
    ["Related incidents", String(alert.relatedIncidents)],
    ["SLA position", slaBreached ? "Breached" : formatSla(alert.slaHoursRemaining)],
  ];

  return (
    <Panel title="Case inspector" subtitle={alert.id} fillHeight>
      <Column gap="20" fillWidth>
        <Column gap="12" fillWidth>
          <Flex gap="8" wrap vertical="center">
            <Tag
              variant={severityTagVariant(alert.severity)}
              size="s"
              label={alert.severity}
            />
            <Tag
              variant={statusTagVariant(alert.status)}
              size="s"
              label={alert.status}
            />
            {alert.kevListed && <Tag variant="danger" size="s" label="KEV" />}
          </Flex>
          <Heading variant="heading-strong-s">{alert.title}</Heading>
        </Column>

        <Column gap="8" fillWidth padding="16" background="neutral-weak" radius="m" border="neutral-alpha-weak">
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Priority score (composite)
          </Text>
          <LinearGauge
            value={Math.round(alert.compositeScore * 100)}
            labels="percentage"
            hue={
              alert.severity === "Critical" || alert.severity === "High"
                ? "danger"
                : "neutral"
            }
            height={8}
            fillWidth
          />
        </Column>

        <Column gap="12" fillWidth>
          <Text variant="label-default-s" onBackground="neutral-weak">
            Prioritisation model
          </Text>
          <FactorBar
            label={`Vulnerability score (${weightLabel("vulnerabilityDomains")})`}
            value={Math.round(b.domainScores.final_score)}
            max={100}
            color="var(--danger-solid)"
          />
          <FactorBar
            label={`WA agency impact (${weightLabel("agencyImpact")})`}
            value={Math.round(b.agencyExposure * 100)}
            max={100}
            color="var(--brand-solid)"
          />
          <FactorBar
            label="Source credibility"
            value={Math.round(b.sourceCredibility * 100)}
            max={100}
            color="var(--warning-solid)"
          />
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Statewide priority {formatPercent(b.priorityScore)} · {b.cyberRiskLevel} ·{" "}
            {b.agencyCount} agencies
          </Text>
          {b.agencyRanking[0] && (
            <Text variant="body-default-xs" onBackground="brand-weak">
              Patch #{b.agencyRanking[0].rank} first: {b.agencyRanking[0].agency.name}
            </Text>
          )}
        </Column>

        <Column gap="12" fillWidth>
          <Text variant="label-default-s" onBackground="neutral-weak">
            Technical inputs
          </Text>
          <FactorBar label="CVSS base" value={alert.cvss} max={10} color="var(--danger-solid)" />
          <FactorBar label="Exploitability" value={alert.exploitability} max={5} color="var(--warning-solid)" />
          <FactorBar label="Asset exposure" value={alert.assetExposure} max={5} color="var(--brand-solid)" />
          <FactorBar label="Business impact" value={alert.businessImpact} max={5} color="var(--accent-solid)" />
        </Column>

        <Line background="neutral-alpha-weak" />

        <Column gap="4" fillWidth>
          <Text variant="label-default-s" onBackground="neutral-weak">
            Case metadata
          </Text>
          {meta.map(([label, value]) => (
            <div key={label} className="gov-meta-row">
              <Text variant="label-default-xs" onBackground="neutral-weak">
                {label}
              </Text>
              <Text
                variant="body-default-xs"
                onBackground={label === "SLA position" && slaBreached ? "danger-weak" : undefined}
              >
                {value}
              </Text>
            </div>
          ))}
        </Column>

        <Line background="neutral-alpha-weak" />

        <Column gap="8" fillWidth>
          <Text variant="label-default-s" onBackground="brand-weak">
            Recommended response
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak">
            {alert.recommendedAction}
          </Text>
        </Column>

        <Column gap="8" fillWidth>
          <Text variant="label-default-s" onBackground="neutral-weak">
            Analyst notes
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak">
            {alert.analystNotes}
          </Text>
        </Column>
      </Column>
    </Panel>
  );
}
