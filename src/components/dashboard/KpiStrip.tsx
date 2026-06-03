"use client";

import { Column, Flex, Grid, Heading, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { OPS_METRICS } from "@/data/metrics";
import { ALERTS } from "@/data/alerts";
import { Severity, severityStripColor } from "@/lib/scoring";

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

function countSeverity(severity: Severity) {
  return ALERTS.filter((a) => a.severity === severity).length;
}

export function KpiStrip() {
  const kpis = [
    { label: "Mean time to triage", value: `${OPS_METRICS.meanTimeToTriageHours}h`, sub: "7-day rolling average" },
    { label: "SLA at risk", value: String(OPS_METRICS.slaAtRisk), sub: "Requires action within 24h" },
    { label: "KEV catalogue matches", value: String(OPS_METRICS.kevOpen), sub: "Known exploited vulnerabilities" },
    { label: "Internet-exposed assets", value: String(OPS_METRICS.internetExposed), sub: "In active assessment scope" },
    { label: "Agencies in scope", value: String(OPS_METRICS.agenciesAffected), sub: "Cross-agency correlation" },
    { label: "Auto-enriched alerts", value: `${OPS_METRICS.autoEnrichedPercent}%`, sub: "Normalised from source feeds" },
  ];

  return (
    <Column gap="16" fillWidth>
      <Panel title="Operational metrics" subtitle="Live indicators for the current reporting period">
        <Grid columns="6" gap="16" fillWidth l={{ columns: "3" }} s={{ columns: "2" }}>
          {kpis.map((kpi) => (
            <Column
              key={kpi.label}
              padding="16"
              gap="8"
              background="neutral-weak"
              border="neutral-alpha-weak"
              radius="m"
              fillWidth
            >
              <Text variant="label-default-xs" onBackground="neutral-weak">
                {kpi.label}
              </Text>
              <Heading variant="heading-strong-l" className="gov-kpi-value">
                {kpi.value}
              </Heading>
              <Text variant="body-default-xs" onBackground="neutral-weak">
                {kpi.sub}
              </Text>
            </Column>
          ))}
        </Grid>
      </Panel>

      <Panel title="Open alerts by severity" subtitle="Queue composition for prioritisation">
        <Grid columns="4" gap="16" fillWidth s={{ columns: "2" }}>
          {SEVERITIES.map((severity) => (
            <Flex
              key={severity}
              padding="16"
              gap="12"
              background="neutral-weak"
              border="neutral-alpha-weak"
              radius="m"
              vertical="center"
              fillWidth
            >
              <div
                className="gov-severity-accent"
                style={{ background: severityStripColor(severity) }}
              />
              <Column gap="4">
                <Text variant="label-default-xs" onBackground="neutral-weak">
                  {severity}
                </Text>
                <Heading variant="heading-strong-m" className="gov-kpi-value">
                  {countSeverity(severity)}
                </Heading>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  open items
                </Text>
              </Column>
            </Flex>
          ))}
        </Grid>
      </Panel>
    </Column>
  );
}
