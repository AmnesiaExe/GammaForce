"use client";

import { Button, Flex, Tag, Text } from "@once-ui-system/core";
import type { TriageCard } from "@/hooks/useAiTriageSimulation";
import { severityTagVariant } from "@/lib/scoring";

function reasonTag(reason: string): { label: string; variant: "neutral" | "warning" | "danger" } {
  const r = reason.toLowerCase();
  if (r.includes("duplicate")) return { label: "Duplicate", variant: "warning" };
  return { label: "Duplicate", variant: "warning" };
}

interface AiTriageDiscardedListProps {
  cards: TriageCard[];
  onOpen: (id: string, context?: { aiDisregardReason?: string }) => void;
}

export function AiTriageDiscardedList({ cards, onOpen }: AiTriageDiscardedListProps) {
  return (
    <div className="gov-discarded-strip">
      {cards.map((card) => {
        const tag = reasonTag(card.disregardReason ?? "");
        return (
          <div key={card.uid} className="gov-discarded-chip">
            <Flex gap="8" wrap vertical="center">
              <Text variant="label-strong-s">{card.alert.id}</Text>
              <Tag size="s" variant={severityTagVariant(card.alert.severity)} label={card.alert.severity} />
              <Tag size="s" variant={tag.variant} label={tag.label} />
            </Flex>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {card.disregardReason ?? "Filtered · open details if you disagree"}
            </Text>
            <Button
              size="s"
              variant="secondary"
              label="Open details"
              onClick={() =>
                onOpen(card.alert.id, { aiDisregardReason: card.disregardReason })
              }
            />
          </div>
        );
      })}
    </div>
  );
}
