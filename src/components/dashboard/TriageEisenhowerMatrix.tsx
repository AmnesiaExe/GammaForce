"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { Column, Flex, Tag, Text } from "@once-ui-system/core";
import type { ProcessingStage } from "@/data/aiTriageSimulation";
import type { TriageCard } from "@/hooks/useAiTriageSimulation";
import {
  eisenhowerDotJitter,
  getEisenhowerPlacement,
  type EisenhowerQuadrant,
} from "@/lib/eisenhowerMatrix";
import { severityTagVariant } from "@/lib/scoring";
import { scoreColorHex } from "@/lib/riskColors";

const QUADRANT_GRID: { id: EisenhowerQuadrant; label: string }[] = [
  { id: "interruption", label: "Interruption" },
  { id: "crises", label: "Crises" },
  { id: "distraction", label: "Distraction" },
  { id: "goals", label: "Goals + planning" },
];

const STAGE_LERP: Record<ProcessingStage, number> = {
  flash: 0.18,
  correlate: 0.42,
  predict: 0.68,
  score: 1,
};

const LANE_LABEL: Record<TriageCard["lane"], string> = {
  incoming: "Ingested",
  processing: "Live review",
  ranked: "Ranked",
  discarded: "Filtered",
};

interface DotLayout {
  card: TriageCard;
  left: number;
  bottom: number;
  placement: ReturnType<typeof getEisenhowerPlacement>;
}

function dotPositionForCard(card: TriageCard): { urgency: number; importance: number } {
  const target = getEisenhowerPlacement(card.alert);
  if (card.lane === "incoming") {
    return { urgency: 10, importance: 10 };
  }
  if (card.lane === "processing") {
    const t = STAGE_LERP[card.processingStage] ?? 1;
    return {
      urgency: Math.round(50 + (target.urgency - 50) * t),
      importance: Math.round(50 + (target.importance - 50) * t),
    };
  }
  return { urgency: target.urgency, importance: target.importance };
}

interface TriageEisenhowerMatrixProps {
  cards: TriageCard[];
  phase: "standby" | "live";
  focusUid: string | null;
  selectedAlertId: string | null;
  onSelectCard: (card: TriageCard) => void;
}

