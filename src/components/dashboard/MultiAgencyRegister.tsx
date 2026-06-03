"use client";

import { useMemo } from "react";
import { Column, Flex, Heading, Line, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AlertItem } from "@/lib/scoring";
import { formatPercent } from "@/lib/prioritisation";

interface MultiAgencyRegisterProps {
  items: AlertItem[];
}

export function MultiAgencyRegister({ items }: MultiAgencyRegisterProps) {
  const ranked = useMemo(
    () =>
      [...items]
        .filter((a) => a.agencyCount >= 2)
        .sort((a, b) => b.agencyCount - a.agencyCount || b.compositeScore - a.compositeScore)
        .slice(0, 6),
    [items],
  );

  return (
    <Panel
      title="Cross-agency exposure"
      subtitle="Same issue affecting multiple agencies ranks higher (breadth x agency criticality)"
    >
      <Column gap="12" fillWidth>
        {ranked.length === 0 ? (
          <Text variant="body-default-s" onBackground="neutral-weak">
            No multi-agency issues in the current register.
          </Text>
        ) : (
          ranked.map((item, index) => (
            <Column key={item.id} gap="8" fillWidth>
              <Flex horizontal="between" vertical="center" wrap gap="8" fillWidth>
                <Column gap="4">
                  <Text variant="label-default-xs" onBackground="neutral-weak">
                    {item.id}
                  </Text>
                  <Text variant="label-strong-s">{item.title}</Text>
                </Column>
                <Column gap="4" horizontal="end">
                  <Heading variant="heading-strong-m" className="gov-kpi-value">
                    {item.agencyCount}
                  </Heading>
                  <Text variant="label-default-xs" onBackground="neutral-weak">
                    agencies
                  </Text>
                </Column>
              </Flex>
              <Flex horizontal="between" fillWidth>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Priority {formatPercent(item.compositeScore)}
                </Text>
                <Text variant="body-default-xs" onBackground="brand-weak">
                  Lead agency: {item.scoreBreakdown.agencyRanking[0]?.agency.name ?? "—"}
                </Text>
              </Flex>
              {index < ranked.length - 1 && (
                <Line background="neutral-alpha-weak" />
              )}
            </Column>
          ))
        )}
      </Column>
    </Panel>
  );
}
