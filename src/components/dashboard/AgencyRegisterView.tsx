"use client";

import { useMemo, useState } from "react";
import { Column, Flex, Grid, Heading, Input, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { WA_AGENCY_COUNT, WA_AGENCY_LIST, AgencyProfile } from "@/data/waAgencies";

const TIER_LABEL: Record<AgencyProfile["tier"], string> = {
  1: "Tier 1: critical services",
  2: "Tier 2: core government",
  3: "Tier 3: supporting",
};

function tierVariant(tier: AgencyProfile["tier"]) {
  if (tier === 1) return "danger" as const;
  if (tier === 2) return "warning" as const;
  return "neutral" as const;
}

function AgencyRow({ agency }: { agency: AgencyProfile }) {
  return (
    <Flex
      fillWidth
      horizontal="between"
      vertical="center"
      wrap
      gap="8"
      paddingY="8"
      className="gov-agency-score-row"
    >
      <Text variant="label-strong-s">{agency.name}</Text>
      <Flex gap="8" wrap>
        <Tag size="s" variant={tierVariant(agency.tier)} label={`Tier ${agency.tier}`} />
        <Tag size="s" variant="neutral" label={agency.sector} />
      </Flex>
    </Flex>
  );
}

export function AgencyRegisterView() {
  const [search, setSearch] = useState("");

  const tier1 = useMemo(
    () =>
      WA_AGENCY_LIST.filter((a) => a.tier === 1).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return WA_AGENCY_LIST.filter((a) => a.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 40);
  }, [search]);

  const tierCounts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0 };
    for (const a of WA_AGENCY_LIST) c[a.tier] += 1;
    return c;
  }, []);

  return (
    <Column gap="24" fillWidth>
      <Panel
        title="WA Government agencies"
        subtitle={`${WA_AGENCY_COUNT} entities on the statewide register, used when several agencies are hit`}
      >
        <Text variant="body-default-s" onBackground="neutral-weak">
          Who to call first for a specific alert is in the side panel. Go to{" "}
          <Text as="span" variant="label-strong-s">
            AI Triage
          </Text>
          , open an alert, and scroll to agency priority there.
        </Text>
      </Panel>

      <Grid columns="3" gap="16" fillWidth s={{ columns: "1" }}>
        <Column gap="4" padding="16" background="neutral-weak" radius="m" border="neutral-alpha-weak">
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Tier 1
          </Text>
          <Heading variant="heading-strong-m">{tierCounts[1]}</Heading>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Health, Justice, emergency services
          </Text>
        </Column>
        <Column gap="4" padding="16" background="neutral-weak" radius="m" border="neutral-alpha-weak">
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Tier 2
          </Text>
          <Heading variant="heading-strong-m">{tierCounts[2]}</Heading>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Core departments and authorities
          </Text>
        </Column>
        <Column gap="4" padding="16" background="neutral-weak" radius="m" border="neutral-alpha-weak">
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Tier 3
          </Text>
          <Heading variant="heading-strong-m">{tierCounts[3]}</Heading>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Supporting boards and agencies
          </Text>
        </Column>
      </Grid>

      <Panel title="Search the register" subtitle="Find any agency by name">
        <Column gap="16" fillWidth>
          <Input
            id="agency-register-search"
            label="Agency name"
            placeholder="e.g. Health, Education, Police"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search.trim() ? (
            filtered.length === 0 ? (
              <Text variant="body-default-s" onBackground="neutral-weak">
                No agencies match that name.
              </Text>
            ) : (
              <Column gap="0" fillWidth>
                {filtered.map((agency) => (
                  <AgencyRow key={agency.id} agency={agency} />
                ))}
              </Column>
            )
          ) : (
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Type a name to search all {WA_AGENCY_COUNT} agencies.
            </Text>
          )}
        </Column>
      </Panel>

      <Panel title={TIER_LABEL[1]} subtitle="Highest importance in statewide prioritisation">
        <Column gap="0" fillWidth>
          {tier1.map((agency) => (
            <AgencyRow key={agency.id} agency={agency} />
          ))}
        </Column>
      </Panel>
    </Column>
  );
}
