"use client";

import { Column, Flex, Heading, Line, Row, Tag, Text } from "@once-ui-system/core";
import { EisenhowerMatrix } from "@/components/dashboard/EisenhowerMatrix";
import { Panel } from "@/components/dashboard/Panel";
import { PRIORITY_WEIGHTS } from "@/lib/prioritisation";
import { AlertItem } from "@/lib/scoring";
import { scoreColor } from "@/lib/riskColors";

function ScoreCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  accent?: string;
}) {
  return (
    <Column
      gap="8"
      padding="16"
      flex={1}
      fillWidth
      radius="m"
      background="neutral-weak"
      border="neutral-alpha-weak"
      style={{ minWidth: "10rem" }}
    >
      <Text variant="label-default-xs" onBackground="neutral-weak">
        {title}
      </Text>
      <Heading variant="display-strong-s" className="gov-kpi-value" style={accent ? { color: accent } : undefined}>
        {value}
      </Heading>
      <Text variant="body-default-xs" onBackground="neutral-weak">
        {subtitle}
      </Text>
    </Column>
  );
}

export function PriorityBreakdownPanel({ alert }: { alert: AlertItem }) {
  const b = alert.scoreBreakdown;
  const d = b.domainScores;
  const impact = b.agencyImpact;

  const threatScore = d.final_score;
  const agencyImpactPct = Math.round(impact.composite * 100);
  const priorityPct = Math.round(alert.compositeScore * 100);

  return (
    <Column gap="16" fillWidth>
      <Panel
        title="How prioritisation works"
        subtitle="Two ideas: how serious the threat is, and how important each agency is to WA"
      >
        <Column gap="20" fillWidth>
          <Column gap="8" padding="16" radius="m" background="neutral-weak" border="brand-alpha-weak">
            <Text variant="body-default-s">
              <Text as="span" variant="label-strong-s">Threat score</Text> measures how dangerous the
              threat is (exploits, exposure, intelligence).{" "}
              <Text as="span" variant="label-strong-s">Agency importance</Text> is how much it matters
              at a WA state level if that agency is hit (critical services, citizens, data).{" "}
              <Text as="span" variant="label-strong-s">Prioritisation</Text> combines both: a serious
              threat affecting important agencies rises to the top.
            </Text>
          </Column>

          <Row fillWidth gap="16" wrap s={{ direction: "column" }}>
            <ScoreCard
              title="Step 1: Threat score"
              value={threatScore}
              subtitle="How serious is this issue? (0–100)"
              accent={scoreColor(threatScore)}
            />
            <ScoreCard
              title="Step 2: Agency impact"
              value={agencyImpactPct}
              subtitle={`${impact.agencyCount} agencies affected. Combined importance score.`}
              accent="#38bdf8"
            />
          </Row>

          <EisenhowerMatrix alert={alert} embedded />

          <Column gap="8" padding="20" radius="m" border="neutral-alpha-weak" fillWidth className="gov-priority-hero">
            <Text variant="label-default-xs" onBackground="brand-weak">
              Prioritisation for this threat
            </Text>
            <Heading variant="display-strong-m" className="gov-kpi-value" style={{ color: scoreColor(priorityPct) }}>
              {priorityPct}
            </Heading>
            <Text variant="body-default-s" onBackground="neutral-weak">
              Act sooner when the threat score is high and important agencies are in scope.
              Band: {alert.severity} ({b.cyberRiskLevel}).
            </Text>
            <Text variant="body-default-xs" onBackground="neutral-weak" className="gov-formula-line">
              priority ≈ threat ({threatScore}) × {Math.round(PRIORITY_WEIGHTS.vulnerabilityDomains * 100)}% + agency
              impact ({agencyImpactPct}) × {Math.round(PRIORITY_WEIGHTS.agencyImpact * 100)}%
            </Text>
          </Column>
        </Column>
      </Panel>

      <Panel
        title="Agency importance: who to contact first"
        subtitle="Each agency has an importance weight; priority for this threat = threat score × that weight"
      >
        <Column gap="12" fillWidth>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Agencies with higher importance scores matter more to statewide risk. For this threat,
            work through them in the order below.
          </Text>

          {b.agencyRanking.length === 0 ? (
            <Text variant="body-default-s" onBackground="neutral-weak">
              Only one agency involved. No cross-agency ordering needed.
            </Text>
          ) : (
            b.agencyRanking.map((entry) => (
              <Row
                key={entry.agencyId}
                fillWidth
                horizontal="between"
                vertical="center"
                wrap
                gap="12"
                className="gov-agency-score-row"
              >
                <Column gap="4" style={{ minWidth: 0 }}>
                  <Flex gap="8" vertical="center" wrap>
                    <Text variant="label-strong-s">#{entry.rank}</Text>
                    <Text variant="label-strong-s">{entry.agency.name}</Text>
                    <Tag size="s" variant="neutral" label={`Tier ${entry.agency.tier}`} />
                  </Flex>
                  <Text variant="body-default-xs" onBackground="neutral-weak">
                    Agency importance {Math.round(entry.agency.criticalityWeight * 100)}% ·{" "}
                    {entry.rationale}
                  </Text>
                </Column>
                <Column gap="2" horizontal="end">
                  <Text variant="label-default-xs" onBackground="neutral-weak">
                    Priority for this threat
                  </Text>
                  <Heading variant="heading-strong-m" style={{ color: scoreColor(entry.urgencyPercent) }}>
                    {entry.urgencyPercent}
                  </Heading>
                </Column>
              </Row>
            ))
          )}

          <Line background="neutral-alpha-weak" />

          <Text variant="label-default-xs" onBackground="neutral-weak">
            Per agency: priority = threat score ({threatScore}) × agency importance × tier modifier
          </Text>
        </Column>
      </Panel>

    </Column>
  );
}
