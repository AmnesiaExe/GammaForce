"use client";

import { Column, Flex, Heading, Tag, Text } from "@once-ui-system/core";
import { InteractivePatternGraph } from "@/components/dashboard/InteractivePatternGraph";
import { Panel } from "@/components/dashboard/Panel";
import { IncidentIntelligence } from "@/lib/incidentIntelligence";
import { LinkedIncidentRecord } from "@/lib/linkedIncidents";

function linkKindLabel(kind: LinkedIncidentRecord["kind"]) {
  if (kind === "duplicate") return "Duplicate";
  if (kind === "prior") return "Prior incident";
  return "Related";
}

function linkKindVariant(kind: LinkedIncidentRecord["kind"]): "warning" | "neutral" | "brand" {
  if (kind === "duplicate") return "warning";
  if (kind === "prior") return "brand";
  return "neutral";
}

interface PatternLinksPanelProps {
  intel: IncidentIntelligence;
  highlightId?: string | null;
  onHighlight?: (id: string | null) => void;
  onOpenIncident?: (openableId: string) => void;
}

export function PatternLinksPanel({
  intel,
  highlightId,
  onHighlight,
  onOpenIncident,
}: PatternLinksPanelProps) {
  return (
    <Panel
      title="Pattern links and prediction"
      subtitle="Prior incidents, duplicates, intel corroboration, and 6 hour escalation forecast"
      padding="20"
    >
      <Column gap="20" fillWidth>
        <div className="gov-prediction-hero">
          <Flex gap="12" wrap vertical="center" horizontal="between" fillWidth>
            <Column gap="4">
              <Text variant="label-default-xs" onBackground="neutral-weak">
                Escalation outlook (6h)
              </Text>
              <Heading variant="display-strong-s" className="gov-prediction-hero-value">
                {intel.predictionConfidence}
              </Heading>
            </Column>
            <Tag
              size="s"
              variant={intel.seenBefore ? "warning" : "neutral"}
              label={intel.seenBefore ? "Pattern-backed forecast" : "Baseline forecast"}
            />
          </Flex>
          <Text variant="body-default-s" className="gov-prediction-hero-copy">
            {intel.prediction}
          </Text>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            {intel.patternSummary}
          </Text>
        </div>

        <InteractivePatternGraph
          nodes={intel.graphNodes}
          highlightId={highlightId}
          onHighlight={onHighlight}
          onOpenIncident={onOpenIncident}
        />

        {intel.linkedIncidents.length > 0 && (
          <Column gap="8" fillWidth>
            <Text variant="label-strong-s">Linked records</Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Open a prior or duplicate incident in the register. IDs may differ from display
              pattern labels when the corpus maps a cluster.
            </Text>
            <ul className="gov-linked-incidents">
              {intel.linkedIncidents.map((link) => (
                <li key={`${link.kind}-${link.displayId}`} className="gov-linked-incident-row">
                  <Flex gap="8" wrap vertical="center" fillWidth horizontal="between">
                    <Column gap="4" style={{ minWidth: 0 }}>
                      <Flex gap="8" wrap vertical="center">
                        <Text variant="label-strong-s" className="gov-linked-incident-id">
                          {link.displayId}
                        </Text>
                        <Tag
                          size="s"
                          variant={linkKindVariant(link.kind)}
                          label={linkKindLabel(link.kind)}
                        />
                      </Flex>
                      <Text variant="body-default-xs" onBackground="neutral-weak">
                        {link.when} · {link.similarity}
                      </Text>
                      {link.outcome && (
                        <Text variant="body-default-s">{link.outcome}</Text>
                      )}
                    </Column>
                    {onOpenIncident && (
                      <button
                        type="button"
                        className="gov-linked-incident-open"
                        onClick={() => onOpenIncident(link.openableId)}
                      >
                        Open record
                      </button>
                    )}
                  </Flex>
                </li>
              ))}
            </ul>
          </Column>
        )}
      </Column>
    </Panel>
  );
}
