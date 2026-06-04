"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Column,
  Flex,
  Heading,
  Tag,
  Text,
} from "@once-ui-system/core";
import { AgencyRankingWithContacts } from "@/components/dashboard/AgencyRankingWithContacts";
import { AiImpactNarrative } from "@/components/dashboard/AiImpactNarrative";
import { AiRecommendationStream } from "@/components/dashboard/AiRecommendationStream";
import { CalculationDebugPanel } from "@/components/dashboard/CalculationDebugPanel";
import { PatternLinksPanel } from "@/components/dashboard/PatternLinksPanel";
import { Panel } from "@/components/dashboard/Panel";
import { ThreatProgressionTimeline } from "@/components/dashboard/ThreatProgressionTimeline";
import { EisenhowerMatrix } from "@/components/dashboard/EisenhowerMatrix";
import { ScoreBar } from "@/components/dashboard/ScoreBar";
import { buildIncidentIntelligence } from "@/lib/incidentIntelligence";
import { AlertItem, severityTagVariant } from "@/lib/scoring";
import { scoreColor, scoreColorHex } from "@/lib/riskColors";

function ScoreRing({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, value));
  const stroke = scoreColorHex(pct);
  const dash = 100 - pct;
  return (
    <div className="gov-score-ring">
      <svg viewBox="0 0 120 120" className="gov-score-ring-svg" aria-hidden>
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(148, 163, 184, 0.28)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={dash}
        />
      </svg>
      <Column gap="8" horizontal="center" className="gov-score-ring-label">
        <Heading variant="display-strong-s" style={{ color: scoreColor(pct) }}>
          {pct}
        </Heading>
        <Text variant="label-default-xs" onBackground="neutral-weak">
          {label}
        </Text>
      </Column>
    </div>
  );
}

function ScoreTile({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <Column
      gap="8"
      padding="12"
      radius="m"
      background="neutral-weak"
      border="neutral-alpha-weak"
      flex={1}
      style={{ minWidth: "7rem" }}
    >
      <Text variant="label-default-xs" onBackground="neutral-weak">
        {title}
      </Text>
      <Heading variant="heading-strong-l" style={{ color: scoreColorHex(value) }}>
        {value}
      </Heading>
      <Text variant="body-default-xs" onBackground="neutral-weak">
        {subtitle}
      </Text>
    </Column>
  );
}

function DomainBars({ alert }: { alert: AlertItem }) {
  const d = alert.scoreBreakdown.domainScores;
  const bars = [
    { label: "Exploit", value: d.exploitability },
    { label: "Exposure", value: d.exposure },
    { label: "Impact", value: d.asset_impact },
    { label: "Intel", value: d.intel_confidence },
    { label: "Fix", value: d.remediation },
  ];
  return (
    <div className="gov-domain-bars">
      {bars.map((b) => (
        <div key={b.label} className="gov-domain-bar-row">
          <Text variant="label-default-xs" className="gov-domain-bar-label">
            {b.label}
          </Text>
          <ScoreBar value={b.value} />
          <Text variant="label-default-xs">{Math.round(b.value)}</Text>
        </div>
      ))}
    </div>
  );
}

interface IncidentDetailOverlayContentProps {
  alert: AlertItem;
  aiDisregardReason?: string;
  allItems?: AlertItem[];
  onOpenLinkedIncident?: (id: string) => void;
}

