"use client";

import {
  Column,
  Flex,
  Heading,
  Line,
  Row,
  StatusIndicator,
  Text,
  ToggleButton,
} from "@once-ui-system/core";
import { ReactNode } from "react";

export type NavSection = "triage" | "raw" | "agencies" | "analysis" | "executive";

const NAV: { id: NavSection; label: string; description: string }[] = [
  {
    id: "triage",
    label: "AI Triage",
    description: "Live AI operator board",
  },
  {
    id: "raw",
    label: "Ingest log",
    description: "Live feed tail",
  },
  {
    id: "agencies",
    label: "WA agencies",
    description: "Agency names and tiers",
  },
  {
    id: "analysis",
    label: "Overview",
    description: "Priority snapshot and map",
  },
  {
    id: "executive",
    label: "Executive summary",
    description: "Leadership posture",
  },
];

interface AppChromeProps {
  activeNav: NavSection;
  onNavChange: (nav: NavSection) => void;
  metaLine?: string;
  children: ReactNode;
}

export function AppChrome({
  activeNav,
  onNavChange,
  metaLine,
  children,
}: AppChromeProps) {
  return (
    <Row fillWidth className="gov-app">
      <Column
        background="surface"
        border="surface"
        padding="20"
        gap="20"
        className="gov-sidebar"
      >
        <Column gap="8">
          <Text variant="label-default-xs" onBackground="brand-weak">
            Western Australia Government
          </Text>
          <Heading variant="heading-strong-m">WASOC Prioritisation</Heading>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            WA Government cyber triage
          </Text>
        </Column>

        <Line background="neutral-alpha-weak" />

        <Column gap="8" fillWidth>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            WORKSPACE
          </Text>
          {NAV.map((item) => (
            <Column key={item.id} gap="4" fillWidth>
              <ToggleButton
                fillWidth
                horizontal="start"
                selected={activeNav === item.id}
                onClick={() => onNavChange(item.id)}
                variant={activeNav === item.id ? "outline" : "ghost"}
                label={item.label}
              />
              {activeNav === item.id && (
                <Text variant="body-default-xs" onBackground="neutral-weak" paddingLeft="12">
                  {item.description}
                </Text>
              )}
            </Column>
          ))}
        </Column>

        <Line background="neutral-alpha-weak" />

        <Column gap="12" fillWidth>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            SYSTEM STATUS
          </Text>
          <Flex gap="8" vertical="center">
            <StatusIndicator size="s" color="green" ariaLabel="Feeds healthy" />
            <Text variant="body-default-xs">Intelligence feeds nominal</Text>
          </Flex>
          <Flex gap="8" vertical="center">
            <StatusIndicator size="s" color="orange" ariaLabel="SLA pressure" />
            <Text variant="body-default-xs">3 alerts breaching SLA window</Text>
          </Flex>
        </Column>

        <Column gap="4" style={{ marginTop: "auto" }}>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Classification
          </Text>
          <Text variant="label-strong-s">OFFICIAL</Text>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Internal use only
          </Text>
        </Column>
      </Column>

      <Column flex={1} fillWidth gap="0" className="gov-main">
        <Flex
          fillWidth
          horizontal="between"
          vertical="center"
          paddingX="32"
          paddingY="20"
          background="surface"
          borderBottom="surface"
          wrap
          gap="16"
        >
          <Column gap="4">
            <Text variant="label-default-xs" onBackground="neutral-weak">
              Office of Digital Government · WA Cyber Security Unit
            </Text>
            <Heading variant="heading-strong-l">
              Cyber threat and vulnerability prioritisation
            </Heading>
          </Column>

          <Column gap="8" horizontal="end">
            <Text variant="label-default-xs" onBackground="neutral-weak">
              Live analysis
            </Text>
            <Text variant="body-default-s">03 Jun 2026, 09:30 AWST</Text>
            {metaLine && (
              <Text variant="body-default-xs" onBackground="neutral-weak">
                {metaLine}
              </Text>
            )}
          </Column>
        </Flex>

        <Column fillWidth padding="32" gap="24" className="gov-main-scroll">
          {children}
        </Column>
      </Column>
    </Row>
  );
}
