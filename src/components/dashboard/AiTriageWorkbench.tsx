"use client";

import { useMemo } from "react";
import { Column, Flex, Tag, Text } from "@once-ui-system/core";
import { AiAnimatedNarrative } from "@/components/dashboard/AiAnimatedNarrative";
import { AiTriageFeedStrip } from "@/components/dashboard/AiTriageFeedStrip";
import {
  feedStyle,
  ProcessingStage,
  STAGE_LABELS,
  STAGE_THINKING_LINES,
} from "@/data/aiTriageSimulation";
import type { AiActivityLine } from "@/hooks/useAiTriageSimulation";
import type { TriageCard } from "@/hooks/useAiTriageSimulation";
import { buildWorkbenchNarrative } from "@/lib/impactAnalysisLines";
import { severityTagVariant } from "@/lib/scoring";
import { scoreColor } from "@/lib/riskColors";

const STAGE_ORDER: ProcessingStage[] = ["flash", "correlate", "predict", "score"];

function stageIndex(stage: ProcessingStage) {
  return STAGE_ORDER.indexOf(stage);
}

interface AiTriageWorkbenchProps {
  aiTask: string;
  activity: AiActivityLine[];
  focusCard: TriageCard | null;
  phase: "standby" | "live";
  incoming: TriageCard[];
  counts: { incoming: number; processing: number; ranked: number; discarded: number };
}

export function AiTriageWorkbench({
  aiTask,
  activity,
  focusCard,
  phase,
  incoming,
  counts,
}: AiTriageWorkbenchProps) {
  const feed = focusCard ? feedStyle(focusCard.alert.sourceKey) : null;
  const isAnalysing = phase === "live" && focusCard?.lane === "processing";
  const priorityPct = focusCard ? Math.round(focusCard.alert.compositeScore * 100) : 0;
  const stage = focusCard?.processingStage ?? "flash";

  const thinkingLines = useMemo(
    () => STAGE_THINKING_LINES[stage],
    [stage],
  );

  const liveTask = useMemo(() => {
    if (!isAnalysing || !focusCard) return aiTask;
    return `${STAGE_LABELS[stage]} · ${focusCard.alert.id}`;
  }, [aiTask, isAnalysing, focusCard, stage]);

  const fullText = useMemo(() => {
    if (!focusCard) return "";
    return buildWorkbenchNarrative({
      alertId: focusCard.alert.id,
      agencyLabel: focusCard.agencyLabel,
      related: focusCard.relatedEvents,
      priority: priorityPct,
      severity: focusCard.alert.severity,
      agencyCount: focusCard.alert.agencyCount,
      aiTag: focusCard.aiTag,
      isNoise: focusCard.isNoise,
    });
  }, [focusCard, priorityPct]);

  const recentActivity = activity.slice(0, 6);

  return (
    <div className="gov-ai-workbench">
      <div className="gov-ai-workbench-left">
        <div className={`gov-ai-analysis-card${isAnalysing ? " gov-ai-analysis-card--live" : ""}`}>
          <Flex gap="12" vertical="center" className="gov-ai-analysis-head">
            <span className={`gov-ai-orb${isAnalysing ? " gov-ai-orb--active" : ""}`} aria-hidden />
            <Column gap="4" flex={1}>
              <Text variant="label-strong-s" className="gov-ai-stream-label">
                {isAnalysing ? "Live triage" : "WASOC AI"}
              </Text>
              <Text variant="body-default-xs" className="gov-ai-stream-sub">
                {phase === "standby" ? "Standing by for ingest…" : liveTask}
              </Text>
            </Column>
          </Flex>

          {isAnalysing && (
            <div className="gov-triage-stage-pipeline" role="list" aria-label="Triage stages">
              {STAGE_ORDER.map((s) => {
                const idx = stageIndex(s);
                const current = stageIndex(stage);
                const done = idx < current;
                const active = s === stage;
                return (
                  <span
                    key={s}
                    role="listitem"
                    className={`gov-triage-stage-pill${done ? " gov-triage-stage-pill--done" : ""}${active ? " gov-triage-stage-pill--active" : ""}`}
                  >
                    {STAGE_LABELS[s]}
                  </span>
                );
              })}
            </div>
          )}

          {focusCard && (
            <div className="gov-ai-analysis-focus gov-ai-analysis-focus--compact">
              <Flex gap="8" wrap vertical="center">
                {feed && (
                  <span
                    className="gov-feed-badge"
                    style={{
                      color: feed.color,
                      background: feed.bg,
                      borderColor: feed.border,
                    }}
                  >
                    {feed.label}
                  </span>
                )}
                <span className="gov-agency-badge">{focusCard.agencyLabel}</span>
                <Tag size="s" variant={severityTagVariant(focusCard.alert.severity)} label={focusCard.alert.severity} />
                <Tag size="s" variant="neutral" label={focusCard.aiTag} />
              </Flex>
              <span className="gov-ai-analysis-id">{focusCard.alert.id}</span>
              {focusCard.aiHint && (
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  {focusCard.aiHint}
                </Text>
              )}
            </div>
          )}

          {isAnalysing && focusCard ? (
            <AiAnimatedNarrative
              title="Triage analysis"
              thinkingLines={thinkingLines}
              fullText={fullText}
              resetKey={`${focusCard.uid}-${stage}`}
            />
          ) : (
            <Text variant="body-default-s" onBackground="neutral-weak">
              {phase === "standby"
                ? "Triage starts when an alert enters review: corroboration, patterns, agency impact, then priority ranking."
                : "Waiting for next alert in the AI queue…"}
            </Text>
          )}

          {focusCard?.lane === "processing" && (
            <p className="gov-ai-forming-score">
              Forming priority{" "}
              <span style={{ color: scoreColor(priorityPct) }}>{priorityPct}</span>
            </p>
          )}

          {phase === "live" && recentActivity.length > 0 && (
            <Column gap="8" fillWidth className="gov-workbench-activity">
              <Text variant="label-default-xs" onBackground="neutral-weak">
                Live operations
              </Text>
              <ul className="gov-workbench-activity-list">
                {recentActivity.map((line) => (
                  <li
                    key={line.id}
                    className={`gov-workbench-activity-line gov-workbench-activity-line--${line.tone}`}
                  >
                    <span className="gov-workbench-activity-time">{line.time}</span>
                    <span>{line.message}</span>
                  </li>
                ))}
              </ul>
            </Column>
          )}
        </div>
      </div>

      <div className="gov-ai-workbench-right">
        <AiTriageFeedStrip cards={incoming} compact />
        <Text variant="body-default-xs" onBackground="neutral-weak" className="gov-feed-counters-compact">
          In {counts.incoming} · Triage {counts.processing} · Ranked {counts.ranked} · Filtered{" "}
          {counts.discarded}
        </Text>
      </div>
    </div>
  );
}
