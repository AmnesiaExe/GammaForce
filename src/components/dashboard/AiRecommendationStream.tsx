"use client";

import { useMemo } from "react";
import { Flex, Text } from "@once-ui-system/core";
import { AiAnimatedNarrative } from "@/components/dashboard/AiAnimatedNarrative";
import { IncidentIntelligence } from "@/lib/incidentIntelligence";
import { AlertItem } from "@/lib/scoring";

interface AiRecommendationStreamProps {
  alert: AlertItem;
  intel: IncidentIntelligence;
  onLinkPress?: (id: string, kind: "alert" | "agency" | "past") => void;
}

export function AiRecommendationStream({
  alert,
  intel,
  onLinkPress,
}: AiRecommendationStreamProps) {
  const thinkingLines = useMemo(
    () => [
      "Matching against WASOC memory graph…",
      intel.seenBefore
        ? `Found ${intel.priorOccurrences} related record(s) from ${intel.lastSeen ?? "prior window"}`
        : "No close prior match, scoring from live telemetry",
      `Ranking ${alert.agencyCount} agencies · lead: ${intel.leadAgencyName}`,
      "Drafting coordinated response…",
    ],
    [alert, intel],
  );

  const fullRecommendation = useMemo(() => {
    const lead = intel.leadAgencyName;
    const past = intel.pastMatches[0];
    const pastBit = past
      ? ` Pattern links to ${past.id} (${past.similarity.toLowerCase()}).`
      : "";
    const kevBit = alert.kevListed ? " CISA KEV listing confirms active exploitation." : "";
    return `${intel.aiConclusion}${pastBit}${kevBit} Recommended action: ${alert.recommendedAction} Start with ${lead} (rank #1 in agency impact).`;
  }, [alert, intel]);

  const badges = (
    <Flex gap="8" wrap>
      <span className="gov-ai-badge">WASOC AI</span>
      {intel.seenBefore && <span className="gov-ai-badge gov-ai-badge--warn">Pattern match</span>}
      {alert.kevListed && <span className="gov-ai-badge gov-ai-badge--danger">KEV</span>}
    </Flex>
  );

  return (
    <AiAnimatedNarrative
      title="AI recommendation"
      thinkingLines={thinkingLines}
      fullText={fullRecommendation}
      resetKey={alert.id}
      badges={badges}
    >
      {(text, done) => {
        const typing = !done;
        const tokens: { type: "text" | "link"; value: string; id?: string; linkKind?: "alert" | "agency" | "past" }[] = [];
        const parts = text.split(
          new RegExp(
            `(${intel.leadAgencyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${alert.id}|${intel.pastMatches.map((p) => p.id).join("|")}|CISA KEV)`,
            "g",
          ),
        );
        for (const part of parts) {
          if (!part) continue;
          if (part === intel.leadAgencyName) {
            tokens.push({ type: "link", value: part, id: alert.scoreBreakdown.agencyRanking[0]?.agencyId, linkKind: "agency" });
          } else if (part === alert.id) {
            tokens.push({ type: "link", value: part, id: alert.id, linkKind: "alert" });
          } else if (intel.pastMatches.some((p) => p.id === part)) {
            tokens.push({ type: "link", value: part, id: part, linkKind: "past" });
          } else if (part === "CISA KEV") {
            tokens.push({ type: "link", value: part, id: "cisa-kev", linkKind: "past" });
          } else {
            tokens.push({ type: "text", value: part });
          }
        }

        return (
          <Text variant="body-default-s" className="gov-ai-narrative-text">
            {tokens.map((t, i) =>
              t.type === "link" ? (
                <button
                  key={`${t.value}-${i}`}
                  type="button"
                  className="gov-ai-recommendation-link"
                  onClick={() => t.id && onLinkPress?.(t.id, t.linkKind ?? "alert")}
                >
                  {t.value}
                </button>
              ) : (
                <span key={i}>{t.value}</span>
              ),
            )}
            {typing && (
              <span className="gov-ai-cursor" aria-hidden>
                |
              </span>
            )}
          </Text>
        );
      }}
    </AiAnimatedNarrative>
  );
}
