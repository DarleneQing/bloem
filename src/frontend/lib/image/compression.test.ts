import { describe, expect, it } from "vitest";
import { getCompressionStats, formatBytes } from "./compression";

describe("getCompressionStats", () => {
  it("computes saved bytes and percentage at 2dp precision", () => {
    expect(getCompressionStats(1000, 200)).toEqual({
      originalSize: 1000,
      compressedSize: 200,
      savedBytes: 800,
      savedPercentage: 80,
    });
  });

  it("returns 0% saved when sizes are identical", () => {
    expect(getCompressionStats(1024, 1024)).toEqual({
      originalSize: 1024,
      compressedSize: 1024,
      savedBytes: 0,
      savedPercentage: 0,
    });
  });

  it("handles negative savings (compressed > original)", () => {
    const stats = getCompressionStats(100, 200);
    expect(stats.savedBytes).toBe(-100);
    expect(stats.savedPercentage).toBeLessThan(0);
  });

  it("rounds percentage to 1dp", () => {
    const stats = getCompressionStats(3000, 1000);
    // (3000-1000)/3000 = 66.666… → "66.7" → 66.7
    expect(stats.savedPercentage).toBe(66.7);
  });
});

describe("formatBytes", () => {
  it("returns '0 Bytes' for 0", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it.each([
    [512, "512 Bytes"],
    [1024, "1 KB"],
    [1536, "1.5 KB"],
    [1024 * 1024, "1 MB"],
    [2_621_440, "2.5 MB"], // 2.5 * 1024 * 1024
    [1024 * 1024 * 1024, "1 GB"],
  ])("formats %d bytes → %s", (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });

  it("respects custom decimal precision", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB"); // 1.5 → 2 with 0dp
    expect(formatBytes(1536, 4)).toBe("1.5 KB");
  });

  it("treats negative decimals as 0", () => {
    expect(formatBytes(1536, -1)).toBe("2 KB");
  });
});
