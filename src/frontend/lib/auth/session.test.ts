import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";

// `lib/auth/session.ts` constructs a SessionMonitor at module load that calls
// createBrowserClient(). Stub both Supabase clients so the import side-effect
// doesn't throw "URL and API key are required" in this Node-environment harness.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getSession: vi.fn(), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import {
  isSessionValid,
  getSessionExpiration,
  getTimeUntilExpiration,
  isSessionExpiringSoon,
} from "./session";

function buildSession(expiresAtSec?: number): Session {
  return {
    access_token: "a",
    refresh_token: "r",
    token_type: "bearer",
    user: { id: "u1" } as never,
    expires_at: expiresAtSec,
    expires_in: 3600,
  } as Session;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-20T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("isSessionValid", () => {
  it("returns false for null", () => {
    expect(isSessionValid(null)).toBe(false);
  });

  it("returns true when expires_at is unset (treated as long-lived)", () => {
    expect(isSessionValid(buildSession(undefined))).toBe(true);
  });

  it("returns true when expiry is in the future", () => {
    const future = Math.floor(
      new Date("2026-05-20T13:00:00Z").getTime() / 1000
    );
    expect(isSessionValid(buildSession(future))).toBe(true);
  });

  it("returns false when expiry is in the past", () => {
    const past = Math.floor(
      new Date("2026-05-20T11:00:00Z").getTime() / 1000
    );
    expect(isSessionValid(buildSession(past))).toBe(false);
  });

  it("returns false at the exact expiry second (not >)", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isSessionValid(buildSession(now))).toBe(false);
  });
});

describe("getSessionExpiration", () => {
  it("returns null when session is null", () => {
    expect(getSessionExpiration(null)).toBeNull();
  });

  it("returns null when expires_at is unset", () => {
    expect(getSessionExpiration(buildSession(undefined))).toBeNull();
  });

  it("converts unix seconds to a Date", () => {
    const epochSeconds = 1_900_000_000;
    expect(getSessionExpiration(buildSession(epochSeconds))).toEqual(
      new Date(epochSeconds * 1000)
    );
  });
});

describe("getTimeUntilExpiration", () => {
  it("returns null for missing expires_at", () => {
    expect(getTimeUntilExpiration(null)).toBeNull();
    expect(getTimeUntilExpiration(buildSession(undefined))).toBeNull();
  });

  it("returns 0 (clamped, not negative) when expired", () => {
    const past = Math.floor(
      new Date("2026-05-20T11:00:00Z").getTime() / 1000
    );
    expect(getTimeUntilExpiration(buildSession(past))).toBe(0);
  });

  it("returns positive seconds remaining", () => {
    const oneHourFromNow = Math.floor(
      new Date("2026-05-20T13:00:00Z").getTime() / 1000
    );
    expect(getTimeUntilExpiration(buildSession(oneHourFromNow))).toBe(3600);
  });
});

describe("isSessionExpiringSoon", () => {
  it("returns false when no expires_at", () => {
    expect(isSessionExpiringSoon(buildSession(undefined))).toBe(false);
  });

  it("returns false when null", () => {
    expect(isSessionExpiringSoon(null)).toBe(false);
  });

  it("returns true when < 5 minutes remain", () => {
    const soon = Math.floor(
      new Date("2026-05-20T12:04:00Z").getTime() / 1000
    );
    expect(isSessionExpiringSoon(buildSession(soon))).toBe(true);
  });

  it("returns false when > 5 minutes remain", () => {
    const later = Math.floor(
      new Date("2026-05-20T12:30:00Z").getTime() / 1000
    );
    expect(isSessionExpiringSoon(buildSession(later))).toBe(false);
  });

  it("returns false right at the 5-minute boundary (strict < 300)", () => {
    const fiveMin = Math.floor(
      new Date("2026-05-20T12:05:00Z").getTime() / 1000
    );
    expect(isSessionExpiringSoon(buildSession(fiveMin))).toBe(false);
  });
});
