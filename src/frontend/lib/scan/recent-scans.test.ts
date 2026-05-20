import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addRecentScan, getRecentScans } from "./recent-scans";

// Polyfill a minimal window.localStorage for the Node environment.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const STORAGE_KEY = "bloem.scan.recent";

beforeEach(() => {
  const storage = new MemoryStorage();
  // @ts-expect-error - install a minimal window shim in node env
  globalThis.window = { localStorage: storage };
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-20T12:00:00Z"));
});

afterEach(() => {
  // @ts-expect-error - tear down
  delete globalThis.window;
  vi.useRealTimers();
});

function entry(code: string, title = `Item ${code}`) {
  return { code, title, thumbnailUrl: null };
}

describe("getRecentScans", () => {
  it("returns empty array when storage is unset", () => {
    expect(getRecentScans()).toEqual([]);
  });

  it("returns empty array on malformed JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json{");
    expect(getRecentScans()).toEqual([]);
  });

  it("returns empty array when stored value isn't an array", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: "array" }));
    expect(getRecentScans()).toEqual([]);
  });

  it("returns persisted entries", () => {
    const stored = [
      { code: "BLOEM-X-00001", title: "Shirt", thumbnailUrl: null, scannedAt: "2026-05-20T11:00:00Z" },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    expect(getRecentScans()).toEqual(stored);
  });
});

describe("addRecentScan", () => {
  it("prepends a new entry with current ISO timestamp", () => {
    const out = addRecentScan(entry("BLOEM-X-00001"));
    expect(out).toHaveLength(1);
    expect(out[0]?.code).toBe("BLOEM-X-00001");
    expect(out[0]?.scannedAt).toBe("2026-05-20T12:00:00.000Z");
  });

  it("dedupes by code — re-scanning moves entry to front and updates timestamp", () => {
    addRecentScan(entry("BLOEM-A-00001"));
    addRecentScan(entry("BLOEM-B-00002"));
    vi.setSystemTime(new Date("2026-05-20T12:30:00Z"));
    const out = addRecentScan(entry("BLOEM-A-00001"));
    expect(out).toHaveLength(2);
    expect(out[0]?.code).toBe("BLOEM-A-00001");
    expect(out[0]?.scannedAt).toBe("2026-05-20T12:30:00.000Z");
    expect(out[1]?.code).toBe("BLOEM-B-00002");
  });

  it("caps the history at 12 entries (newest first)", () => {
    for (let i = 0; i < 15; i++) {
      addRecentScan(entry(`BLOEM-X-${String(i).padStart(5, "0")}`));
    }
    const out = getRecentScans();
    expect(out).toHaveLength(12);
    // The most recently added (i=14) is first.
    expect(out[0]?.code).toBe("BLOEM-X-00014");
    expect(out.at(-1)?.code).toBe("BLOEM-X-00003");
  });

  it("persists across calls via the same storage", () => {
    addRecentScan(entry("BLOEM-Z-99999"));
    expect(getRecentScans()).toEqual([
      expect.objectContaining({ code: "BLOEM-Z-99999" }),
    ]);
  });
});
