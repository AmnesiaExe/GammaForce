"use client";

import { useMemo } from "react";
import { Column, Flex, Line, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AlertItem, SEVERITY_ORDER, severityTagVariant } from "@/lib/scoring";

interface PrioritisedActionsProps {
  items: AlertItem[];
}

export function PrioritisedActions({ items }: PrioritisedActionsProps) {
  const ranked = useMemo(
    () =>
      [...items]
        .sort(
          (a, b) =>
            SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
            b.compositeScore - a.compositeScore,
        )
        .slice(0, 5),
    [items],
  );

  return (
    <Panel
      title="Prioritised response actions"
      subtitle="Recommended next steps ordered by composite risk"
    >
      <Column gap="16" fillWidth>
        {ranked.map((item, index) => (
          <Column key={item.id} gap="12" fillWidth>
            <Flex gap="12" fillWidth>
              <div className="gov-action-rank">{index + 1}</div>
              <Column gap="8" fillWidth>
                <Flex gap="8" wrap vertical="center">
                  <Tag
                    variant={severityTagVariant(item.severity)}
                    size="s"
                    label={item.severity}
                  />
                  <Text variant="label-default-xs" onBackground="neutral-weak">
                    {item.id}
                  </Text>
                </Flex>
                <Text variant="label-strong-s">{item.title}</Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  {item.recommendedAction}
                </Text>
              </Column>
            </Flex>
            {index < ranked.length - 1 && (
              <Line background="neutral-alpha-weak" />
            )}
          </Column>
        ))}
      </Column>
    </Panel>
  );
}
