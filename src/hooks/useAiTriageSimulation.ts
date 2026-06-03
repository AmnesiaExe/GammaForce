"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  AI_OPERATOR_TASKS,
  AiTriageLane,
  CORRELATION_RELATED,
  deprioritiseReasonFor,
  enrichAlertForDemo,
  primaryAgencyLabel,
  ProcessingStage,
  stageActivityMessage,
} from "@/data/aiTriageSimulation";
import { AlertItem } from "@/lib/scoring";

const INGEST_MS = 1100;
const TICK_MS = 300;
const PROCESS_MS = 5500;
const MAX_INCOMING = 4;
const MAX_PROCESSING = 1;
const MAX_RANKED = 16;
const MAX_DISCARDED = 10;
const MAX_ACTIVITY = 12;
const HOT_SEQUENCE = 3;

export interface TriageCard {
  uid: string;
  alert: AlertItem;
  lane: AiTriageLane;
  displayTitle: string;
  aiTag: string;
  aiHint: string;
  agencyLabel: string;
  sequenceIndex: number;
  processingUntil: number;
  processingStartedAt: number;
  processingStage: ProcessingStage;
  relatedEvents: string[];
  highlight?: "promote" | "demote" | "suppress" | "fly";
  disregardReason?: string;
  isNoise?: boolean;
}

export interface AiActivityLine {
  id: string;
  time: string;
  message: string;
  tone: "info" | "warn" | "success" | "muted";
}

export interface LiveDashboardStats {
  ingested: number;
  suppressed: number;
  patterns: number;
  correlated: number;
  predicted: number;
  agencies: number;
}

