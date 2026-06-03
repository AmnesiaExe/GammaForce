"use client";

import { useMemo } from "react";
import { Column, Flex, Heading, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AlertItem } from "@/lib/scoring";
import { scoreColor } from "@/lib/riskColors";

export function AttackSimulationPanel({ alert }: { alert: AlertItem }) {
  const simulation = useMemo(() => {
    const vulnScore = alert.scoreBreakdown.domainScores.final_score;
    const topAgency =
      alert.scoreBreakdown.agencyRanking[0]?.agency.name ?? "affected WA agency";

    return {
      attack_path: [
        `Initial access via ${alert.environment.toLowerCase()} at ${topAgency}`,
        "Attacker establishes persistence and enumerates Active Directory",
        "Lateral movement toward shared WA Government identity services",
        `${alert.kevListed ? "Known exploited" : "High-severity"} vulnerability chain used for privilege escalation`,
        `Impact spreads across ${alert.agencyCount} connected WA agencies`,
        "Citizen-facing services at risk if Tier 1 agencies remain unpatched",
      ],
      risk_progression: [
        { stage: "Initial access", score: Math.round(vulnScore * 0.65) },
        { stage: "Lateral movement", score: Math.round(vulnScore * 0.78) },
        { stage: "Privilege escalation", score: Math.round(vulnScore * 0.9) },
        { stage: "Data exfiltration", score: Math.min(99, Math.round(vulnScore * 1.05)) },
      ],
      time_to_full_compromise: vulnScore >= 85 ? "4–6 hours" : "12–24 hours",
      outcome:
        vulnScore >= 85
          ? "High probability of statewide impact if unmitigated"
          : "Elevated risk of multi-agency breach",
    };
  }, [alert]);

  return (
    <Panel
      title="Simulated attack path"
      subtitle={`What could happen if ${alert.id} is not addressed in time`}
    >
      <Column gap="16" fillWidth>
        <Text variant="label-default-xs" onBackground="neutral-weak">
          Estimated time to compromise: {simulation.time_to_full_compromise}
        </Text>

        {simulation.attack_path.map((step, i) => (
          <Flex key={step} gap="12" vertical="start">
            <Heading
              variant="heading-strong-s"
              className="gov-kpi-value"
              style={{
                color: i >= 4 ? "var(--danger-solid)" : "var(--warning-solid)",
                minWidth: "2rem",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </Heading>
            <Text variant="body-default-s">{step}</Text>
          </Flex>
        ))}

        <Column gap="12" fillWidth paddingTop="8">
          <Text variant="label-default-s" onBackground="neutral-weak">
            Risk escalation
          </Text>
          {simulation.risk_progression.map((stage) => (
            <Column key={stage.stage} gap="8" fillWidth>
              <Flex horizontal="between" fillWidth>
                <Text variant="label-default-xs">{stage.stage}</Text>
                <Text variant="label-default-xs" style={{ color: scoreColor(stage.score) }}>
                  {stage.score}
                </Text>
              </Flex>
              <div className="gov-factor-track">
                <div
                  className="gov-factor-fill"
                  style={{
                    width: `${stage.score}%`,
                    background: scoreColor(stage.score),
                  }}
                />
              </div>
            </Column>
          ))}
        </Column>

        <Column
          gap="8"
          padding="16"
          background="danger-weak"
          radius="m"
          border="danger-alpha-medium"
        >
          <Text variant="label-strong-s" onBackground="danger-strong">
            {simulation.outcome}
          </Text>
        </Column>
      </Column>
    </Panel>
  );
}
