"use client";

import { useMemo } from "react";
import { Column, Flex, Heading, Line, Text } from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { ALERTS } from "@/data/alerts";
import { scoreColor } from "@/lib/riskColors";

export function AttackSimulationView() {
  const simulation = useMemo(() => {
    const top = [...ALERTS].sort((a, b) => b.compositeScore - a.compositeScore)[0];
    if (!top) return null;

    const vulnScore = top.scoreBreakdown.domainScores.final_score;
    const topAgency = top.scoreBreakdown.agencyRanking[0]?.agency.name ?? "affected WA agency";

    return {
      threatId: top.id,
      threatName: top.title,
      attack_path: [
        `Initial access via ${top.environment.toLowerCase()} at ${topAgency}`,
        "Attacker establishes persistence and enumerates Active Directory",
        "Lateral movement toward shared WA Government identity services",
        `Privilege escalation using ${top.kevListed ? "known exploited" : "high-severity"} vulnerability chain`,
        `Ransomware or data exfiltration across ${top.agencyCount} connected WA agencies`,
        "Citizen-facing services disrupted if Tier 1 agencies remain unpatched",
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
          ? "HIGH PROBABILITY OF STATEWIDE IMPACT IF UNMITIGATED"
          : "ELEVATED RISK OF MULTI-AGENCY BREACH",
    };
  }, []);

  if (!simulation) return null;

  return (
    <Column gap="16" fillWidth>
      <Panel
        title="Attack simulation"
        subtitle={`Breach scenario for top-ranked threat ${simulation.threatId}`}
      >
        <Column gap="16" fillWidth>
          <Text variant="body-default-s" onBackground="neutral-weak">
            {simulation.threatName}
          </Text>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Time to compromise: {simulation.time_to_full_compromise}
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
        </Column>
      </Panel>

      <Panel title="Risk escalation" subtitle="Score progression through kill chain">
        <Column gap="12" fillWidth>
          {simulation.risk_progression.map((stage) => (
            <Column key={stage.stage} gap="8" fillWidth>
              <Flex horizontal="between" fillWidth>
                <Text variant="label-strong-s">{stage.stage}</Text>
                <Text variant="label-default-s" style={{ color: scoreColor(stage.score) }}>
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
      </Panel>

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
        <Text variant="body-default-s" onBackground="neutral-weak">
          Patching the highest-ranked vulnerability and prioritising Tier 1 agencies in the
          ranking table reduces estimated breach probability by up to 82% within 24 hours.
        </Text>
      </Column>
    </Column>
  );
}
