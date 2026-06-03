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
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    summary: `Analysis preview for ${alert.id}: ${prompt.slice(0, 80)}${prompt.length > 80 ? "..." : ""}\n\nPriority ${Math.round(alert.compositeScore * 100)}% (${alert.severity}). Agency exposure ${Math.round(alert.scoreBreakdown.agencyExposure * 100)}% across ${alert.agencyCount} agencies. Source ${alert.scoreBreakdown.sourceLabel} at ${alert.scoreBreakdown.sourceReputationPercent}/100. Technical inputs: CVSS ${alert.cvss || "N/A"}, exploitability ${alert.exploitability}/5.`,
    recommendedActions: [
      alert.recommendedAction,
      "Validate compensating controls and document decision in case record.",
      "Schedule post-incident review if SLA breach occurs.",
    ],
    confidence: 0.72,
    model: "preview-stub",
  };
};
