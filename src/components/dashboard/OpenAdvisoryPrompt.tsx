"use client";

import { Button, Column, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";

interface OpenAdvisoryPromptProps {
  onGoToRegister?: () => void;
}

export function OpenAdvisoryPrompt({ onGoToRegister }: OpenAdvisoryPromptProps) {
  return (
    <Panel title="Nothing selected" subtitle="Open an alert from the queue to continue">
      <Column gap="16" fillWidth>
        <Text variant="body-default-s" onBackground="neutral-weak">
          This view shows threat score, agency priority, and attack simulation for one
          alert. Go to AI Triage, pick a row, and choose Open details.
        </Text>
        {onGoToRegister && (
          <Button variant="primary" label="Go to alert queue" onClick={onGoToRegister} />
        )}
      </Column>
    </Panel>
  );
}
