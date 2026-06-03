import { AlertItem } from "@/lib/scoring";

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 17) | 0;
  return Math.abs(h);
}

export interface LinkedIncidentRecord {
  displayId: string;
  title: string;
  when: string;
  kind: "prior" | "duplicate" | "related";
  similarity: string;
  outcome?: string;
  /** Real alert id in the register to open in the drawer */
  openableId: string;
}

/** Map a pattern or duplicate id to an alert the UI can open. */
export function resolveOpenableAlertId(
  displayId: string,
  current: AlertItem,
  allItems: AlertItem[],
): string {
  const exact = allItems.find((a) => a.id === displayId);
  if (exact) return exact.id;

  const peers = allItems.filter(
    (a) =>
      a.id !== current.id &&
      (a.sourceKey === current.sourceKey || a.category === current.category),
  );
  const pool = peers.length > 0 ? peers : allItems.filter((a) => a.id !== current.id);
  if (pool.length === 0) return current.id;
  return pool[hashId(displayId) % pool.length].id;
}

export function buildLinkedIncidentRecords(
  current: AlertItem,
  allItems: AlertItem[],
  entries: {
    displayId: string;
    title: string;
    when: string;
    kind: LinkedIncidentRecord["kind"];
    similarity: string;
    outcome?: string;
  }[],
): LinkedIncidentRecord[] {
  return entries.map((e) => ({
    ...e,
    openableId: resolveOpenableAlertId(e.displayId, current, allItems),
  }));
}
