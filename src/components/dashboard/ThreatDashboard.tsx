"use client";

import { useCallback, useMemo, useState } from "react";
import { Column } from "@once-ui-system/core";
import { ALL_ALERTS, TRIAGE_STATS } from "@/data/generatedAlerts";
import { formatTriageMetaLine } from "@/data/triageCopy";
import { AppChrome, NavSection } from "@/components/dashboard/AppChrome";
import { AdvisoryDetailDrawer } from "@/components/dashboard/AdvisoryDetailDrawer";
import { AiTriageWorkspace } from "@/components/dashboard/AiTriageWorkspace";
import { AgencyRegisterView } from "@/components/dashboard/AgencyRegisterView";
import { ExecutiveSummaryView } from "@/components/dashboard/ExecutiveSummaryView";
import { RawIntelFeedView } from "@/components/dashboard/RawIntelFeedView";
import { ThreatLandscapeView } from "@/components/dashboard/ThreatLandscapeView";
import { sortAlertsByPriority } from "@/lib/prioritisation";

export function ThreatDashboard() {
  const prioritised = useMemo(() => sortAlertsByPriority(ALL_ALERTS), []);
  const queueItems = useMemo(() => prioritised.slice(0, 40), [prioritised]);
  const triagePool = useMemo(() => {
    const lowMed = ALL_ALERTS.filter(
      (a) => a.severity === "Medium" || a.severity === "Low",
    ).slice(0, 28);
    return [...queueItems, ...lowMed];
  }, [queueItems]);
  const [activeNav, setActiveNav] = useState<NavSection>("triage");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openAdvisoryId, setOpenAdvisoryId] = useState<string | null>(null);
  const [drawerContext, setDrawerContext] = useState<{ aiDisregardReason?: string } | null>(
    null,
  );
  const drawerAlert = useMemo(
    () => (openAdvisoryId ? ALL_ALERTS.find((a) => a.id === openAdvisoryId) ?? null : null),
    [openAdvisoryId],
  );

  const openAdvisory = useCallback(
    (id: string, context?: { aiDisregardReason?: string }) => {
      setOpenAdvisoryId(id);
      setDrawerContext(context ?? null);
      setDrawerOpen(true);
    },
    [],
  );

  const metaLine = formatTriageMetaLine(TRIAGE_STATS);

  return (
    <AppChrome activeNav={activeNav} onNavChange={setActiveNav} metaLine={metaLine}>
      {activeNav === "triage" && (
        <Column gap="24" fillWidth className="gov-content-layer">
          <AiTriageWorkspace
            pool={triagePool}
            highlightedId={openAdvisoryId}
            onOpenAdvisory={openAdvisory}
          />
        </Column>
      )}

      {activeNav === "raw" && (
        <Column gap="24" fillWidth className="gov-content-layer">
          <RawIntelFeedView items={ALL_ALERTS} />
        </Column>
      )}

      {activeNav === "agencies" && (
        <Column gap="24" fillWidth className="gov-content-layer">
          <AgencyRegisterView />
        </Column>
      )}

      {activeNav === "analysis" && (
        <Column gap="24" fillWidth className="gov-content-layer">
          <ThreatLandscapeView items={queueItems} onOpenAdvisory={openAdvisory} />
        </Column>
      )}

      {activeNav === "executive" && (
        <Column gap="24" fillWidth className="gov-content-layer">
          <ExecutiveSummaryView />
        </Column>
      )}

      <AdvisoryDetailDrawer
        alert={drawerAlert}
        open={drawerOpen && Boolean(drawerAlert)}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerContext(null);
        }}
        allItems={ALL_ALERTS}
        aiDisregardReason={drawerContext?.aiDisregardReason}
        variant={activeNav === "triage" ? "overlay" : "drawer"}
        onOpenLinkedIncident={(id) => openAdvisory(id, drawerContext ?? undefined)}
      />
    </AppChrome>
  );
}
