/**
 * WASOC-style advisory reference (TLP:CLEAR), aligned to soc.cyber.wa.gov.au format
 * e.g. "Microsoft Critical Monthly Updates - 20260614001"
 */
export function formatSocAdvisoryId(sequence: number, baseDate = new Date("2026-06-03T09:00:00+08:00")): string {
  const y = baseDate.getFullYear();
  const m = String(baseDate.getMonth() + 1).padStart(2, "0");
  const d = String(baseDate.getDate()).padStart(2, "0");
  const seq = String(sequence).padStart(4, "0");
  return `SOC-${y}${m}${d}${seq}`;
}

export function isSocAdvisoryId(id: string): boolean {
  return /^SOC-\d{12}$/.test(id);
}

/** Display label for register columns */
export function socAdvisoryLabel(id: string): string {
  return id.startsWith("SOC-") ? id : `SOC-${id}`;
}
