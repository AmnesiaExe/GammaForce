"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Column,
  Flex,
  Input,
  Row,
  SegmentedControl,
  Tag,
  Text,
} from "@once-ui-system/core";
import { Panel } from "@/components/dashboard/Panel";
import { INTELLIGENCE_SOURCES } from "@/data/intelligenceSources";
import { AlertItem, Category } from "@/lib/scoring";
import {
  formatIngestLogEntry,
  ingestLogLevel,
  toRawFeedRecord,
  toScoringInputsRecord,
  type IngestLogLevel,
} from "@/lib/rawFeedRecord";

const STREAM_BATCH = 3;
const STREAM_MS = 55;
const MAX_LOG_LINES = 200;

interface RawIntelFeedViewProps {
  items: AlertItem[];
}

function levelClass(level: IngestLogLevel): string {
  if (level === "KEV") return "gov-log-level--kev";
  if (level === "CRIT") return "gov-log-level--crit";
  if (level === "HIGH") return "gov-log-level--high";
  return "gov-log-level--info";
}

export function RawIntelFeedView({ items }: RawIntelFeedViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
  const [paused, setPaused] = useState(false);
  const [streamedCount, setStreamedCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const logBodyRef = useRef<HTMLDivElement>(null);

  const chronologic = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...items].sort(
      (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
    );
    if (categoryFilter !== "All") {
      list = list.filter((a) => a.category === categoryFilter);
    }
    if (q) {
      list = list.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.sourceKey.toLowerCase().includes(q),
      );
    }
    if (list.length > MAX_LOG_LINES) {
      list = list.slice(list.length - MAX_LOG_LINES);
    }
    return list;
  }, [items, search, categoryFilter]);

  const entries = useMemo(
    () => chronologic.map((a) => formatIngestLogEntry(a)),
    [chronologic],
  );

  const visibleEntries = entries.slice(0, streamedCount);
  const streaming = !paused && streamedCount < entries.length;
  const selected = useMemo(
    () => items.find((a) => a.id === selectedId) ?? null,
    [items, selectedId],
  );

  const resetStream = useCallback(() => {
    setStreamedCount(0);
    setSelectedId(null);
  }, []);

  useEffect(() => {
    resetStream();
  }, [search, categoryFilter, items.length, resetStream]);

  useEffect(() => {
    if (paused || streamedCount >= entries.length) return;
    const timer = window.setInterval(() => {
      setStreamedCount((n) => Math.min(n + STREAM_BATCH, entries.length));
    }, STREAM_MS);
    return () => window.clearInterval(timer);
  }, [paused, streamedCount, entries.length]);

  useEffect(() => {
    if (paused) return;
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [streamedCount, paused]);

  const payloadJson = useMemo(() => {
    if (!selected) return "";
    const payload = showPayload
      ? { ...toRawFeedRecord(selected), ...toScoringInputsRecord(selected) }
      : toRawFeedRecord(selected);
    return JSON.stringify(payload, null, 2);
  }, [selected, showPayload]);

  const feedKeys = useMemo(() => Object.keys(INTELLIGENCE_SOURCES), []);

  return (
    <Column gap="24" fillWidth>
      <Panel
        title="Live ingest log"
        subtitle="Raw records arriving from WASOC intelligence feeds (before prioritisation)"
        padding="0"
      >
        <Column gap="0" fillWidth>
          <Row fillWidth gap="16" wrap padding="24" paddingBottom="16">
            <Column flex={1} style={{ minWidth: "14rem" }}>
              <Input
                id="raw-feed-search"
                label="Filter log"
                placeholder="Reference, title, or feed"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Column>
            <SegmentedControl
              buttons={[
                { value: "All", label: "All" },
                { value: "Vulnerability", label: "Vuln" },
                { value: "Threat Intelligence", label: "Intel" },
              ]}
              selected={categoryFilter}
              onToggle={(v) => setCategoryFilter(v as "All" | Category)}
            />
          </Row>

          <div className="gov-raw-terminal">
            <div className="gov-raw-terminal-bar">
              <Flex gap="8" vertical="center">
                <span className="gov-raw-dot gov-raw-dot--red" />
                <span className="gov-raw-dot gov-raw-dot--amber" />
                <span className="gov-raw-dot gov-raw-dot--green" />
                <Text variant="label-strong-s" className="gov-raw-terminal-title">
                  wasoc-ingest@soc-prod
                </Text>
              </Flex>
              <Flex gap="12" vertical="center" wrap>
                <span
                  className={`gov-raw-live-pill${streaming ? " gov-raw-live-pill--on" : ""}`}
                >
                  {streaming ? "LIVE" : paused ? "PAUSED" : "CAUGHT UP"}
                </span>
                <Text variant="body-default-xs" className="gov-raw-terminal-meta">
                  {visibleEntries.length.toLocaleString()} / {entries.length.toLocaleString()} lines
                </Text>
                <button
                  type="button"
                  className="gov-raw-terminal-btn"
                  onClick={() => setPaused((p) => !p)}
                >
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  type="button"
                  className="gov-raw-terminal-btn"
                  onClick={() => {
                    setStreamedCount(entries.length);
                    setPaused(true);
                  }}
                >
                  Skip to end
                </button>
              </Flex>
            </div>

            <div className="gov-raw-log-boot">
              <div className="gov-raw-log-line gov-raw-log-line--sys">
                <span className="gov-log-ts">-- boot --</span>
                <span className="gov-log-msg">
                  WASOC ingest daemon 2.4.1 · {feedKeys.length} feeds connected · TLP:CLEAR
                </span>
              </div>
              <div className="gov-raw-log-line gov-raw-log-line--sys">
                <span className="gov-log-ts">-- feeds --</span>
                <span className="gov-log-msg">
                  {feedKeys.join(", ")} · tailing inbound queue
                </span>
              </div>
            </div>

            <div ref={logBodyRef} className="gov-raw-log-body">
              {visibleEntries.map((entry, i) => {
                const isNew =
                  i >= visibleEntries.length - STREAM_BATCH && streaming;
                const active = entry.id === selectedId;
                return (
                  <button
                    key={`${entry.id}-${i}`}
                    type="button"
                    className={`gov-raw-log-line gov-raw-log-line--entry${isNew ? " gov-raw-log-line--new" : ""}${active ? " gov-raw-log-line--active" : ""}`}
                    onClick={() => setSelectedId(entry.id)}
                  >
                    <span className="gov-log-ts">[{entry.timestamp}]</span>
                    <span className={`gov-log-level ${levelClass(entry.level)}`}>
                      {entry.level}
                    </span>
                    <span className="gov-log-msg">{entry.message}</span>
                  </button>
                );
              })}
              {streaming && (
                <div className="gov-raw-log-line gov-raw-log-line--sys gov-raw-log-line--cursor">
                  <span className="gov-log-ts">[now]</span>
                  <span className="gov-log-level gov-log-level--info">....</span>
                  <span className="gov-log-msg">waiting for next record</span>
                  <span className="gov-raw-cursor" aria-hidden />
                </div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          <Column padding="16" paddingX="24" gap="8" fillWidth>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Newest lines appear at the bottom like a live tail. Click a line for the raw JSON
              payload. Scores and agency order are applied later in AI Triage.
            </Text>
          </Column>
        </Column>
      </Panel>

      {selected && (
        <Panel
          title={`Payload · ${selected.id}`}
          subtitle={selected.title}
          padding="0"
        >
          <Column padding="24" gap="12" fillWidth>
            <SegmentedControl
              buttons={[
                { value: "feed", label: "Feed record" },
                { value: "full", label: "Feed + scoring inputs" },
              ]}
              selected={showPayload ? "full" : "feed"}
              onToggle={(v) => setShowPayload(v === "full")}
            />
            <pre className="gov-raw-json">{payloadJson}</pre>
          </Column>
        </Panel>
      )}

      <Panel title="Feed sources" subtitle="Connected at ingest time">
        <Flex gap="8" wrap fillWidth>
          {Object.values(INTELLIGENCE_SOURCES).map((src) => (
            <Tag key={src.key} size="s" variant="neutral" label={src.key} />
          ))}
        </Flex>
      </Panel>
    </Column>
  );
}