export function IncidentDetailOverlayContent({
  alert,
  aiDisregardReason,
  allItems = [],
  onOpenLinkedIncident,
}: IncidentDetailOverlayContentProps) {
  const intel = useMemo(
    () => buildIncidentIntelligence(alert, { allItems, aiDisregardReason }),
    [alert, allItems, aiDisregardReason],
  );
  const [graphHighlight, setGraphHighlight] = useState<string | null>(null);
  const [agencyHighlight, setAgencyHighlight] = useState<string | null>(null);

  const b = alert.scoreBreakdown;
  const d = b.domainScores;
  const priorityPct = Math.round(alert.compositeScore * 100);
  const threatScore = d.final_score;
  const agencyImpactPct = Math.round(b.agencyImpact.composite * 100);

  const onRecommendationLink = useCallback(
    (id: string, kind: "alert" | "agency" | "past") => {
      if (kind === "agency") {
        setAgencyHighlight(id);
        return;
      }
      if (kind === "past") {
        const link = intel.linkedIncidents.find(
          (l) => l.displayId === id || l.openableId === id,
        );
        if (link && onOpenLinkedIncident) {
          onOpenLinkedIncident(link.openableId);
          return;
        }
      }
      setGraphHighlight(id === "cisa-kev" ? "cisa-kev" : id);
    },
    [intel.linkedIncidents, onOpenLinkedIncident],
  );

  return (
    <div className="gov-detail-overlay-layout">
      <div className="gov-detail-main-scroll">
        {aiDisregardReason && (
          <div className="gov-detail-disregard-banner">
            <Text variant="label-strong-s">AI suggested deprioritising this alert</Text>
            <Text variant="body-default-s" onBackground="neutral-weak">
              {aiDisregardReason}
            </Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              This may be a false positive. Review the AI reasoning below and contact agencies if needed.
            </Text>
          </div>
        )}

        <section className="gov-detail-hero">
          <Flex fillWidth gap="20" wrap vertical="center" horizontal="between">
            <ScoreRing value={priorityPct} label="Priority" />
            <Column gap="8" flex={1} style={{ minWidth: "12rem" }}>
              <Flex gap="8" wrap vertical="center">
                <Tag variant={severityTagVariant(alert.severity)} size="s" label={alert.severity} />
                <Tag variant="neutral" size="s" label={b.cyberRiskLevel} />
                {alert.kevListed && <Tag variant="danger" size="s" label="KEV" />}
              </Flex>
              <Text variant="body-default-s" onBackground="neutral-weak">
                {b.explanation.recommendation}
              </Text>
            </Column>
            <Column gap="8" style={{ minWidth: "10rem", flex: 1 }}>
              <DomainBars alert={alert} />
            </Column>
          </Flex>
          <Flex fillWidth gap="12" wrap style={{ marginTop: "0.75rem" }}>
            <ScoreTile title="Threat score" value={threatScore} subtitle="0 to 100" />
            <ScoreTile title="Agency impact" value={agencyImpactPct} subtitle={`${b.agencyImpact.agencyCount} agencies`} />
            <ScoreTile title="Statewide priority" value={priorityPct} subtitle="Combined value" />
          </Flex>
        </section>

        <div className="gov-detail-split gov-detail-split--wide-right">
          <Column gap="16" fillWidth className="gov-detail-split-col">
            <EisenhowerMatrix alert={alert} />
            <AiRecommendationStream alert={alert} intel={intel} onLinkPress={onRecommendationLink} />

            <Panel title="Scoring rationale" subtitle="Why the model ranked this alert" padding="20">
              <Column gap="8" fillWidth>
                {intel.whyAiScoredHigh.map((line) => (
                  <Text key={line} variant="body-default-s">
                    · {line}
                  </Text>
                ))}
              </Column>
            </Panel>

            <PatternLinksPanel
              intel={intel}
              highlightId={graphHighlight}
              onHighlight={setGraphHighlight}
              onOpenIncident={onOpenLinkedIncident}
            />
          </Column>

          <Column gap="16" fillWidth className="gov-detail-split-col gov-detail-split-col--right">
            <ThreatProgressionTimeline
              alert={alert}
              intel={intel}
              aiDisregardReason={aiDisregardReason}
            />
            <AiImpactNarrative alert={alert} intel={intel} />
            <AgencyRankingWithContacts
              alert={alert}
              contacts={intel.agencyContacts}
              leadAgencyName={intel.leadAgencyName}
              highlightAgencyId={agencyHighlight}
            />
          </Column>
        </div>

        <footer className="gov-detail-overlay-footer-inline">
          <CalculationDebugPanel alert={alert} />
        </footer>
      </div>
    </div>
  );
}
