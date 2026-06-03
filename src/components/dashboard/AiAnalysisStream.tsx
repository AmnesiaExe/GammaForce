"use client";

import { useEffect, useRef, useState } from "react";
import { Column, Flex, Heading, Row, Text } from "@once-ui-system/core";
import { buildAnalysisStreamSteps } from "@/data/triageCopy";
import type { TriageStats } from "@/data/generatedAlerts";

export type AnalysisStats = Pick<TriageStats, "threatsAnalysed" | "agencies" | "pairings">;

interface AiAnalysisStreamProps {
  stats: AnalysisStats;
  onComplete?: () => void;
}

const DURATION = 3000;

export function AiAnalysisStream({ stats, onComplete }: AiAnalysisStreamProps) {
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const steps = buildAnalysisStreamSteps(stats);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      setCount(Math.round(eased * stats.threatsAnalysed));
      setVisibleSteps(Math.min(steps.length, Math.floor(eased * steps.length) + 1));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDone(true);
        onComplete?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="gov-ai-stream">
      <Column gap="16" fillWidth>
        <Row fillWidth horizontal="between" vertical="center" wrap gap="12">
          <Flex gap="12" vertical="center">
            <span className={`gov-ai-orb${done ? " gov-ai-orb-done" : ""}`} />
            <Column gap="2">
              <Text variant="label-default-xs" onBackground="brand-weak">
                Digital Government prioritisation engine
              </Text>
              <Heading variant="heading-strong-m">
                {done ? "Live prioritisation ready" : "Analysing alerts in real time"}
              </Heading>
            </Column>
          </Flex>
          <Column gap="2" horizontal="end">
            <Heading variant="display-strong-s" className="gov-kpi-value">
              {count.toLocaleString()}
            </Heading>
            <Text variant="label-default-xs" onBackground="neutral-weak">
              alerts scored
            </Text>
          </Column>
        </Row>

        <div className="gov-ai-track">
          <div
            className={`gov-ai-fill${done ? " gov-ai-fill-done" : ""}`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <Column gap="8" fillWidth>
          {steps.slice(0, visibleSteps).map((step, i) => {
            const complete = i < visibleSteps - 1 || done;
            return (
              <Flex key={step} gap="8" vertical="center" className="gov-ai-step">
                <span className={`gov-ai-bullet${complete ? " gov-ai-bullet-done" : ""}`} />
                <Text
                  variant="body-default-xs"
                  onBackground={complete ? "neutral-medium" : "neutral-weak"}
                >
                  {step}
                </Text>
              </Flex>
            );
          })}
        </Column>
      </Column>
    </div>
  );
}
