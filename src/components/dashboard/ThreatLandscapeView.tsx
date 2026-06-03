"use client";

import { type MouseEvent, useMemo, useState } from "react";
import { Button, Column, Flex, Grid, Heading, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { ExposureNetworkGraph } from "@/components/dashboard/ExposureNetworkGraph";
import { ALERTS } from "@/data/alerts";
import { TRIAGE_STATS } from "@/data/generatedAlerts";
import { triageKpiTiles } from "@/data/triageCopy";
import { AlertItem, severityTagVariant } from "@/lib/scoring";
import { formatPercent } from "@/lib/prioritisation";

interface ThreatLandscapeViewProps {
  items: AlertItem[];
  onOpenAdvisory: (id: string) => void;
}

export function ThreatLandscapeView({ items, onOpenAdvisory }: ThreatLandscapeViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const top = useMemo(() => items.slice(0, 8), [items]);
  const s = TRIAGE_STATS;

  return (
    <Column gap="24" fillWidth>
      <Panel
        title="Statewide overview"
        subtitle="Priority snapshot. Open an alert from the queue for scores and agency order."
      >
        <Text variant="body-default-s" onBackground="neutral-weak">
          Full analysis is in the side panel. From{" "}
          <Text as="span" variant="label-strong-s">
            AI Triage
          </Text>
          , click a row and choose Open details.
        </Text>
      </Panel>

      <Grid columns="4" gap="16" fillWidth l={{ columns: "2" }} s={{ columns: "2" }}>
        <Column gap="4" padding="16" background="neutral-weak" radius="m" border="neutral-alpha-weak">
          <Text variant="label-default-xs" onBackground="neutral-weak">
            In this view (top priorities)
          </Text>
          <Heading variant="heading-strong-l">{items.length}</Heading>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Short list only, not the full {s.threatsAnalysed.toLocaleString()} in WASOC
          </Text>
        </Column>
        {triageKpiTiles(s).slice(1).map((tile) => (
          <Column
            key={tile.label}
            gap="4"
            padding="16"
            background="neutral-weak"
            radius="m"
            border="neutral-alpha-weak"
          >
            <Text variant="label-default-xs" onBackground="neutral-weak">
              {tile.label}
            </Text>
            <Heading
              variant="heading-strong-l"
              style={"accent" in tile ? { color: tile.accent } : undefined}
            >
              {tile.value}
            </Heading>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {tile.sub}
            </Text>
          </Column>
        ))}
      </Grid>

      <Panel title="Highest priority right now" subtitle="Click to open full analysis in the side panel">
        <Column gap="8" fillWidth>
          {top.map((alert) => (
            <Flex
              key={alert.id}
              fillWidth
              horizontal="between"
              vertical="center"
              wrap
              gap="12"
              padding="12"
              radius="m"
              background="neutral-weak"
              border="neutral-alpha-weak"
              className="gov-advisory-row-clickable"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setSelectedId(alert.id);
                onOpenAdvisory(alert.id);
              }}
            >
              <Column gap="4" style={{ minWidth: 0, flex: 1 }}>
                <Text variant="label-strong-s">{alert.title}</Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  {alert.id} · {alert.agencyCount} agencies · priority{" "}
                  {formatPercent(alert.compositeScore)}
                </Text>
              </Column>
              <Flex gap="8" vertical="center" wrap>
                <Tag size="s" variant={severityTagVariant(alert.severity)} label={alert.severity} />
                <Button
                  size="s"
                  variant="secondary"
                  label="Open"
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    setSelectedId(alert.id);
                    onOpenAdvisory(alert.id);
                  }}
                />
              </Flex>
            </Flex>
          ))}
        </Column>
      </Panel>

      <ExposureNetworkGraph
        items={ALERTS}
        selectedId={selectedId}
        onSelectAlert={(id) => {
          setSelectedId(id);
          onOpenAdvisory(id);
        }}
      />
    </Column>
  );
}
