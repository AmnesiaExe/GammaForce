"use client";

import { useMemo, useState } from "react";
import { Button, Column, Flex, Heading, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { ScoreBar } from "@/components/dashboard/ScoreBar";
import { AgencyContactRecord } from "@/lib/incidentIntelligence";
import { AlertItem } from "@/lib/scoring";
import { scoreColor, scoreColorHex } from "@/lib/riskColors";

interface AgencyRankingWithContactsProps {
  alert: AlertItem;
  contacts: AgencyContactRecord[];
  leadAgencyName: string;
  highlightAgencyId?: string | null;
}

export function AgencyRankingWithContacts({
  alert,
  contacts,
  leadAgencyName,
  highlightAgencyId,
}: AgencyRankingWithContactsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const ranking = alert.scoreBreakdown.agencyRanking;
  const threatScore = alert.scoreBreakdown.domainScores.final_score;

  const contactById = useMemo(() => {
    const map = new Map<string, AgencyContactRecord>();
    for (const c of contacts) map.set(c.agencyId, c);
    return map;
  }, [contacts]);

  return (
    <Panel
      title="Agency impact and contacts"
      subtitle={`Threat ${threatScore}/100 · contact in ranked order`}
      padding="20"
    >
      {ranking.length === 0 ? (
        <Text variant="body-default-s" onBackground="neutral-weak">
          Only one agency on this threat.
        </Text>
      ) : (
        <div className="gov-agency-impact-grid">
          {ranking.map((entry) => {
            const contact = contactById.get(entry.agencyId);
            const isLead = entry.agency.name === leadAgencyName;
            const expanded = expandedId === entry.agencyId;
            const urgency = entry.urgencyPercent;

            return (
              <div
                key={entry.agencyId}
                id={`gov-agency-${entry.agencyId}`}
                className={`gov-agency-impact-card${isLead ? " gov-agency-impact-card--lead" : ""}${highlightAgencyId === entry.agencyId ? " gov-agency-impact-card--highlight" : ""}`}
              >
                <div className="gov-agency-impact-rank">
                  <Flex gap="8" vertical="center" wrap>
                    <Heading variant="heading-strong-m" style={{ color: scoreColorHex(urgency) }}>
                      #{entry.rank}
                    </Heading>
                    <Column gap="4" flex={1} style={{ minWidth: 0 }}>
                      <Text variant="label-strong-s">{entry.agency.name}</Text>
                      <Text variant="body-default-xs" onBackground="neutral-weak">
                        Impact {Math.round(entry.agency.criticalityWeight * 100)}% · Tier {entry.agency.tier}
                      </Text>
                    </Column>
                    {isLead && <Tag size="s" variant="brand" label="Contact first" />}
                  </Flex>
                  <Flex horizontal="between" vertical="center" gap="8" style={{ marginTop: "0.5rem" }}>
                    <Text variant="label-default-xs" onBackground="neutral-weak">
                      Priority for this threat
                    </Text>
                    <Heading variant="heading-strong-s" style={{ color: scoreColor(urgency) }}>
                      {urgency}
                    </Heading>
                  </Flex>
                  <ScoreBar value={urgency} height={10} />
                  <Text variant="body-default-xs" onBackground="neutral-weak">
                    {entry.rationale}
                  </Text>
                </div>

                <div className="gov-agency-impact-contact">
                  {contact ? (
                    <Column gap="8" fillWidth>
                      <Tag
                        size="s"
                        variant={
                          contact.responseStatus === "Resolved"
                            ? "success"
                            : contact.responseStatus === "No response"
                              ? "danger"
                              : "neutral"
                        }
                        label={contact.responseStatus}
                      />
                      <Flex gap="8" wrap>
                        <Button
                          size="s"
                          variant="primary"
                          label={expanded ? "Hide" : "Contact"}
                          onClick={() =>
                            setExpandedId((id) => (id === entry.agencyId ? null : entry.agencyId))
                          }
                        />
                        <Button
                          size="s"
                          variant="secondary"
                          label="View notes"
                          onClick={() => setExpandedId(entry.agencyId)}
                        />
                      </Flex>
                      {expanded && (
                        <Column gap="8" className="gov-agency-rank-contact-detail">
                          <Text variant="body-default-xs" onBackground="neutral-weak">
                            WASOC coordination channel
                          </Text>
                          <Text variant="body-default-s">Last contact: {contact.lastContact}</Text>
                          <Text variant="body-default-s">{contact.notes}</Text>
                          {contact.similarPast && (
                            <Tag size="s" variant="brand" label="Similar incident before" />
                          )}
                        </Column>
                      )}
                    </Column>
                  ) : (
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                      No contact record for this agency yet.
                    </Text>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
