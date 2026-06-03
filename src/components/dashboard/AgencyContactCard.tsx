"use client";

import { useState } from "react";
import { Button, Column, Flex, Tag, Text } from "@once-ui-system/core";
import { AgencyContactRecord } from "@/lib/incidentIntelligence";

interface AgencyContactCardProps {
  contact: AgencyContactRecord;
  isLead?: boolean;
}

export function AgencyContactCard({ contact, isLead }: AgencyContactCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id={`gov-agency-${contact.agencyId}`}
      className={`gov-detail-agency-card${isLead ? " gov-detail-agency-card--lead" : ""}`}
    >
      <Text variant="label-strong-s">{contact.agencyName}</Text>
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
      {contact.similarPast && <Tag size="s" variant="brand" label="Similar past" />}
      <Flex gap="8" wrap>
        <Button
          size="s"
          variant="primary"
          label={expanded ? "Hide contact" : "Contact agency"}
          onClick={() => setExpanded((v) => !v)}
        />
        <Button
          size="s"
          variant="secondary"
          label="View notes"
          onClick={() => setExpanded(true)}
        />
      </Flex>
      {expanded && (
        <Column gap="8" className="gov-agency-contact-expanded">
          <Text variant="body-default-xs" onBackground="neutral-weak">
            WASOC channel · secure coordination line
          </Text>
          <Text variant="body-default-s">
            Last contact: {contact.lastContact}
          </Text>
          <Text variant="body-default-s">{contact.notes}</Text>
        </Column>
      )}
    </div>
  );
}
