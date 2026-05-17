export interface RecentScanEntry {
  code: string;
  title: string;
  thumbnailUrl: string | null;
  scannedAt: string;
}

const STORAGE_KEY = "bloem.scan.recent";
const MAX_ENTRIES = 12;

export function getRecentScans(): RecentScanEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentScanEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentScan(entry: Omit<RecentScanEntry, "scannedAt">): RecentScanEntry[] {
  if (typeof window === "undefined") return [];

  const next: RecentScanEntry = {
    ...entry,
    scannedAt: new Date().toISOString(),
  };

  const existing = getRecentScans().filter((scan) => scan.code !== next.code);
  const updated = [next, ...existing].slice(0, MAX_ENTRIES);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
