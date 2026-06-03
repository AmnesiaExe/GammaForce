"use client";

import { Column, Flex, Tag, Text } from "@once-ui-system/core";
import { AlertItem } from "@/lib/scoring";

interface AiTriageBannerProps {
  alert: AlertItem;
}

export function AiTriageBanner({ alert }: AiTriageBannerProps) {
  const b = alert.scoreBreakdown;
  const reasons = b.explanation.reasons.slice(0, 4);
  const priorityPct = Math.round(alert.compositeScore * 100);

  return (
    <div className="gov-ai-triage-banner">
      <Flex gap="16" vertical="start" fillWidth wrap>
        <Flex gap="12" vertical="center" style={{ flexShrink: 0 }}>
          <span className="gov-ai-orb gov-ai-orb-done" aria-hidden />
          <Column gap="4">
            <Flex gap="8" vertical="center" wrap>
              <Text variant="label-strong-s" className="gov-ai-triage-title">
                Prioritisation complete
              </Text>
              <Tag size="s" variant="brand" label="WASOC scoring" />
            </Flex>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Threat seriousness + affected WA agencies → priority score {priorityPct}
            </Text>
          </Column>
        </Flex>
      </Flex>

      <Text variant="body-default-s" className="gov-ai-triage-summary">
        {b.explanation.summary}
      </Text>

      {reasons.length > 0 && (
        <Column gap="8" fillWidth className="gov-ai-triage-reasons">
          <Text variant="label-default-xs" onBackground="brand-weak">
            Why this is high priority
          </Text>
          <ul className="gov-ai-triage-list">
            {reasons.map((r) => (
              <li key={r}>
                <Text variant="body-default-xs">{r}</Text>
              </li>
            ))}
          </ul>
        </Column>
      )}

      <Text variant="body-default-xs" onBackground="neutral-weak" className="gov-ai-triage-rec">
        {b.explanation.recommendation}
      </Text>
    </div>
  );
}
