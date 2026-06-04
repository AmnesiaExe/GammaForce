"use client";

import { useCallback, useMemo } from "react";
import type { TriageCard } from "@/hooks/useAiTriageSimulation";
import { Column, Flex, Heading, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AiTriageWorkbench } from "@/components/dashboard/AiTriageWorkbench";
import { TriageEisenhowerMatrix } from "@/components/dashboard/TriageEisenhowerMatrix";
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

interface InlineStatProps {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}

function InlineStat({ label, value, hint, accent }: InlineStatProps) {
  return (
    <div className="gov-triage-stat">
      <Heading
        variant="heading-strong-m"
        className="gov-kpi-value gov-triage-stat-value"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </Heading>
      <Text variant="label-default-xs" onBackground="neutral-weak" className="gov-triage-stat-label">
        {label}
      </Text>
      {hint && (
        <Text variant="body-default-xs" onBackground="neutral-weak" className="gov-triage-stat-hint">
          {hint}
        </Text>
      )}
    </div>
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
  const focusUid = focusCard?.uid ?? null;
  const isLive = phase === "live";

  const handleMatrixSelect = useCallback(
    (card: TriageCard) => {
      onOpenAdvisory(
        card.alert.id,
        card.disregardReason ? { aiDisregardReason: card.disregardReason } : undefined,
      );
    },
    [onOpenAdvisory],
  );

  return (
    <Column gap="20" fillWidth className="gov-ai-triage-workspace">
      <header className="gov-triage-header">
        <div className="gov-triage-stats-inline" role="list" aria-label="Session statistics">
          <InlineStat
            label="Alerts in corpus"
            value={TRIAGE_STATS.threatsAnalysed.toLocaleString()}
            hint="Register"
          />
          <InlineStat
            label="Ingested"
            value={stats.ingested.toLocaleString()}
            hint="This session"
            accent="#38bdf8"
          />
          <InlineStat
            label="Filtered out"
            value={stats.suppressed.toLocaleString()}
            hint="Duplicates"
          />
          <InlineStat
            label="Patterns"
            value={stats.patterns.toLocaleString()}
            hint="Clustered"
            accent="#a78bfa"
          />
          <InlineStat
            label="Forecasts"
            value={stats.predicted.toLocaleString()}
            hint="6h lookahead"
            accent="#fb923c"
          />
          <InlineStat
            label="Agencies"
            value={stats.agencies.toLocaleString()}
            hint="Unique"
            accent="#4ade80"
          />
        </div>

        <Flex
          fillWidth
          gap="16"
          wrap
          vertical="center"
          horizontal="between"
          className="gov-triage-header-foot"
        >
          <Text variant="body-default-s" onBackground="neutral-weak" className="gov-triage-ai-role-inline">
            {TRIAGE_AI_ROLE}
          </Text>
          <Flex gap="12" wrap vertical="center" className="gov-triage-session-pills">
            {isLive && (
              <span className="gov-triage-live-pill gov-triage-live-pill--header">Live</span>
            )}
            <span className="gov-triage-session-pill">
              In <strong>{counts.incoming}</strong>
            </span>
            <span className="gov-triage-session-pill">
              Review <strong>{counts.processing}</strong>
            </span>
            <span className="gov-triage-session-pill">
              Ranked <strong>{counts.ranked}</strong>
            </span>
            <span className="gov-triage-session-pill">
              Filtered <strong>{counts.discarded}</strong>
            </span>
          </Flex>
        </Flex>
      </header>

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

      <div className="gov-triage-main-grid">
        <Panel
          title="Live Eisenhower map"
          subtitle="Hover dots for detail · click to open · positions update during review"
          padding="20"
          fillHeight
          className="gov-triage-panel-matrix"
        >
          <TriageEisenhowerMatrix
            cards={cards}
            phase={phase}
            focusUid={focusUid}
            selectedAlertId={highlightedId ?? null}
            onSelectCard={handleMatrixSelect}
          />
        </Panel>

        <Panel
          title="AI live review"
          subtitle="Corroboration, patterns, agency impact, and ranking"
          padding="20"
          fillHeight
          className="gov-triage-panel-review"
        >
          <AiTriageWorkbench
            aiTask={aiTask}
            activity={activity}
            focusCard={focusCard}
            phase={phase}
            incoming={incoming}
          />
        </Panel>
      </div>

      <Panel
        title="Priority queue"
        subtitle={`${ranked.length} alerts ranked statewide. Order updates as AI finishes each review.`}
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
          subtitle="Duplicate bulletins only. Still in the register for analyst review."
          padding="0"
        >
          <AiTriageDiscardedList cards={discarded} onOpen={onOpenAdvisory} />
        </Panel>
      )}
    </Column>
  );
}