function nowClock() {
  return new Date().toLocaleTimeString("en-AU", {
    timeZone: "Australia/Perth",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function sortRanked(cards: TriageCard[]) {
  return [...cards].sort(
    (a, b) =>
      b.alert.compositeScore - a.alert.compositeScore ||
      a.sequenceIndex - b.sequenceIndex,
  );
}

function stageFor(card: TriageCard, now: number): ProcessingStage {
  if (card.sequenceIndex >= HOT_SEQUENCE) return "score";
  const elapsed = now - card.processingStartedAt;
  if (elapsed < 400) return "flash";
  if (elapsed < 1000) return "correlate";
  if (elapsed < 1600) return "predict";
  return "score";
}

export function useAiTriageSimulation(pool: AlertItem[]) {
  const [phase, setPhase] = useState<"standby" | "live">("standby");
  const [cards, setCards] = useState<TriageCard[]>([]);
  const [aiTask, setAiTask] = useState(AI_OPERATOR_TASKS[0]);
  const [activity, setActivity] = useState<AiActivityLine[]>([]);
  const [stats, setStats] = useState<LiveDashboardStats>({
    ingested: 0,
    suppressed: 0,
    patterns: 0,
    correlated: 0,
    predicted: 0,
    agencies: 0,
  });
  const poolIndex = useRef(0);
  const uidSeq = useRef(0);
  const agencySet = useRef(new Set<string>());

  const pushActivity = useCallback(
    (message: string, tone: AiActivityLine["tone"] = "info") => {
      const line: AiActivityLine = {
        id: `act-${uidSeq.current++}`,
        time: nowClock(),
        message,
        tone,
      };
      setActivity((prev) => [line, ...prev].slice(0, MAX_ACTIVITY));
    },
    [],
  );

  const nextAlert = useCallback(() => {
    const alert = pool[poolIndex.current % pool.length];
    poolIndex.current += 1;
    const idx = poolIndex.current;
    const meta = enrichAlertForDemo(alert, idx);
    uidSeq.current += 1;
    alert.affectedAgencyIds.forEach((id) => agencySet.current.add(id));
    setStats((s) => ({
      ...s,
      ingested: s.ingested + 1,
      agencies: agencySet.current.size,
    }));
    return {
      uid: `card-${uidSeq.current}`,
      alert,
      lane: "incoming" as const,
      displayTitle: meta.displayTitle,
      aiTag: meta.aiTag,
      aiHint: meta.aiHint,
      agencyLabel: primaryAgencyLabel(alert),
      sequenceIndex: idx,
      processingUntil: 0,
      processingStartedAt: 0,
      processingStage: "flash" as const,
      relatedEvents: CORRELATION_RELATED.slice(0, 2 + (idx % 3)),
      isNoise: meta.isNoise,
    };
  }, [pool]);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      setPhase("live");
      pushActivity("WASOC ingest connected  standing by for records", "success");
    }, 450);
    return () => window.clearTimeout(boot);
  }, [pushActivity]);

  useEffect(() => {
    if (phase !== "live") return;
    const ingest = window.setInterval(() => {
      setCards((prev) => {
        const incoming = prev.filter((c) => c.lane === "incoming").length;
        if (incoming >= MAX_INCOMING) return prev;
        const card = nextAlert();
        pushActivity(`INGEST · ${card.agencyLabel} · ${card.displayTitle.slice(0, 52)}…`, "info");
        return [...prev, { ...card, highlight: "fly" }];
      });
    }, INGEST_MS);
    return () => window.clearInterval(ingest);
  }, [phase, nextAlert, pushActivity]);

  useEffect(() => {
    if (phase !== "live") return;
    const tick = window.setInterval(() => {
      setCards((prev) => advance(prev, pushActivity, setStats));
    }, TICK_MS);
    return () => window.clearInterval(tick);
  }, [phase, pushActivity]);

  useEffect(() => {
    if (phase !== "live") return;
    const rotate = window.setInterval(() => {
      setAiTask((t) => {
        const i = AI_OPERATOR_TASKS.indexOf(t);
        return AI_OPERATOR_TASKS[(i + 1) % AI_OPERATOR_TASKS.length];
      });
    }, 3000);
    return () => window.clearInterval(rotate);
  }, [phase]);

  useEffect(() => {
    if (phase !== "live") return;
    const aiOps = window.setInterval(() => {
      setCards((prev) => randomAiShuffle(prev, pushActivity, setStats));
    }, 6500);
    return () => window.clearInterval(aiOps);
  }, [phase, pushActivity]);

  useEffect(() => {
    const clear = window.setInterval(() => {
      setCards((prev) =>
        prev.some((c) => c.highlight)
          ? prev.map((c) => (c.highlight ? { ...c, highlight: undefined } : c))
          : prev,
      );
    }, 700);
    return () => window.clearInterval(clear);
  }, []);

  const counts = {
    incoming: cards.filter((c) => c.lane === "incoming").length,
    processing: cards.filter((c) => c.lane === "processing").length,
    ranked: cards.filter((c) => c.lane === "ranked").length,
    discarded: cards.filter((c) => c.lane === "discarded").length,
  };

  const focusCard =
    cards.find((c) => c.lane === "processing") ??
    cards.filter((c) => c.lane === "incoming").slice(-1)[0] ??
    null;

  return { phase, cards, aiTask, activity, counts, stats, focusCard };
}

