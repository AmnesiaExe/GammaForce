"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Column,
  Flex,
  Heading,
  Line,
  Tag,
  Text,
} from "@once-ui-system/core";
import { AgencyPriorityRanking } from "@/components/dashboard/AgencyPriorityRanking";
import { AiTriageBanner } from "@/components/dashboard/AiTriageBanner";
import { CalculationDebugPanel } from "@/components/dashboard/CalculationDebugPanel";
import { IncidentDetailOverlayContent } from "@/components/dashboard/IncidentDetailOverlayContent";
import { PriorityBreakdownPanel } from "@/components/dashboard/PriorityBreakdownPanel";
import { AlertItem, severityTagVariant, statusTagVariant } from "@/lib/scoring";
import { scoreColor } from "@/lib/riskColors";

const AI_STEPS = [
  "Scoring how serious this alert is…",
  "Checking exploitability and exposure…",
  "Finding which WA agencies are affected…",
  "Ranking who to contact first…",
  "Preparing summary and recommended actions…",
];

interface AdvisoryDetailDrawerProps {
  alert: AlertItem | null;
  open: boolean;
  onClose: () => void;
  allItems: AlertItem[];
  aiDisregardReason?: string;
  variant?: "drawer" | "overlay";
  onOpenLinkedIncident?: (id: string) => void;
}

export function AdvisoryDetailDrawer({
  alert,
  open,
  onClose,
  allItems,
  aiDisregardReason,
  variant = "drawer",
  onOpenLinkedIncident,
}: AdvisoryDetailDrawerProps) {
  const [aiReady, setAiReady] = useState(false);
  const [aiStep, setAiStep] = useState(0);

  useEffect(() => {
    if (!open || !alert) {
      setAiReady(false);
      setAiStep(0);
      return;
    }
    if (variant === "overlay") {
      setAiReady(true);
      setAiStep(AI_STEPS.length - 1);
      return;
    }
    setAiReady(false);
    setAiStep(0);
    const stepInterval = window.setInterval(() => {
      setAiStep((s) => Math.min(s + 1, AI_STEPS.length - 1));
    }, 150);
    const readyTimer = window.setTimeout(() => setAiReady(true), 750);
    return () => {
      window.clearInterval(stepInterval);
      window.clearTimeout(readyTimer);
    };
  }, [open, alert?.id, variant]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && variant === "overlay") {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, variant]);

  if (!open || !alert) return null;

  const priorityPct = Math.round(alert.compositeScore * 100);
  const b = alert.scoreBreakdown;
  const isOverlay = variant === "overlay";

  const header = (
    <Flex
      horizontal="between"
      vertical="center"
      padding="20"
      paddingX="24"
      fillWidth
      className={isOverlay ? "gov-detail-overlay-header" : "gov-drawer-header"}
      wrap
      gap="16"
    >
      <Column gap="8" style={{ minWidth: 0 }}>
        <Text variant="label-default-xs" onBackground="brand-weak">
          WASOC alert (TLP:CLEAR)
        </Text>
        <Heading id="advisory-drawer-title" variant="heading-strong-m">
          {alert.id}
        </Heading>
        <Text variant="body-default-s" onBackground="neutral-weak">
          {alert.title}
        </Text>
        {!isOverlay && (
          <Flex gap="8" wrap>
            <Tag variant={severityTagVariant(alert.severity)} size="s" label={alert.severity} />
            <Tag variant={statusTagVariant(alert.status)} size="s" label={alert.status} />
            {alert.kevListed && <Tag variant="danger" size="s" label="KEV" />}
          </Flex>
        )}
      </Column>
      <Button
        variant="primary"
        label={isOverlay ? "Back to live scanner" : "Close"}
        onClick={onClose}
      />
    </Flex>
  );

  const drawerBody = (
    <div className="gov-drawer-body">
      {!aiReady ? (
        <Column gap="20" padding="24" fillWidth className="gov-drawer-ai-loading">
          <Flex gap="12" vertical="center">
            <span className="gov-ai-orb" aria-hidden />
            <Column gap="4">
              <Text variant="label-strong-s" className="gov-ai-loading-title">
                Analysing this alert
              </Text>
              <Text variant="body-default-xs" onBackground="neutral-weak">
                Scoring this alert and matching it to WA agencies…
              </Text>
            </Column>
          </Flex>
          <div className="gov-ai-track">
            <div className="gov-ai-fill" style={{ width: `${35 + aiStep * 12}%` }} />
          </div>
          <Column gap="8" fillWidth>
            {AI_STEPS.map((step, i) => (
              <Flex
                key={step}
                gap="8"
                vertical="center"
                className={`gov-ai-step${i <= aiStep ? " gov-ai-step-active" : ""}`}
              >
                <span
                  className={`gov-ai-bullet${i < aiStep ? " gov-ai-bullet-done" : i === aiStep ? " gov-ai-bullet-active" : ""}`}
                  aria-hidden
                />
                <Text
                  variant="body-default-xs"
                  onBackground={i <= aiStep ? undefined : "neutral-weak"}
                >
                  {step}
                </Text>
              </Flex>
            ))}
          </Column>
        </Column>
      ) : (
        <Column gap="24" padding="24" fillWidth className="gov-drawer-content">
          <Column
            gap="8"
            padding="16"
            radius="m"
            background="neutral-weak"
            border="neutral-alpha-weak"
            fillWidth
          >
            <Text variant="label-default-xs" onBackground="neutral-weak">
              Prioritisation at a glance
            </Text>
            <Heading
              variant="display-strong-s"
              className="gov-kpi-value"
              style={{ color: scoreColor(priorityPct) }}
            >
              {priorityPct}
            </Heading>
            <Text variant="body-default-s" onBackground="neutral-weak">
              {b.explanation.recommendation}
            </Text>
          </Column>

          <AiTriageBanner alert={alert} />
          <PriorityBreakdownPanel alert={alert} />
          <AgencyPriorityRanking alert={alert} items={allItems} />

          <Line background="neutral-alpha-weak" />

          <Column gap="8" fillWidth>
            <Text variant="label-default-s" onBackground="neutral-weak">
              Recommended response
            </Text>
            <Text variant="body-default-s">{alert.recommendedAction}</Text>
          </Column>

          <CalculationDebugPanel alert={alert} />
        </Column>
      )}
    </div>
  );

  if (isOverlay) {
    return (
      <div className="gov-detail-overlay" role="dialog" aria-modal="true">
        <div className="gov-detail-overlay-panel">
          {header}
          <div className="gov-detail-overlay-body">
            <IncidentDetailOverlayContent
              alert={alert}
              allItems={allItems}
              aiDisregardReason={aiDisregardReason}
              onOpenLinkedIncident={onOpenLinkedIncident}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gov-drawer-backdrop" onClick={onClose} role="presentation">
      <div
        className="gov-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advisory-drawer-title"
      >
        {header}
        {drawerBody}
      </div>
    </div>
  );
}
