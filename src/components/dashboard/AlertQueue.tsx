"use client";

import { useMemo } from "react";
import {
  Chip,
  Column,
  Flex,
  Input,
  LinearGauge,
  Row,
  SegmentedControl,
  Select,
  Table,
  Tag,
  Text,
} from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { CATEGORY_FILTER_CHIPS } from "@/data/metrics";
import {
  AlertItem,
  Category,
  formatSla,
  SEVERITY_ORDER,
  Severity,
  severityTagVariant,
  statusTagVariant,
} from "@/lib/scoring";

type SeverityFilter = "All" | Severity;
type SortKey = "priority" | "agencies" | "cvss" | "received" | "sla";

interface AlertQueueProps {
  items: AlertItem[];
  severityFilter: SeverityFilter;
  categoryFilter: "All" | Category;
  sortKey: SortKey;
  searchQuery: string;
  selectedId: string | null;
  onSeverityFilter: (v: SeverityFilter) => void;
  onCategoryFilter: (v: "All" | Category) => void;
  onSortKey: (v: SortKey) => void;
  onSearchQuery: (v: string) => void;
  onSelectAlert: (id: string) => void;
}

export function AlertQueue({
  items,
  severityFilter,
  categoryFilter,
  sortKey,
  searchQuery,
  selectedId,
  onSeverityFilter,
  onCategoryFilter,
  onSortKey,
  onSearchQuery,
  onSelectAlert,
}: AlertQueueProps) {
  const filtered = useMemo(() => {
    let result = [...items];
    const q = searchQuery.trim().toLowerCase();

    if (severityFilter !== "All") {
      result = result.filter((i) => i.severity === severityFilter);
    }
    if (categoryFilter !== "All") {
      result = result.filter((i) => i.category === categoryFilter);
    }
    if (q) {
      result = result.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.assignee.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      if (sortKey === "agencies") {
        return (
          b.agencyCount - a.agencyCount ||
          b.compositeScore - a.compositeScore
        );
      }
      if (sortKey === "cvss") return b.cvss - a.cvss;
      if (sortKey === "sla") return a.slaHoursRemaining - b.slaHoursRemaining;
      if (sortKey === "received") {
        return (
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        );
      }
      return (
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        b.compositeScore - a.compositeScore
      );
    });

    return result;
  }, [items, severityFilter, categoryFilter, searchQuery, sortKey]);

  const tableData = useMemo(
    () => ({
      headers: [
        { content: "Reference", key: "id" },
        { content: "Alert detail", key: "title" },
        { content: "Workflow", key: "status" },
        { content: "Priority", key: "severity" },
        { content: "Agencies", key: "agencies" },
        { content: "Source trust", key: "source" },
        { content: "CVSS", key: "cvss" },
        { content: "Priority score", key: "score" },
        { content: "SLA", key: "sla" },
        { content: "Owner", key: "assignee" },
      ],
      rows: filtered.map((item) => [
        <Text
          key={`${item.id}-id`}
          variant="label-default-s"
          onBackground={selectedId === item.id ? "brand-strong" : undefined}
        >
          {item.id}
        </Text>,
        <Column key={`${item.id}-title`} gap="4">
          <Text variant="body-default-s">{item.title}</Text>
          <Row gap="8" wrap>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {item.category}
            </Text>
            {item.kevListed && <Tag variant="danger" size="s" label="KEV" />}
          </Row>
        </Column>,
        <Tag
          key={`${item.id}-status`}
          variant={statusTagVariant(item.status)}
          size="s"
          label={item.status}
        />,
        <Tag
          key={`${item.id}-sev`}
          variant={severityTagVariant(item.severity)}
          size="s"
          label={item.severity}
        />,
        <Column key={`${item.id}-agencies`} gap="4">
          <Text
            variant="heading-strong-s"
            className="gov-kpi-value"
            onBackground={item.agencyCount >= 5 ? "brand-strong" : undefined}
          >
            {item.agencyCount}
          </Text>
          {item.agencyCount >= 5 && (
            <Text variant="label-default-xs" onBackground="brand-weak">
              statewide
            </Text>
          )}
        </Column>,
        <Text key={`${item.id}-source`} variant="body-default-xs" className="gov-kpi-value">
          {item.scoreBreakdown.sourceReputationPercent}%
        </Text>,
        <Text key={`${item.id}-cvss`} variant="body-default-s" className="gov-kpi-value">
          {item.cvss > 0 ? item.cvss.toFixed(1) : "N/A"}
        </Text>,
        <Column key={`${item.id}-gauge`} gap="4" style={{ minWidth: "6.5rem" }}>
          <LinearGauge
            value={Math.round(item.compositeScore * 100)}
            labels="percentage"
            hue={
              item.severity === "Critical" || item.severity === "High"
                ? "danger"
                : "neutral"
            }
            height={6}
            width={108}
          />
        </Column>,
        <Text
          key={`${item.id}-sla`}
          variant="body-default-xs"
          onBackground={
            item.slaHoursRemaining <= 0 ? "danger-weak" : "neutral-weak"
          }
        >
          {formatSla(item.slaHoursRemaining)}
        </Text>,
        <Text key={`${item.id}-assignee`} variant="body-default-xs">
          {item.assignee}
        </Text>,
      ]),
    }),
    [filtered, selectedId],
  );

  return (
    <Panel
      title="Alert register"
      subtitle={`${filtered.length} items displayed. Select a row to open the case inspector.`}
      padding="0"
    >
      <Column padding="24" gap="16" fillWidth>
        <Row fillWidth gap="16" wrap vertical="center">
          <Column flex={1} style={{ minWidth: "14rem" }}>
            <Input
              id="alert-search"
              label="Search register"
              placeholder="Reference, title, owner, or source"
              value={searchQuery}
              onChange={(e) => onSearchQuery(e.target.value)}
            />
          </Column>
          <Select
            id="sort-filter"
            label="Sort order"
            value={sortKey}
            onSelect={(value) => onSortKey(value as SortKey)}
            options={[
              { value: "priority", label: "Composite priority" },
              { value: "agencies", label: "Agency breadth" },
              { value: "cvss", label: "CVSS score" },
              { value: "sla", label: "SLA urgency" },
              { value: "received", label: "Date received" },
            ]}
          />
        </Row>

        <Flex gap="8" wrap fillWidth>
          {CATEGORY_FILTER_CHIPS.map((chip) => (
            <Chip
              key={chip.value}
              label={chip.label}
              selected={categoryFilter === chip.value}
              onClick={() => onCategoryFilter(chip.value)}
            />
          ))}
        </Flex>

        <SegmentedControl
          fillWidth
          buttons={(
            ["All", "Critical", "High", "Medium", "Low"] as SeverityFilter[]
          ).map((value) => ({ value, label: value }))}
          selected={severityFilter}
          onToggle={(value) => onSeverityFilter(value as SeverityFilter)}
        />

        <Table
          data={tableData}
          fillWidth
          onRowClick={(rowIndex) => {
            const alert = filtered[rowIndex];
            if (alert) onSelectAlert(alert.id);
          }}
        />
      </Column>
    </Panel>
  );
}
