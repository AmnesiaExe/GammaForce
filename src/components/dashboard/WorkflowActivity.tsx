"use client";

import {
  Column,
  Flex,
  Grid,
  Heading,
  Text,
  Timeline,
} from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { ACTIVITY_FEED, WORKFLOW_COUNTS } from "@/data/metrics";
import { AlertStatus } from "@/lib/scoring";

const STAGES: AlertStatus[] = [
  "New",
  "Triaging",
  "In progress",
  "Blocked",
  "Resolved",
];

export function WorkflowActivity() {
  return (
    <Grid columns="2" gap="16" fillWidth m={{ columns: "1" }}>
      <Panel title="Workflow pipeline" subtitle="Cases by response stage">
        <Flex gap="12" fillWidth wrap>
          {STAGES.map((stage) => (
            <Column
              key={stage}
              padding="16"
              gap="8"
              background="neutral-weak"
              border="neutral-alpha-weak"
              radius="m"
              horizontal="center"
              className="gov-workflow-tile"
            >
              <Text variant="label-default-xs" onBackground="neutral-weak">
                {stage}
              </Text>
              <Heading variant="heading-strong-m" className="gov-kpi-value">
                {WORKFLOW_COUNTS[stage]}
              </Heading>
            </Column>
          ))}
        </Flex>
        <Timeline
          direction="row"
          size="xs"
          fillWidth
          items={STAGES.map((stage) => ({
            label: stage,
            state:
              stage === "In progress"
                ? "active"
                : stage === "Blocked"
                  ? "danger"
                  : stage === "Resolved"
                    ? "success"
                    : "default",
          }))}
        />
      </Panel>

      <Panel title="Operations activity log" subtitle="Recent SOC events and system actions">
        <Timeline
          size="s"
          items={ACTIVITY_FEED.map((item) => ({
            label: (
              <Flex gap="8" vertical="center">
                <Text variant="label-default-xs" onBackground="neutral-weak">
                  {item.time}
                </Text>
                <Text variant="label-strong-s">{item.label}</Text>
              </Flex>
            ),
            description: item.description,
            state: item.state,
          }))}
        />
      </Panel>
    </Grid>
  );
}
