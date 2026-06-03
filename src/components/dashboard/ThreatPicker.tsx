"use client";

import {
  Button,
  Column,
  Flex,
  Row,
  Select,
  Tag,
  Text,
} from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { AlertItem, severityTagVariant } from "@/lib/scoring";

interface ThreatPickerProps {
  items: AlertItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ThreatPicker({ items, selectedId, onSelect }: ThreatPickerProps) {
  const index = items.findIndex((a) => a.id === selectedId);
  const current = index >= 0 ? items[index] : null;
  const prev = index > 0 ? items[index - 1] : null;
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : null;

  return (
    <Panel
      title="Choose a threat"
      subtitle="Switch between threats to compare priority and attack path"
    >
      <Column gap="16" fillWidth>
        <Row fillWidth gap="12" wrap vertical="center">
          <Button
            variant="secondary"
            label="Previous"
            disabled={!prev}
            onClick={() => prev && onSelect(prev.id)}
          />
          <Column flex={1} style={{ minWidth: "14rem" }}>
            <Select
              id="threat-picker"
              label="WASOC threat"
              value={selectedId ?? ""}
              onSelect={(v) => onSelect(v as string)}
              options={items.map((a) => ({
                value: a.id,
                label: `${a.id} · ${a.title.slice(0, 48)}${a.title.length > 48 ? "…" : ""}`,
              }))}
            />
          </Column>
          <Button
            variant="secondary"
            label="Next"
            disabled={!next}
            onClick={() => next && onSelect(next.id)}
          />
        </Row>

        {current && (
          <Flex gap="12" wrap vertical="center" fillWidth className="gov-threat-picker-current">
            <Text variant="label-strong-s" onBackground="brand-strong">
              {current.id}
            </Text>
            <Tag variant={severityTagVariant(current.severity)} size="s" label={current.severity} />
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {index + 1} of {items.length} in this list · priority{" "}
              {Math.round(current.compositeScore * 100)}
            </Text>
          </Flex>
        )}
      </Column>
    </Panel>
  );
}
