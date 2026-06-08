import { describe, expect, it } from "vitest";
import {
  compareMarketDates,
  dateInputToEndIso,
  dateInputToStartIso,
  formatMarketDailyHours,
  formatMarketScheduleDisplay,
  isDateOnlyInput,
  marketHoursFromDb,
  toDateInputValue,
} from "./schedule-format";

describe("schedule-format", () => {
  it("detects date-only input", () => {
    expect(isDateOnlyInput("2026-06-07")).toBe(true);
    expect(isDateOnlyInput("2026-06-07T10:00")).toBe(false);
  });

  it("converts date-only input to start/end of local day", () => {
    const start = dateInputToStartIso("2026-06-07");
    const end = dateInputToEndIso("2026-06-07");
    expect(new Date(start).getHours()).toBe(0);
    expect(new Date(end).getHours()).toBe(23);
    expect(new Date(end).getMinutes()).toBe(59);
  });

  it("allows same-day markets when comparing dates", () => {
    expect(compareMarketDates("2026-06-07", "2026-06-07")).toBe(true);
    expect(compareMarketDates("2026-06-08", "2026-06-07")).toBe(false);
  });

  it("formats schedule with separate daily hours", () => {
    expect(
      formatMarketScheduleDisplay({
        start: dateInputToStartIso("2026-06-07"),
        end: dateInputToEndIso("2026-06-07"),
        opening: "10:00",
        closing: "18:00",
      })
    ).toContain("10:00 AM");
    expect(
      formatMarketScheduleDisplay({
        start: dateInputToStartIso("2026-06-07"),
        end: dateInputToEndIso("2026-06-07"),
        opening: "10:00",
        closing: "18:00",
      })
    ).toContain("6:00 PM");
  });

  it("maps postgres time columns to HH:MM", () => {
    expect(marketHoursFromDb("10:00:00", "18:30:00")).toEqual({
      opening: "10:00",
      closing: "18:30",
    });
  });

  it("round-trips ISO timestamps to date inputs in local time", () => {
    const iso = dateInputToStartIso("2026-06-07");
    expect(toDateInputValue(iso)).toBe("2026-06-07");
  });

  it("formats daily hours without dates", () => {
    expect(formatMarketDailyHours("09:00", "17:00")).toMatch(/9:00 AM.*5:00 PM/);
  });
});