export function TriageEisenhowerMatrix({
  cards,
  phase,
  focusUid,
  selectedAlertId,
  onSelectCard,
}: TriageEisenhowerMatrixProps) {
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);

  const dots = useMemo((): DotLayout[] => {
    return cards.map((card, index) => {
      const pos = dotPositionForCard(card);
      const jitter = eisenhowerDotJitter(card.uid, index);
      return {
        card,
        left: Math.min(96, Math.max(4, pos.importance + jitter.dx)),
        bottom: Math.min(96, Math.max(4, pos.urgency + jitter.dy)),
        placement: getEisenhowerPlacement(card.alert),
      };
    });
  }, [cards]);

  const hovered = dots.find((d) => d.card.uid === hoveredUid)?.card ?? null;
  const counts = useMemo(
    () => ({
      incoming: cards.filter((c) => c.lane === "incoming").length,
      processing: cards.filter((c) => c.lane === "processing").length,
      ranked: cards.filter((c) => c.lane === "ranked").length,
      discarded: cards.filter((c) => c.lane === "discarded").length,
    }),
    [cards],
  );

  const handleKeySelect = useCallback(
    (card: TriageCard) => (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectCard(card);
      }
    },
    [onSelectCard],
  );

  return (
    <Column gap="16" fillWidth className="gov-triage-matrix">
      <Flex fillWidth gap="12" wrap vertical="center" horizontal="between">
        <Text variant="body-default-xs" onBackground="neutral-weak">
          {phase === "live"
            ? `${cards.length} alerts on the map. Dots move as AI review completes.`
            : "Waiting for ingest…"}
        </Text>
        <Flex gap="8" wrap>
          <span className="gov-triage-matrix-legend-item gov-triage-matrix-legend-item--incoming">
            Ingest {counts.incoming}
          </span>
          <span className="gov-triage-matrix-legend-item gov-triage-matrix-legend-item--processing">
            Review {counts.processing}
          </span>
          <span className="gov-triage-matrix-legend-item gov-triage-matrix-legend-item--ranked">
            Ranked {counts.ranked}
          </span>
          <span className="gov-triage-matrix-legend-item gov-triage-matrix-legend-item--discarded">
            Filtered {counts.discarded}
          </span>
        </Flex>
      </Flex>

      <div className="gov-triage-matrix-plot">
        <div className="gov-eisenhower-chart-wrap gov-triage-matrix-chart-wrap">
          <span className="gov-eisenhower-axis-y" aria-hidden>
            Urgent
          </span>
          <div className="gov-eisenhower-chart">
            <div className="gov-eisenhower-chart-surface gov-triage-matrix-surface">
              <div className="gov-eisenhower-grid gov-triage-matrix-grid" aria-hidden>
                {QUADRANT_GRID.map((q) => (
                  <div
                    key={q.id}
                    className={`gov-eisenhower-quad gov-eisenhower-quad--${q.id}`}
                  >
                    <span>{q.label}</span>
                  </div>
                ))}
                <div className="gov-eisenhower-midline gov-eisenhower-midline--v" />
                <div className="gov-eisenhower-midline gov-eisenhower-midline--h" />
              </div>

              <div className="gov-triage-matrix-dots" role="presentation">
                {dots.map(({ card, left, bottom, placement }) => {
                  const isFocus = card.uid === focusUid;
                  const isSelected = card.alert.id === selectedAlertId;
                  const isHovered = card.uid === hoveredUid;
                  const color = scoreColorHex(placement.urgency);
                  return (
                    <button
                      key={card.uid}
                      type="button"
                      className={[
                        "gov-triage-matrix-dot",
                        `gov-triage-matrix-dot--${card.lane}`,
                        isFocus ? "gov-triage-matrix-dot--focus" : "",
                        isSelected ? "gov-triage-matrix-dot--selected" : "",
                        isHovered ? "gov-triage-matrix-dot--hover" : "",
                        card.highlight ? `gov-triage-matrix-dot--${card.highlight}` : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        left: `${left}%`,
                        bottom: `${bottom}%`,
                        ["--dot-color" as string]: color,
                      }}
                      title={`${card.alert.id} · ${LANE_LABEL[card.lane]}`}
                      aria-label={`${card.alert.id}, ${card.alert.severity}, ${LANE_LABEL[card.lane]}. Urgent ${placement.urgency}, important ${placement.importance}.`}
                      onClick={() => onSelectCard(card)}
                      onKeyDown={handleKeySelect(card)}
                      onMouseEnter={() => setHoveredUid(card.uid)}
                      onMouseLeave={() => setHoveredUid((u) => (u === card.uid ? null : u))}
                      onFocus={() => setHoveredUid(card.uid)}
                      onBlur={() => setHoveredUid((u) => (u === card.uid ? null : u))}
                    />
                  );
                })}
              </div>
            </div>
            <div className="gov-eisenhower-axis-x" aria-hidden>
              <span>Less important</span>
              <span>More important</span>
            </div>
          </div>
          <div className="gov-eisenhower-axis-y-ticks" aria-hidden>
            <span>More</span>
            <span>Less</span>
          </div>
        </div>

        {hovered && (
          <div className="gov-triage-matrix-tooltip" role="status">
            <Text variant="label-strong-s">{hovered.alert.id}</Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {hovered.displayTitle.slice(0, 72)}
              {hovered.displayTitle.length > 72 ? "…" : ""}
            </Text>
            <Flex gap="8" wrap style={{ marginTop: "0.5rem" }}>
              <Tag size="s" variant={severityTagVariant(hovered.alert.severity)} label={hovered.alert.severity} />
              <Tag size="s" variant="neutral" label={LANE_LABEL[hovered.lane]} />
              <Tag size="s" variant="neutral" label={hovered.aiTag} />
            </Flex>
            <Text variant="body-default-xs" onBackground="neutral-weak" style={{ marginTop: "0.5rem" }}>
              {hovered.agencyLabel} · priority {Math.round(hovered.alert.compositeScore * 100)} · click to
              open
            </Text>
          </div>
        )}
      </div>
    </Column>
  );
}
