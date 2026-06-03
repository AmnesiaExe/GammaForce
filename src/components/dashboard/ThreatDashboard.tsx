"use client";

import { useMemo, useState } from "react";
import { Column, Row } from "@once-ui-system/core";
import { ALERTS } from "@/data/alerts";
import { AiAssistantPanel } from "@/components/dashboard/AiAssistantPanel";
import { AlertInspector } from "@/components/dashboard/AlertInspector";
import { AlertQueue } from "@/components/dashboard/AlertQueue";
import {
  AppChrome,
  NavSection,
} from "@/components/dashboard/AppChrome";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { ExposureNetworkGraph } from "@/components/dashboard/ExposureNetworkGraph";
import { MultiAgencyRegister } from "@/components/dashboard/MultiAgencyRegister";
import { PrioritisedActions } from "@/components/dashboard/PrioritisedActions";
import { RiskAnalytics } from "@/components/dashboard/RiskAnalytics";
import { ScoreBreakdownPanel } from "@/components/dashboard/ScoreBreakdownPanel";
import { WorkflowActivity } from "@/components/dashboard/WorkflowActivity";
import { Category, matrixBand, Severity } from "@/lib/scoring";

type SeverityFilter = "All" | Severity;
type SortKey = "priority" | "agencies" | "cvss" | "received" | "sla";

export function ThreatDashboard() {
  const [activeNav, setActiveNav] = useState<NavSection>("overview");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(ALERTS[0]?.id ?? null);

  const selectedAlert = useMemo(
    () => ALERTS.find((a) => a.id === selectedId) ?? null,
    [selectedId],
  );

  const relatedIds = useMemo(() => {
    if (!selectedAlert) return [];
    return ALERTS.filter(
      (a) =>
        a.id !== selectedAlert.id &&
        (a.category === selectedAlert.category ||
          a.environment === selectedAlert.environment),
    )
      .slice(0, 4)
      .map((a) => a.id);
  }, [selectedAlert]);

  const highlightMatrixKey = selectedAlert
    ? `${matrixBand(selectedAlert.exploitability)}-${matrixBand(selectedAlert.businessImpact)}`
    : undefined;

  const filteredCount = useMemo(() => {
    let result = [...ALERTS];
    if (severityFilter !== "All") {
      result = result.filter((a) => a.severity === severityFilter);
    }
    if (categoryFilter !== "All") {
      result = result.filter((a) => a.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.assignee.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q),
      );
    }
    return result.length;
  }, [severityFilter, categoryFilter, searchQuery]);

  const queueProps = {
    items: ALERTS,
    severityFilter,
    categoryFilter,
    sortKey,
    searchQuery,
    selectedId,
    onSeverityFilter: setSeverityFilter,
    onCategoryFilter: setCategoryFilter,
    onSortKey: setSortKey,
    onSearchQuery: setSearchQuery,
    onSelectAlert: setSelectedId,
  };

  const rightRail = (
    <Column gap="16" fillWidth>
      <AlertInspector alert={selectedAlert} />
      <ScoreBreakdownPanel alert={selectedAlert} />
      <PrioritisedActions items={ALERTS} />
      <AiAssistantPanel alert={selectedAlert} relatedIds={relatedIds} />
    </Column>
  );

  return (
    <AppChrome
      activeNav={activeNav}
      onNavChange={setActiveNav}
      totalAlerts={ALERTS.length}
      visibleAlerts={filteredCount}
      selectedId={selectedId ?? undefined}
    >
      {activeNav === "overview" && (
        <Column gap="24" fillWidth className="gov-content-layer">
          <KpiStrip />
          <ExposureNetworkGraph
            items={ALERTS}
            selectedId={selectedId}
            onSelectAlert={setSelectedId}
          />
          <Row fillWidth gap="16" s={{ direction: "column" }}>
            <Column flex={2} gap="16" fillWidth style={{ minWidth: 0 }}>
              <RiskAnalytics
                items={ALERTS}
                highlightMatrixKey={highlightMatrixKey}
              />
              <MultiAgencyRegister items={ALERTS} />
              <AlertQueue {...queueProps} />
            </Column>
            <Column flex={1} gap="16" fillWidth style={{ minWidth: "18rem" }}>
              {rightRail}
            </Column>
          </Row>
          <WorkflowActivity />
        </Column>
      )}

      {activeNav === "analytics" && (
        <Column gap="24" fillWidth className="gov-content-layer">
          <KpiStrip />
          <ExposureNetworkGraph
            items={ALERTS}
            selectedId={selectedId}
            onSelectAlert={setSelectedId}
          />
          <RiskAnalytics
            items={ALERTS}
            highlightMatrixKey={highlightMatrixKey}
          />
          <WorkflowActivity />
        </Column>
      )}

      {activeNav === "alerts" && (
        <Column gap="24" fillWidth className="gov-content-layer">
          <Row fillWidth gap="16" s={{ direction: "column" }}>
            <Column flex={2} fillWidth style={{ minWidth: 0 }}>
              <AlertQueue {...queueProps} />
            </Column>
            <Column flex={1} gap="16" fillWidth style={{ minWidth: "18rem" }}>
              <AlertInspector alert={selectedAlert} />
              <AiAssistantPanel alert={selectedAlert} relatedIds={relatedIds} />
            </Column>
          </Row>
        </Column>
      )}
    </AppChrome>
  );
}
