"use client";

import { Column, Flex, Grid, Heading, Tag, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AiAnalysisStream } from "@/components/dashboard/AiAnalysisStream";
import { TRIAGE_STATS } from "@/data/generatedAlerts";
import { TRIAGE_AT_A_GLANCE, triageKpiTiles } from "@/data/triageCopy";
import { FRAMEWORK_REFERENCES } from "@/data/wasoc";

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <Column padding="16" gap="8" background="neutral-weak" border="neutral-alpha-weak" radius="m" fillWidth>
      <Text variant="label-default-xs" onBackground="neutral-weak">{label}</Text>
      <Heading variant="heading-strong-l" className="gov-kpi-value" style={accent ? { color: accent } : undefined}>
        {value}
      </Heading>
      <Text variant="body-default-xs" onBackground="neutral-weak">{sub}</Text>
    </Column>
  );
}

export function TriageOverview({ compact = false }: { compact?: boolean }) {
  const s = TRIAGE_STATS;

  return (
    <Column gap="24" fillWidth>
      <Panel padding="24">
        <AiAnalysisStream stats={s} />
      </Panel>

      <Text variant="body-default-s" onBackground="neutral-weak">
        {TRIAGE_AT_A_GLANCE}
      </Text>

      <Grid columns="4" gap="16" fillWidth l={{ columns: "2" }} s={{ columns: "2" }}>
        {triageKpiTiles(s).map((tile) => (
          <StatTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            sub={tile.sub}
            accent={"accent" in tile ? tile.accent : undefined}
          />
        ))}
      </Grid>

      {compact ? null : (
      <>
      <Panel
        title="Score vs prioritisation"
        subtitle="In plain terms"
      >
        <Grid columns="2" gap="12" fillWidth s={{ columns: "1" }}>
          <Column gap="8" padding="16" background="neutral-weak" radius="m" border="neutral-alpha-weak">
            <Text variant="label-strong-s">Agency importance (score)</Text>
            <Text variant="body-default-s" onBackground="neutral-weak">
              How much it matters at WA state level if this agency is affected: critical services,
              citizens, data, tier.
            </Text>
          </Column>
          <Column gap="8" padding="16" background="neutral-weak" radius="m" border="neutral-alpha-weak">
            <Text variant="label-strong-s">Prioritisation</Text>
            <Text variant="body-default-s" onBackground="neutral-weak">
              What to act on first: a serious threat plus important agencies affected moves to the top.
              Open a row in the list to see both numbers.
            </Text>
          </Column>
        </Grid>
      </Panel>

      <Panel
        title="Grounded in WA Government policy"
        subtitle="Every factor maps to published WASOC / ACSC guidance, so a score can be defended to an agency."
      >
        <Grid columns="2" gap="12" fillWidth s={{ columns: "1" }}>
          {FRAMEWORK_REFERENCES.map((ref) => (
            <Column key={ref.key} gap="4" padding="12" background="neutral-weak" border="neutral-alpha-weak" radius="m">
              <Flex horizontal="between" gap="8" wrap vertical="center">
                <Text variant="label-strong-s">{ref.label}</Text>
                <Tag size="s" variant="neutral" label={ref.authority} />
              </Flex>
              <Text variant="body-default-xs" onBackground="neutral-weak">
                Drives: {ref.appliesTo}
              </Text>
              <a href={ref.url} target="_blank" rel="noreferrer" className="gov-ref-link">
                {ref.url.replace("https://", "")}
              </a>
            </Column>
          ))}
        </Grid>
      </Panel>
      </>
      )}
    </Column>
  );
}
