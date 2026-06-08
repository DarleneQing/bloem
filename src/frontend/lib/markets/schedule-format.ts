export const DATE_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface MarketHoursDto {
  opening: string | null;
  closing: string | null;
}

export function isDateOnlyInput(value: string): boolean {
  return DATE_INPUT_REGEX.test(value);
}

export function getTodayDateInput(): string {
  return toDateInputValue(new Date().toISOString());
}

export function toDateInputValue(isoOrDate: string): string {
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateInputToStartIso(dateStr: string): string {
  if (!isDateOnlyInput(dateStr)) {
    return new Date(dateStr).toISOString();
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

export function dateInputToEndIso(dateStr: string): string {
  if (!isDateOnlyInput(dateStr)) {
    return new Date(dateStr).toISOString();
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

export function compareMarketDates(start: string, end: string): boolean {
  const startDay = isDateOnlyInput(start) ? start : toDateInputValue(start);
  const endDay = isDateOnlyInput(end) ? end : toDateInputValue(end);
  if (!startDay || !endDay) {
    return false;
  }
  return endDay >= startDay;
}

export function isValidMarketDateInput(value: string): boolean {
  if (isDateOnlyInput(value)) {
    return true;
  }
  return !Number.isNaN(new Date(value).getTime());
}

export function marketHoursFromDb(
  openingTime: string | null | undefined,
  closingTime: string | null | undefined
): MarketHoursDto {
  return {
    opening: openingTime ? openingTime.slice(0, 5) : null,
    closing: closingTime ? closingTime.slice(0, 5) : null,
  };
}

export function formatMarketDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const datePart = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (sameDay) {
    return datePart;
  }

  const endPart = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${datePart} – ${endPart}`;
}

export function formatMarketDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTimeOfDay(time: string | null | undefined): string | null {
  if (!time) {
    return null;
  }
  const match = time.match(/^(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMarketDailyHours(
  opening: string | null | undefined,
  closing: string | null | undefined
): string | null {
  const open = formatTimeOfDay(opening);
  const close = formatTimeOfDay(closing);
  if (open && close) {
    return `${open} – ${close}`;
  }
  if (open) {
    return `Opens ${open}`;
  }
  if (close) {
    return `Closes ${close}`;
  }
  return null;
}

export function formatMarketScheduleDisplay(options: {
  start: string;
  end: string;
  opening?: string | null;
  closing?: string | null;
}): string {
  const dateRange = formatMarketDateRange(options.start, options.end);
  const hours = formatMarketDailyHours(options.opening, options.closing);
  if (hours) {
    return `${dateRange} · ${hours}`;
  }
  return dateRange;
}
