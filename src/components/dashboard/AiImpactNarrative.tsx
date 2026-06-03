"use client";

import { useMemo } from "react";
import { AiAnimatedNarrative } from "@/components/dashboard/AiAnimatedNarrative";
import { buildImpactNarrative } from "@/lib/impactAnalysisLines";
import { IncidentIntelligence } from "@/lib/incidentIntelligence";
import { AlertItem } from "@/lib/scoring";

interface AiImpactNarrativeProps {
  alert: AlertItem;
  intel: IncidentIntelligence;
}

export function AiImpactNarrative({ alert, intel }: AiImpactNarrativeProps) {
  const thinkingLines = useMemo(
    () => [
      "Identifying affected assets and environments…",
      "Mapping agencies in the exposure footprint…",
      "Applying tier and verified impact weights…",
      "Estimating citizen-facing and service impact…",
      "Drafting impact summary…",
    ],
    [],
  );

  const fullText = useMemo(() => buildImpactNarrative(alert, intel), [alert, intel]);

  return (
    <AiAnimatedNarrative
      title="Impact assessment"
      thinkingLines={thinkingLines}
      fullText={fullText}
      resetKey={`impact-${alert.id}`}
    />
  );
}
