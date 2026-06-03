"use client";

import { useCallback, useState } from "react";
import {
  Button,
  Column,
  Flex,
  Line,
  Row,
  Spinner,
  Text,
  Textarea,
} from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { runAiAnalysis } from "@/lib/ai";
import { AlertItem } from "@/lib/scoring";

const QUICK_PROMPTS = [
  "Summarise blast radius",
  "Draft containment steps",
  "Compare similar alerts",
  "Executive briefing points",
];

interface AiAssistantPanelProps {
  alert: AlertItem | null;
  relatedIds: string[];
}

export function AiAssistantPanel({ alert, relatedIds }: AiAssistantPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastModel, setLastModel] = useState<string | null>(null);

  const runAnalysis = useCallback(
    async (text: string) => {
      if (!alert || !text.trim()) return;
      setLoading(true);
      setOutput("");
      try {
        const result = await runAiAnalysis({
          alertId: alert.id,
          prompt: text.trim(),
          context: { alert, relatedAlertIds: relatedIds },
        });
        const actions = result.recommendedActions
          .map((a, i) => `${i + 1}. ${a}`)
          .join("\n");
        setOutput(`${result.summary}\n\nRecommended actions:\n${actions}`);
        setLastModel(result.model ?? null);
      } finally {
        setLoading(false);
      }
    },
    [alert, relatedIds],
  );

  return (
    <Panel
      title="Analyst assistance"
      subtitle="Reserved for AI-assisted triage. Connect your inference provider via src/lib/ai.ts"
      data-ai-panel="true"
    >
      {!alert ? (
        <Text variant="body-default-s" onBackground="neutral-weak">
          Select a case from the register to generate contextual summaries,
          containment guidance, or executive briefing material.
        </Text>
      ) : (
        <Column gap="16" fillWidth>
          <Row gap="8" wrap fillWidth>
            {QUICK_PROMPTS.map((label) => (
              <Button
                key={label}
                variant="secondary"
                size="s"
                onClick={() => {
                  setPrompt(label);
                  void runAnalysis(label);
                }}
              >
                {label}
              </Button>
            ))}
          </Row>

          <Textarea
            id="ai-prompt"
            label="Analysis request"
            placeholder="Describe what you need from the assistant for this case"
            lines={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />

          <Flex gap="12" vertical="center">
            <Button
              variant="primary"
              size="m"
              onClick={() => void runAnalysis(prompt)}
              disabled={loading || !prompt.trim()}
            >
              Run analysis
            </Button>
            {loading && <Spinner size="s" />}
            {lastModel && !loading && (
              <Text variant="label-default-xs" onBackground="neutral-weak">
                Model: {lastModel}
              </Text>
            )}
          </Flex>

          <Line background="neutral-alpha-weak" />

          <Column
            gap="8"
            fillWidth
            padding="16"
            background="neutral-weak"
            border="neutral-alpha-weak"
            radius="m"
          >
            <Text variant="label-default-xs" onBackground="neutral-weak">
              Output
            </Text>
            <div className="gov-ai-output">
              {output || (
                <Text variant="body-default-s" onBackground="neutral-weak">
                  Analysis output will appear here after you run a request.
                </Text>
              )}
            </div>
          </Column>
        </Column>
      )}
    </Panel>
  );
}
