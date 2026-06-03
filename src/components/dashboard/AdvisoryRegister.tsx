"use client";

import { useMemo } from "react";
import {
  Button,
  Chip,
  Column,
  Flex,
  Heading,
  Input,
  Row,
  SegmentedControl,
  Select,
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

interface AdvisoryRegisterProps {
  items: AlertItem[];
  severityFilter: SeverityFilter;
  categoryFilter: "All" | Category;
  sortKey: SortKey;
  searchQuery: string;
  highlightedId?: string | null;
  onSeverityFilter: (v: SeverityFilter) => void;
  onCategoryFilter: (v: "All" | Category) => void;
  onSortKey: (v: SortKey) => void;
  onSearchQuery: (v: string) => void;
  onOpenAdvisory: (id: string) => void;
}

export function AdvisoryRegister({
  items,
  severityFilter,
  categoryFilter,
  sortKey,
  searchQuery,
  highlightedId,
  onSeverityFilter,
  onCategoryFilter,
  onSortKey,
  onSearchQuery,
  onOpenAdvisory,
}: AdvisoryRegisterProps) {
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
        return b.agencyCount - a.agencyCount || b.compositeScore - a.compositeScore;
      }
      if (sortKey === "cvss") return b.cvss - a.cvss;
      if (sortKey === "sla") return a.slaHoursRemaining - b.slaHoursRemaining;
      if (sortKey === "received") {
        return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
      }
      return (
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        b.compositeScore - a.compositeScore
      );
    });

    return result;
  }, [items, severityFilter, categoryFilter, searchQuery, sortKey]);

  return (
    <Panel
      title="WASOC alert queue"
      subtitle="Open a row to see threat score, agency importance, and what to do first. IDs use WASOC format (SOC-...)."
      padding="0"
    >
      <Column padding="24" gap="16" fillWidth>
        <Row fillWidth gap="16" wrap vertical="center">
          <Column flex={1} style={{ minWidth: "14rem" }}>
            <Input
              id="advisory-search"
              label="Search"
              placeholder="SOC reference, title, or source"
              value={searchQuery}
              onChange={(e) => onSearchQuery(e.target.value)}
            />
          </Column>
          <Select
            id="sort-filter"
            label="Sort by"
            value={sortKey}
            onSelect={(value) => onSortKey(value as SortKey)}
            options={[
              { value: "priority", label: "Priority (recommended)" },
              { value: "agencies", label: "Agencies affected" },
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
          buttons={(["All", "Critical", "High", "Medium", "Low"] as SeverityFilter[]).map(
            (value) => ({ value, label: value }),
          )}
          selected={severityFilter}
          onToggle={(value) => onSeverityFilter(value as SeverityFilter)}
        />

        <Column gap="12" fillWidth>
          {filtered.length === 0 ? (
            <Text variant="body-default-s" onBackground="neutral-weak">
              No alerts match your filters.
            </Text>
          ) : (
            filtered.map((item) => {
              const highlight = item.id === highlightedId;
              const priorityPct = Math.round(item.compositeScore * 100);

              return (
                <div
                  key={item.id}
                  className={`gov-advisory-card${highlight ? " gov-advisory-card--highlight" : ""}`}
                >
                  <Flex horizontal="between" vertical="start" fillWidth wrap gap="16">
                    <Column gap="8" flex={1} style={{ minWidth: "12rem" }}>
                      <Text variant="label-strong-s" onBackground="brand-strong">
                        {item.id}
                      </Text>
                      <Text variant="label-strong-s">{item.title}</Text>
                      <Flex gap="8" wrap>
                        <Tag
                          variant={severityTagVariant(item.severity)}
                          size="s"
                          label={item.severity}
                        />
                        <Tag
                          variant={statusTagVariant(item.status)}
                          size="s"
                          label={item.status}
                        />
                        {item.kevListed && <Tag variant="danger" size="s" label="KEV" />}
                      </Flex>
                      <Text variant="body-default-xs" onBackground="neutral-weak">
                        {item.agencyCount} agencies · {item.source} ·{" "}
                        {formatSla(item.slaHoursRemaining)}
                      </Text>
                    </Column>

                    <Column gap="8" horizontal="end" vertical="center">
                      <Heading
                        variant="heading-strong-l"
                        className="gov-kpi-value"
                        style={{
                          color:
                            item.severity === "Critical"
                              ? "#f87171"
                              : item.severity === "High"
                                ? "#fb923c"
                                : undefined,
                        }}
                      >
                        {priorityPct}
                      </Heading>
                      <Text variant="label-default-xs" onBackground="neutral-weak">
                        prioritisation
                      </Text>
                      <Button
                        variant="primary"
                        label="Open details"
                        onClick={() => onOpenAdvisory(item.id)}
                      />
                    </Column>
                  </Flex>
                </div>
              );
            })
          )}
        </Column>

        <Text variant="body-default-xs" onBackground="neutral-weak">
          Showing {filtered.length} alerts. Open one for scores, agencies, and recommended actions.
        </Text>
      </Column>
    </Panel>
  );
}
