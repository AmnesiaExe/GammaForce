"use client";

import { Button, Column, Flex, Heading, Tag, Text } from "@once-ui-system/core";
import { feedStyle } from "@/data/aiTriageSimulation";
import { useFlipList } from "@/hooks/useFlipList";
import type { TriageCard } from "@/hooks/useAiTriageSimulation";
import { formatSla, severityTagVariant } from "@/lib/scoring";
import { scoreColor } from "@/lib/riskColors";

interface AiTriageRankedQueueProps {
  cards: TriageCard[];
  highlightedId?: string | null;
  onOpen: (id: string) => void;
}

export function AiTriageRankedQueue({
  cards,
  highlightedId,
  onOpen,
}: AiTriageRankedQueueProps) {
  const flipRef = useFlipList(cards.map((c) => c.uid).join("|"), false);

  return (
    <div ref={flipRef} className="gov-ranked-queue-list">
      {cards.length === 0 ? (
        <div className="gov-triage-lane-empty">
          <Text variant="body-default-s" onBackground="neutral-weak">
            Ranked alerts will move up into this list from the AI queue below…
          </Text>
        </div>
      ) : (
        cards.map((card, i) => {
          const feed = feedStyle(card.alert.sourceKey);
          const priorityPct = Math.round(card.alert.compositeScore * 100);
          const hl = card.highlight ? ` gov-triage-card--${card.highlight}` : "";
          const selected = highlightedId === card.alert.id;

          return (
            <div
              key={card.uid}
              data-flip-id={card.uid}
              className={`gov-ranked-row${hl}${selected ? " gov-ranked-row--selected" : ""}`}
            >
              <span className="gov-ranked-rank">#{i + 1}</span>
              <Column gap="8" flex={1} style={{ minWidth: 0 }}>
                <Flex gap="8" wrap vertical="center">
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
                  <span className="gov-agency-badge">{card.agencyLabel}</span>
                  <Tag size="s" variant={severityTagVariant(card.alert.severity)} label={card.alert.severity} />
                  {card.alert.kevListed && <Tag size="s" variant="danger" label="KEV" />}
                </Flex>
                <Text variant="label-strong-s">{card.displayTitle}</Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  {card.alert.id} · {formatSla(card.alert.slaHoursRemaining)}
                </Text>
              </Column>
              <Column gap="8" horizontal="end" className="gov-ranked-row-actions">
                <Heading
                  variant="heading-strong-l"
                  className="gov-kpi-value"
                  style={{ color: scoreColor(priorityPct) }}
                >
                  {priorityPct}
                </Heading>
                <Button
                  size="s"
                  variant="primary"
                  label="Open details"
                  onClick={() => onOpen(card.alert.id)}
                />
              </Column>
            </div>
          );
        })
      )}
    </div>
  );
}
