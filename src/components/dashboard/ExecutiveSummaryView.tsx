"use client";

import { useMemo } from "react";
import { Column, Flex, Heading, Line, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { ALERTS } from "@/data/alerts";
import { WA_AGENCY_COUNT } from "@/data/waAgencies";
import { cyberRiskLevel } from "@/lib/cyberPriorityScoring";
import { scoreColor } from "@/lib/riskColors";

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Column
      gap="8"
      padding="16"
      background="surface"
      radius="m"
      border="neutral-alpha-weak"
      style={{ borderTop: `2px solid ${color}`, flex: 1, minWidth: "8rem" }}
    >
      <Text variant="label-default-xs" onBackground="neutral-weak">
        {label}
      </Text>
      <Heading variant="display-strong-s" className="gov-kpi-value" style={{ color }}>
        {value}
      </Heading>
      {sub && (
        <Text variant="body-default-xs" onBackground="neutral-weak">
          {sub}
        </Text>
      )}
    </Column>
  );
}

export function ExecutiveSummaryView() {
  const summary = useMemo(() => {
    const scores = ALERTS.map((a) => a.scoreBreakdown.domainScores.final_score);
    const levels = scores.map((s) => cyberRiskLevel(s));
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const multiAgency = ALERTS.filter((a) => a.agencyCount >= 3).length;

    return {
      total: ALERTS.length,
      critical: levels.filter((l) => l === "CRITICAL").length,
      high: levels.filter((l) => l === "HIGH").length,
      medium: levels.filter((l) => l === "MEDIUM").length,
      low: levels.filter((l) => l === "LOW").length,
      average: Math.round(avg * 10) / 10,
      multiAgency,
      system_status:
        levels.some((l) => l === "CRITICAL" || l === "HIGH")
          ? "ELEVATED RISK"
          : "NORMAL",
    };
  }, []);

  const actionPlan = useMemo(
    () =>
      [...ALERTS]
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, 4)
        .map((a, i) => ({
          num: String(i + 1).padStart(2, "0"),
          text: `${a.title} — ${a.scoreBreakdown.agencyRanking[0]?.agency.name ?? "WA agencies"} first.`,
          window: `${a.scoreBreakdown.cyberRiskLevel} · ${a.recommendedAction.slice(0, 80)}…`,
        })),
    [],
  );

  return (
    <Column gap="16" fillWidth>
      <Column
        gap="8"
        padding="16"
        background="danger-weak"
        radius="m"
        border="danger-alpha-medium"
      >
        <Flex gap="8" vertical="center">
          <div className="gov-status-dot gov-status-dot--danger" />
          <Text variant="label-strong-s" onBackground="danger-strong">
            {summary.system_status}
          </Text>
        </Flex>
        <Text variant="body-default-s" onBackground="neutral-weak">
          {summary.critical > 0
            ? "Immediate remediation required for CRITICAL vulnerabilities across WA state agencies."
            : "Continue scheduled patching; monitor multi-agency exposure."}{" "}
          Register covers {WA_AGENCY_COUNT} agencies.
        </Text>
      </Column>

      <Flex gap="12" wrap fillWidth>
        <MetricCard label="Critical" value={summary.critical} color="var(--danger-solid)" sub="Immediate" />
        <MetricCard label="High" value={summary.high} color="var(--warning-solid)" sub="Within 24h" />
        <MetricCard label="Multi-agency" value={summary.multiAgency} color="var(--brand-solid)" sub="3+ agencies" />
        <MetricCard label="Avg vuln score" value={summary.average} color={scoreColor(summary.average)} sub="0–100 scale" />
      </Flex>

      <Panel title="Prioritised action plan" subtitle="Ordered by statewide ranking engine">
        <Column gap="12" fillWidth>
          {actionPlan.map((a) => (
            <Column key={a.num} gap="8" fillWidth>
              <Flex gap="12" vertical="start">
                <Text variant="label-strong-s" onBackground="brand-weak">
                  {a.num}
                </Text>
                <Column gap="4">
                  <Text variant="body-default-s">{a.text}</Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak">
                    {a.window}
                  </Text>
                </Column>
              </Flex>
              <Line background="neutral-alpha-weak" />
            </Column>
          ))}
        </Column>
      </Panel>
    </Column>
  );
}
