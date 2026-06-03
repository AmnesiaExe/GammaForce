"use client";

import { useMemo } from "react";
import {
  BarChart,
  Column,
  Flex,
  Grid,
  Heading,
  LineChart,
  PieChart,
  Text,
} from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { ALERT_VOLUME_TREND, CATEGORY_BREAKDOWN } from "@/data/metrics";
import { AlertItem, matrixBand } from "@/lib/scoring";

function PriorityMatrix({
  items,
  highlightKey,
}: {
  items: AlertItem[];
  highlightKey?: string;
}) {
  const bands = ["Low", "Medium", "High"] as const;
  const matrix = useMemo(() => {
    const grid: Record<string, number> = {};
    for (const exploit of bands) {
      for (const impact of bands) {
        grid[`${exploit}-${impact}`] = 0;
      }
    }
    for (const item of items) {
      const key = `${matrixBand(item.exploitability)}-${matrixBand(item.businessImpact)}`;
      grid[key] = (grid[key] ?? 0) + 1;
    }
    return grid;
  }, [items]);

  return (
    <Column gap="16" fillWidth>
      <Grid columns="4" gap="8" fillWidth>
        <div />
        {bands.map((impact) => (
          <Text
            key={impact}
            variant="label-default-xs"
            onBackground="neutral-weak"
            align="center"
          >
            {impact} impact
          </Text>
        ))}
      </Grid>
      {bands.map((exploit) => (
        <Grid key={exploit} columns="4" gap="8" fillWidth>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            {exploit} exploit
          </Text>
          {bands.map((impact) => {
            const key = `${exploit}-${impact}`;
            const count = matrix[key] ?? 0;
            const active = highlightKey === key;
            const bg =
              count >= 3
                ? "var(--danger-background-weak)"
                : count >= 1
                  ? "var(--warning-background-weak)"
                  : "var(--neutral-background-weak)";

            return (
              <Column
                key={key}
                className={`gov-matrix-cell${active ? " gov-matrix-cell-active" : ""}`}
                padding="12"
                radius="s"
                horizontal="center"
                vertical="center"
                gap="4"
                background="neutral-weak"
                style={{ background: bg }}
              >
                <Heading variant="heading-strong-xs" className="gov-kpi-value">
                  {count}
                </Heading>
                <Text variant="label-default-xs" onBackground="neutral-weak">
                  alerts
                </Text>
              </Column>
            );
          })}
        </Grid>
      ))}
    </Column>
  );
}

interface RiskAnalyticsProps {
  items: AlertItem[];
  highlightMatrixKey?: string;
}

export function RiskAnalytics({ items, highlightMatrixKey }: RiskAnalyticsProps) {
  const severityBars = useMemo(
    () =>
      (["Critical", "High", "Medium", "Low"] as const).map((label) => ({
        label,
        count: items.filter((i) => i.severity === label).length,
      })),
    [items],
  );

  return (
    <Column gap="16" fillWidth>
      <Grid columns="2" gap="16" fillWidth m={{ columns: "1" }}>
        <Panel
          title="Alert volume trend"
          subtitle="Seven-day distribution by severity band"
        >
          <div className="gov-chart-surface">
            <LineChart
              variant="gradient"
              data={ALERT_VOLUME_TREND}
              series={[
                { key: "critical", color: "red" },
                { key: "high", color: "orange" },
                { key: "medium", color: "blue" },
                { key: "low", color: "gray" },
              ]}
              axis="both"
              grid="both"
              tooltip
              legend={{ display: true, position: "top-right", direction: "row" }}
              fillWidth
              minHeight={20}
              animation={false}
              border="neutral-alpha-weak"
            />
          </div>
        </Panel>

        <Panel title="Alert category mix" subtitle="Vulnerability vs threat intelligence">
          <div className="gov-chart-surface">
            <PieChart
              variant="flat"
              data={CATEGORY_BREAKDOWN}
              series={{ key: "value" }}
              legend={{
                display: true,
                position: "bottom-center",
                direction: "row",
              }}
              ring={{ inner: 58, outer: 76 }}
              tooltip
              fillWidth
              minHeight={20}
              border="neutral-alpha-weak"
            />
          </div>
        </Panel>
      </Grid>

      <Grid columns="2" gap="16" fillWidth m={{ columns: "1" }}>
        <Panel title="Current severity distribution" subtitle="Active queue snapshot">
          <div className="gov-chart-surface">
            <BarChart
              variant="gradient"
              data={severityBars}
              series={[{ key: "count", color: "blue" }]}
              axis="x"
              grid="y"
              tooltip
              fillWidth
              minHeight={16}
              border="neutral-alpha-weak"
            />
          </div>
        </Panel>

        <Panel
          title="Risk prioritisation matrix"
          subtitle="Exploitability versus business impact"
        >
          <PriorityMatrix items={items} highlightKey={highlightMatrixKey} />
        </Panel>
      </Grid>
    </Column>
  );
}
