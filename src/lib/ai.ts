import { AlertItem } from "@/lib/scoring";

/** Contract for a future AI analysis provider (REST, MCP, or embedded model). */
export interface AiAnalysisRequest {
  alertId: string;
  prompt: string;
  context: {
    alert: AlertItem;
    relatedAlertIds: string[];
  };
}

export interface AiAnalysisResult {
  summary: string;
  recommendedActions: string[];
  confidence: number;
  model?: string;
}

export type AiAnalysisHandler = (
  request: AiAnalysisRequest,
) => Promise<AiAnalysisResult>;

/** Replace with your provider when AI is wired in. */
export const runAiAnalysis: AiAnalysisHandler = async ({
  prompt,
  context: { alert },
}) => {
  await new Promise((resolve) => setTimeout(resolve, 320));

  return {
    summary: `Analysis preview for ${alert.id}: ${prompt.slice(0, 80)}${prompt.length > 80 ? "..." : ""}\n\nStatewide priority ${Math.round(alert.compositeScore * 100)}% (${alert.severity}). Vulnerability score ${alert.scoreBreakdown.domainScores.final_score}/100 (${alert.scoreBreakdown.cyberRiskLevel}). WA agency impact ${Math.round(alert.scoreBreakdown.agencyExposure * 100)}% across ${alert.agencyCount} agencies. Lead agency: ${alert.scoreBreakdown.agencyRanking[0]?.agency.name ?? "n/a"}. Source ${alert.scoreBreakdown.sourceLabel} at ${alert.scoreBreakdown.sourceReputationPercent}/100.`,
    recommendedActions: [
      alert.recommendedAction,
      "Validate compensating controls and document decision in case record.",
      "Schedule post-incident review if SLA breach occurs.",
    ],
    confidence: 0.72,
    model: "preview-stub",
  };
};
