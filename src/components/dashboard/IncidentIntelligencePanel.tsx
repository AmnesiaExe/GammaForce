"use client";

import { useMemo } from "react";
import {
  Column,
  Flex,
  Grid,
  Heading,
  Tag,
  Text,
} from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { buildIncidentIntelligence } from "@/lib/incidentIntelligence";
import { AlertItem } from "@/lib/scoring";

function statusVariant(
  status: string,
): "success" | "warning" | "danger" | "neutral" {
  if (status === "Resolved") return "success";
  if (status === "No response") return "danger";
  if (status === "Escalated") return "warning";
  return "neutral";
}

export function IncidentIntelligencePanel({ alert }: { alert: AlertItem }) {
  const intel = useMemo(() => buildIncidentIntelligence(alert), [alert]);

  return (
    <Column gap="16" fillWidth>
      <Panel
        title="AI assessment"
        subtitle="Why the AI set this priority  pattern memory, not just arithmetic"
      >
        <Column gap="16" fillWidth>
          <Column gap="8" padding="16" radius="m" background="neutral-weak" border="brand-alpha-weak">
            <Text variant="label-default-xs" onBackground="brand-weak">
              AI conclusion
            </Text>
            <Text variant="body-default-s">{intel.aiConclusion}</Text>
          </Column>

          <Column gap="8">
            <Text variant="label-strong-s">Why the AI scored this high</Text>
            <ul className="gov-ai-triage-list">
              {intel.whyAiScoredHigh.map((r) => (
                <li key={r}>
                  <Text variant="body-default-s">{r}</Text>
                </li>
              ))}
            </ul>
          </Column>
        </Column>
      </Panel>

      <Grid columns="2" gap="16" fillWidth s={{ columns: "1" }}>
        <Panel title="Pattern recognition" subtitle="Has WASOC seen this before?">
          <Column gap="12" fillWidth>
            <Flex gap="8" wrap vertical="center">
              <Tag
                size="s"
                variant={intel.seenBefore ? "warning" : "neutral"}
                label={intel.seenBefore ? "Seen before" : "Novel incident"}
              />
              {intel.seenBefore && (
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  {intel.priorOccurrences} prior occurrence(s) · last {intel.lastSeen}
                </Text>
              )}
            </Flex>
            <Text variant="body-default-s">{intel.patternSummary}</Text>
            {intel.linkedPatternIds.length > 0 && (
              <Column gap="4">
                <Text variant="label-default-xs" onBackground="neutral-weak">
                  Linked records
                </Text>
                <Flex gap="8" wrap>
                  {intel.linkedPatternIds.map((id) => (
                    <Tag key={id} size="s" variant="neutral" label={id} />
                  ))}
                </Flex>
              </Column>
            )}
            {intel.pastMatches.map((m) => (
              <Column
                key={m.id}
                gap="4"
                padding="12"
                radius="m"
                border="neutral-alpha-weak"
                background="neutral-weak"
              >
                <Text variant="label-strong-s">{m.id}</Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  {m.when} · {m.similarity}
                </Text>
                <Text variant="body-default-s">{m.outcome}</Text>
              </Column>
            ))}
          </Column>
        </Panel>

        <Panel title="Prediction" subtitle="What the AI expects next (6 hour window)">
          <Column gap="12" fillWidth>
            <Heading variant="heading-strong-m">{intel.predictionConfidence}</Heading>
            <Text variant="label-default-xs" onBackground="neutral-weak">
              Confidence in escalation forecast
            </Text>
            <Text variant="body-default-s">{intel.prediction}</Text>
          </Column>
        </Panel>
      </Grid>

      <Panel
        title="Verified agency impact and contact history"
        subtitle="Who is affected, whether they were contacted before, and how they responded"
      >
        <Column gap="12" fillWidth>
          {intel.agencyContacts.length === 0 ? (
            <Text variant="body-default-s" onBackground="neutral-weak">
              No agency mapping on this record.
            </Text>
          ) : (
            intel.agencyContacts.map((c) => (
              <Column key={c.agencyId} gap="8" padding="12" className="gov-agency-contact-row">
                <Flex horizontal="between" wrap gap="8" vertical="center">
                  <Text variant="label-strong-s">{c.agencyName}</Text>
                  <Flex gap="8" wrap>
                    <Tag size="s" variant={statusVariant(c.responseStatus)} label={c.responseStatus} />
                    {c.similarPast && (
                      <Tag size="s" variant="brand" label="Similar past incident" />
                    )}
                  </Flex>
                </Flex>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Last WASOC contact: {c.lastContact}
                </Text>
                <Text variant="body-default-s">{c.notes}</Text>
                {c.similarPast && c.responseStatus === "Resolved" && (
                  <Text variant="body-default-xs" onBackground="brand-weak">
                    Prior similar event closed without statewide intervention  confirm if still valid.
                  </Text>
                )}
              </Column>
            ))
          )}
        </Column>
      </Panel>
    </Column>
  );
}
