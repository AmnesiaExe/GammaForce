"use client";

import { useMemo } from "react";
import { Column, Flex, Heading, Line, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { WA_AGENCY_COUNT } from "@/data/waAgencies";
import { AlertItem } from "@/lib/scoring";
import { formatPercent } from "@/lib/prioritisation";
import { ScoreBar } from "@/components/dashboard/ScoreBar";
import { scoreColor } from "@/lib/riskColors";

interface AgencyPriorityRankingProps {
  alert: AlertItem | null;
  items: AlertItem[];
}

export function AgencyPriorityRanking({ alert, items }: AgencyPriorityRankingProps) {
  const topMultiAgency = useMemo(
    () =>
      [...items]
        .filter((a) => a.agencyCount >= 2)
        .sort((a, b) => b.compositeScore - a.compositeScore)[0] ?? null,
    [items],
  );

  const active = alert ?? topMultiAgency;
  const ranking = active?.scoreBreakdown.agencyRanking ?? [];
  const threatScore = active?.scoreBreakdown.domainScores.final_score ?? 0;

  return (
    <Panel
      title="Who to contact first (verified agency impact)"
      subtitle={`Each agency has a verified impact weight; contact priority = threat score (${threatScore}/100) × that weight`}
    >
      {!active ? (
        <Text variant="body-default-s" onBackground="neutral-weak">
          Open an alert from the queue to see agency order.
        </Text>
      ) : (
        <Column gap="16" fillWidth>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Same alert, different priority per agency. Tier 1 agencies (for example Health) rank
            higher because verified statewide impact is higher.
          </Text>

          <Column gap="8" fillWidth>
            {ranking.length === 0 ? (
              <Text variant="body-default-s" onBackground="neutral-weak">
                Only one agency on this threat.
              </Text>
            ) : (
              ranking.map((entry) => (
                <Column key={entry.agencyId} gap="8" fillWidth>
                  <Flex horizontal="between" vertical="center" wrap gap="8" fillWidth>
                    <Column gap="4">
                      <Flex gap="12" vertical="center">
                        <Heading variant="heading-strong-m" className="gov-kpi-value">
                          #{entry.rank}
                        </Heading>
                        <Column gap="4">
                          <Text variant="label-strong-s">{entry.agency.name}</Text>
                          <Text variant="body-default-xs" onBackground="neutral-weak">
                            Verified impact {Math.round(entry.agency.criticalityWeight * 100)}%
                          </Text>
                        </Column>
                      </Flex>
                    </Column>
                    <Column gap="4" horizontal="end">
                      <Text variant="label-default-xs" onBackground="neutral-weak">
                        Priority
                      </Text>
                      <Heading
                        variant="heading-strong-m"
                        className="gov-kpi-value"
                        style={{ color: scoreColor(entry.urgencyPercent) }}
                      >
                        {entry.urgencyPercent}
                      </Heading>
                    </Column>
                  </Flex>
                  <ScoreBar value={entry.urgencyPercent} />
                  {entry.rank < ranking.length - 1 && (
                    <Line background="neutral-alpha-weak" />
                  )}
                </Column>
              ))
            )}
          </Column>

          <Text variant="body-default-xs" onBackground="neutral-weak">
            Across {WA_AGENCY_COUNT} WA Government agencies. Statewide priority for this threat{" "}
            {formatPercent(active.compositeScore)}
          </Text>
        </Column>
      )}
    </Panel>
  );
}
