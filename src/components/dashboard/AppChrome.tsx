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

export type NavSection =
  | "overview"
  | "ranking"
  | "analysis"
  | "simulation"
  | "executive"
  | "analytics"
  | "alerts";

const NAV: { id: NavSection; label: string; description: string }[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Command summary and queue",
  },
  {
    id: "ranking",
    label: "Agency ranking",
    description: "Which WA agency to patch first",
  },
  {
    id: "analysis",
    label: "Threat analysis",
    description: "25-signal domain breakdown",
  },
  {
    id: "simulation",
    label: "Attack simulation",
    description: "Breach path for top threat",
  },
  {
    id: "executive",
    label: "Executive summary",
    description: "Leadership posture",
  },
  {
    id: "analytics",
    label: "Risk analytics",
    description: "Trends and prioritisation views",
  },
  {
    id: "alerts",
    label: "Alert management",
    description: "Triage and response workflow",
  },
];

interface AppChromeProps {
  activeNav: NavSection;
  onNavChange: (nav: NavSection) => void;
  totalAlerts: number;
  visibleAlerts: number;
  selectedId?: string;
  children: ReactNode;
}

export function AppChrome({
  activeNav,
  onNavChange,
  totalAlerts,
  visibleAlerts,
  selectedId,
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
          <Heading variant="heading-strong-m">GammaForce SOC</Heading>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Threat and vulnerability prioritisation
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
              Security Operations Centre
            </Text>
            <Heading variant="heading-strong-l">
              Prioritised threat and vulnerability register
            </Heading>
          </Column>

          <Column gap="8" horizontal="end">
            <Text variant="label-default-xs" onBackground="neutral-weak">
              Last refreshed
            </Text>
            <Text variant="body-default-s">03 Jun 2025, 09:30 AWST</Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {totalAlerts} registered | {visibleAlerts} in current view
              {selectedId ? ` | Selected ${selectedId}` : ""}
            </Text>
          </Column>
        </Flex>

        <Column fillWidth padding="32" gap="24" className="gov-main-scroll">
          {children}
        </Column>
      </Column>
    </Row>
  );
}
