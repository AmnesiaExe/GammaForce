"use client";

import { useMemo } from "react";
import { Column, Grid, Heading, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AiTriageWorkbench } from "@/components/dashboard/AiTriageWorkbench";
import { AiTriageDiscardedList } from "@/components/dashboard/AiTriageDiscardedList";
import { AiTriageRankedQueue } from "@/components/dashboard/AiTriageRankedQueue";
import { TRIAGE_AI_ROLE } from "@/data/aiTriageSimulation";
import { TRIAGE_STATS } from "@/data/generatedAlerts";
import { useAiTriageSimulation } from "@/hooks/useAiTriageSimulation";
import { AlertItem } from "@/lib/scoring";

interface AiTriageWorkspaceProps {
  pool: AlertItem[];
  highlightedId?: string | null;
  onOpenAdvisory: (id: string, context?: { aiDisregardReason?: string }) => void;
}

function StatBox({
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
    <Column
      padding="16"
      gap="8"
      background="neutral-weak"
      border="neutral-alpha-weak"
      radius="m"
      fillWidth
      className="gov-dash-stat"
    >
      <Text variant="label-default-xs" onBackground="neutral-weak">
        {label}
      </Text>
      <Heading variant="heading-strong-l" style={accent ? { color: accent } : undefined}>
        {value}
      </Heading>
      <Text variant="body-default-xs" onBackground="neutral-weak">
        {sub}
      </Text>
    </Column>
  );
}

export function AiTriageWorkspace({
  pool,
  highlightedId,
  onOpenAdvisory,
}: AiTriageWorkspaceProps) {
  const demoPool = useMemo(() => pool, [pool]);
  const { phase, cards, aiTask, activity, counts, stats, focusCard } =
    useAiTriageSimulation(demoPool);

  const incoming = cards.filter((c) => c.lane === "incoming");
  const ranked = cards.filter((c) => c.lane === "ranked");
  const discardedRaw = cards.filter((c) => c.lane === "discarded");
  const discarded = useMemo(() => {
    const seen = new Set<string>();
    return discardedRaw.filter((c) => {
      if (seen.has(c.alert.id)) return false;
      seen.add(c.alert.id);
      return true;
    });
  }, [discardedRaw]);
  const isEmpty = phase === "standby" && cards.length === 0;

  return (
    <Column gap="24" fillWidth className="gov-ai-triage-workspace">
      <Grid columns="6" gap="12" fillWidth l={{ columns: "3" }} s={{ columns: "2" }}>
        <StatBox
          label="Alerts in corpus"
          value={TRIAGE_STATS.threatsAnalysed.toLocaleString()}
          sub="Statewide register"
        />
        <StatBox
          label="Ingested this session"
          value={stats.ingested.toLocaleString()}
          sub="Live feed arrivals"
          accent="#38bdf8"
        />
        <StatBox
          label="Filtered out"
          value={stats.suppressed.toLocaleString()}
          sub="Dupes · false positives · low value (after full triage)"
        />
        <StatBox
          label="Patterns linked"
          value={stats.patterns.toLocaleString()}
          sub="Related events clustered"
          accent="#a78bfa"
        />
        <StatBox
          label="Escalation forecasts"
          value={stats.predicted.toLocaleString()}
          sub="6 hour lookahead"
          accent="#fb923c"
        />
        <StatBox
          label="Agencies touched"
          value={stats.agencies.toLocaleString()}
          sub="Unique in this session"
          accent="#4ade80"
        />
      </Grid>

      <Text variant="body-default-s" onBackground="neutral-weak" className="gov-triage-ai-role">
        {TRIAGE_AI_ROLE}
      </Text>

      {isEmpty && (
        <div className="gov-triage-standby gov-triage-standby--hero">
          <span className="gov-ai-orb" aria-hidden />
          <Column gap="8" horizontal="center">
            <Heading variant="heading-strong-m">AI triage scanner ready</Heading>
            <Text variant="body-default-s" onBackground="neutral-weak">
              Queue is empty. WASOC feeds will land in the strip below, then AI will scan,
              correlate, and build the prioritised queue.
            </Text>
          </Column>
        </div>
      )}

      <Panel
        title="AI live review"
        subtitle="Corroboration · patterns · agency impact · ranking on the left · ingest feed on the right"
        padding="20"
      >
        <AiTriageWorkbench
          aiTask={aiTask}
          activity={activity}
          focusCard={focusCard}
          phase={phase}
          incoming={incoming}
          counts={counts}
        />
      </Panel>

      <Panel
        title="Priority queue"
        subtitle={`${ranked.length} alerts ranked statewide  order updates slowly as AI finishes each review`}
        padding="0"
      >
        <Column padding="24" fillWidth>
          <AiTriageRankedQueue
            cards={ranked}
            highlightedId={highlightedId}
            onOpen={onOpenAdvisory}
          />
        </Column>
      </Panel>

      {discarded.length > 0 && (
        <Panel
          title="Filtered out by AI"
          subtitle="Duplicates, likely false positives, and low-value noise · still in the register"
          padding="0"
        >
          <AiTriageDiscardedList cards={discarded} onOpen={onOpenAdvisory} />
        </Panel>
      )}
    </Column>
  );
}
