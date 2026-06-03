"use client";

import { useMemo } from "react";
import { Column, Flex, Heading, Line, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { WA_AGENCY_COUNT } from "@/data/waAgencies";
import { AlertItem } from "@/lib/scoring";
import { formatPercent } from "@/lib/prioritisation";
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
  const impact = active?.scoreBreakdown.agencyImpact;

  return (
    <Panel
      title="WA agency priority ranking"
      subtitle={`When multiple of ${WA_AGENCY_COUNT} WA state agencies share one vulnerability, urgency = vulnerability score × agency criticality × tier`}
    >
      {!active ? (
        <Text variant="body-default-s" onBackground="neutral-weak">
          Select an alert to see per-agency ranking.
        </Text>
      ) : (
        <Column gap="16" fillWidth>
          <Column gap="8" padding="12" background="neutral-weak" radius="m" border="neutral-alpha-weak">
            <Text variant="label-default-xs" onBackground="neutral-weak">
              Active issue
            </Text>
            <Text variant="label-strong-s">{active.title}</Text>
            <Flex gap="8" wrap>
              <Tag
                variant="danger"
                size="s"
                label={`Vuln ${active.scoreBreakdown.domainScores.final_score}/100`}
              />
              <Tag
                variant="brand"
                size="s"
                label={`Statewide ${formatPercent(active.compositeScore)}`}
              />
              <Tag variant="neutral" size="s" label={`${active.agencyCount} agencies`} />
            </Flex>
          </Column>

          {impact && (
            <Flex gap="12" wrap fillWidth>
              {[
                { label: "Breadth", value: formatPercent(impact.breadth) },
                { label: "Avg criticality", value: formatPercent(impact.weightedCriticality) },
                { label: "Peak agency weight", value: formatPercent(impact.maxCriticality) },
                { label: "Tier 1 share", value: `${Math.round(impact.tier1Share * 100)}%` },
              ].map((m) => (
                <Column key={m.label} gap="4" padding="12" background="surface" radius="m" border="neutral-alpha-weak" style={{ minWidth: "7rem", flex: 1 }}>
                  <Text variant="label-default-xs" onBackground="neutral-weak">
                    {m.label}
                  </Text>
                  <Heading variant="heading-strong-s" className="gov-kpi-value">
                    {m.value}
                  </Heading>
                </Column>
              ))}
            </Flex>
          )}

          <Column gap="8" fillWidth>
            <Text variant="label-default-s" onBackground="neutral-weak">
              Response order (highest urgency first)
            </Text>
            {ranking.length === 0 ? (
              <Text variant="body-default-s" onBackground="neutral-weak">
                Single-agency issue — no cross-agency ordering required.
              </Text>
            ) : (
              ranking.map((entry) => (
                <Column key={entry.agencyId} gap="8" fillWidth>
                  <Flex horizontal="between" vertical="center" wrap gap="8" fillWidth>
                    <Flex gap="12" vertical="center">
                      <Heading variant="heading-strong-m" className="gov-kpi-value" style={{ minWidth: "2rem" }}>
                        #{entry.rank}
                      </Heading>
                      <Column gap="4">
                        <Text variant="label-strong-s">{entry.agency.name}</Text>
                        <Text variant="body-default-xs" onBackground="neutral-weak">
                          {entry.rationale}
                        </Text>
                      </Column>
                    </Flex>
                    <Column gap="4" horizontal="end">
                      <Heading
                        variant="heading-strong-m"
                        className="gov-kpi-value"
                        style={{ color: scoreColor(entry.urgencyPercent) }}
                      >
                        {entry.urgencyPercent}
                      </Heading>
                      <Text variant="label-default-xs" onBackground="neutral-weak">
                        urgency index
                      </Text>
                    </Column>
                  </Flex>
                  <div className="gov-factor-track">
                    <div
                      className="gov-factor-fill"
                      style={{
                        width: `${Math.min(100, entry.urgencyPercent)}%`,
                        background: scoreColor(entry.urgencyPercent),
                      }}
                    />
                  </div>
                  {entry.rank < ranking.length - 1 && (
                    <Line background="neutral-alpha-weak" />
                  )}
                </Column>
              ))
            )}
          </Column>
        </Column>
      )}
    </Panel>
  );
}
