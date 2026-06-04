"use client";

import { Text } from "@once-ui-system/core";
import { feedStyle } from "@/data/aiTriageSimulation";
import type { TriageCard } from "@/hooks/useAiTriageSimulation";

interface AiTriageFeedStripProps {
  cards: TriageCard[];
  compact?: boolean;
  /** Horizontal scroll row (workbench ingest zone) */
  horizontal?: boolean;
}

export function AiTriageFeedStrip({
  cards,
  compact = false,
  horizontal = false,
}: AiTriageFeedStripProps) {
  const layoutClass = horizontal ? " gov-feed-strip--horizontal" : "";

  if (cards.length === 0) {
    return (
      <div
        className={`gov-feed-strip gov-feed-strip--empty${compact ? " gov-feed-strip--compact" : ""}${layoutClass}`}
      >
        <Text variant="body-default-xs" onBackground="neutral-weak">
          Waiting for ingest…
        </Text>
      </div>
    );
  }

  return (
    <div className={`gov-feed-strip${compact ? " gov-feed-strip--compact" : ""}${layoutClass}`}>
      <Text variant="label-default-xs" onBackground="neutral-weak" className="gov-feed-strip-title">
        Live feed ({cards.length})
      </Text>
      <div className="gov-feed-strip-track">
        {cards.map((card) => {
          const feed = feedStyle(card.alert.sourceKey);
          const flash = card.sequenceIndex < 3;
          return (
            <div
              key={card.uid}
              className={`gov-feed-chip${flash ? " gov-feed-chip--flash" : ""}${compact ? " gov-feed-chip--compact" : ""}`}
              title={card.displayTitle}
            >
              <span
                className="gov-feed-badge gov-feed-badge--compact"
                style={{
                  color: feed.color,
                  background: feed.bg,
                  borderColor: feed.border,
                }}
              >
                {feed.label}
              </span>
              <span className="gov-feed-chip-agency">{card.agencyLabel}</span>
              <span className="gov-feed-chip-id">{card.alert.id}</span>
              {compact ? (
                <span className="gov-feed-chip-title">{card.displayTitle}</span>
              ) : (
                <Text variant="body-default-xs" className="gov-feed-chip-title">
                  {card.displayTitle}
                </Text>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