function advance(
  prev: TriageCard[],
  log: (msg: string, tone?: AiActivityLine["tone"]) => void,
  setStats: Dispatch<SetStateAction<LiveDashboardStats>>,
): TriageCard[] {
  const now = Date.now();
  let incoming = prev.filter((c) => c.lane === "incoming");
  let processing = prev.filter((c) => c.lane === "processing");
  let ranked = prev.filter((c) => c.lane === "ranked");
  let discarded = prev.filter((c) => c.lane === "discarded");

  if (processing.length < MAX_PROCESSING && incoming.length > 0) {
    const [first, ...rest] = incoming;
    incoming = rest;
    const mover: TriageCard = {
      ...first,
      lane: "processing",
      processingUntil: now + PROCESS_MS,
      processingStartedAt: now,
      processingStage: first.sequenceIndex < HOT_SEQUENCE ? "flash" : "score",
      highlight: "fly",
    };
    log(`TRIAGE · ${mover.alert.id} entered live review · ${mover.agencyLabel}`, "info");
    log(stageActivityMessage(mover.processingStage, mover), "info");
    processing = [...processing, mover];
  }

  const stillProcessing: TriageCard[] = [];
  for (const card of processing) {
    const nextStage = stageFor(card, now);
    let working = card;
    if (nextStage !== card.processingStage) {
      log(stageActivityMessage(nextStage, card), "info");
      if (nextStage === "predict") {
        setStats((s) => ({ ...s, predicted: s.predicted + 1 }));
      }
      working = { ...card, processingStage: nextStage };
    }

    if (working.processingUntil <= now) {
      if (working.isNoise) {
        const reason = deprioritiseReasonFor(working);
        if (
          discarded.length < MAX_DISCARDED &&
          !discarded.some((d) => d.alert.id === working.alert.id)
        ) {
          discarded = [
            {
              ...working,
              lane: "discarded" as const,
              disregardReason: reason,
              highlight: "suppress" as const,
            },
            ...discarded,
          ].slice(0, MAX_DISCARDED);
          log(`FILTERED · ${working.alert.id} · ${reason}`, "muted");
          setStats((s) => ({ ...s, suppressed: s.suppressed + 1 }));
        }
      } else if (ranked.length < MAX_RANKED) {
        ranked = sortRanked([
          ...ranked,
          { ...working, lane: "ranked", highlight: "promote", processingStage: "score" },
        ]);
        const pos = ranked.findIndex((c) => c.uid === working.uid) + 1;
        log(
          `RANKED #${pos} · ${working.alert.severity} · ${working.agencyLabel} · priority ${Math.round(working.alert.compositeScore * 100)}%`,
          "success",
        );
        setStats((s) => ({
          ...s,
          patterns: s.patterns + (working.sequenceIndex < HOT_SEQUENCE ? 1 : 0),
          correlated: s.correlated + 1,
        }));
      }
    } else {
      stillProcessing.push({ ...working, processingStage: nextStage });
    }
  }
  processing = stillProcessing;

  return [...incoming, ...processing, ...ranked, ...discarded];
}

function randomAiShuffle(
  prev: TriageCard[],
  log: (msg: string, tone?: AiActivityLine["tone"]) => void,
  setStats: Dispatch<SetStateAction<LiveDashboardStats>>,
): TriageCard[] {
  const incoming = prev.filter((c) => c.lane === "incoming");
  const processing = prev.filter((c) => c.lane === "processing");
  let ranked = prev.filter((c) => c.lane === "ranked");
  let discarded = prev.filter((c) => c.lane === "discarded");
  if (ranked.length < 2) return prev;

  const roll = Math.random();

  if (roll < 0.28 && ranked.length >= 2) {
    const i = Math.floor(Math.random() * (ranked.length - 1));
    const swapped = [...ranked];
    [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    log(`Queue reshuffle · ${swapped[i].alert.id} moved up after new telemetry`, "warn");
    ranked = swapped.map((c, idx) =>
      idx === i ? { ...c, highlight: "promote" as const } : c,
    );
    return [...incoming, ...processing, ...ranked, ...discarded];
  }

  if (roll < 0.42) {
    const target = ranked[Math.floor(Math.random() * Math.min(4, ranked.length))];
    ranked = ranked.filter((c) => c.uid !== target.uid);
    const reprocess: TriageCard = {
      ...target,
      lane: "processing",
      processingUntil: Date.now() + PROCESS_MS * 0.65,
      processingStartedAt: Date.now(),
      processingStage: "correlate",
      highlight: "demote",
    };
    log(`Re-scan · pattern graph update for ${target.alert.id}`, "info");
    setStats((s) => ({ ...s, correlated: s.correlated + 1 }));
    return [...incoming, ...processing, ...ranked, reprocess, ...discarded];
  }

  return prev;
}
