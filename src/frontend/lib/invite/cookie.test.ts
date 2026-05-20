import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_SECRET = process.env.INVITE_COOKIE_SECRET;

beforeEach(() => {
  process.env.INVITE_COOKIE_SECRET =
    "test-secret-must-be-at-least-sixteen-chars";
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-20T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  process.env.INVITE_COOKIE_SECRET = ORIGINAL_SECRET;
});

async function loadCookieModule() {
  vi.resetModules();
  return import("./cookie");
}

describe("invite cookie", () => {
  it("round-trips a valid payload", async () => {
    const mod = await loadCookieModule();
    const value = await mod.signInvitePayload("BLOEM2026");
    const result = await mod.verifyInviteCookieValue(value);
    expect(result).not.toBeNull();
    expect(result?.code).toBe("BLOEM2026");
    expect(result!.exp).toBeGreaterThan(Date.now());
  });

  it("returns null for undefined input", async () => {
    const mod = await loadCookieModule();
    expect(await mod.verifyInviteCookieValue(undefined)).toBeNull();
  });

  it("returns null for tampered signature", async () => {
    const mod = await loadCookieModule();
    const value = await mod.signInvitePayload("BLOEM2026");
    const [encoded] = value.split(".");
    const tampered = `${encoded}.0000000000000000000000000000000000000000000000000000000000000000`;
    expect(await mod.verifyInviteCookieValue(tampered)).toBeNull();
  });

  it("returns null for tampered payload (signature mismatch)", async () => {
    const mod = await loadCookieModule();
    const value = await mod.signInvitePayload("BLOEM2026");
    const [, sig] = value.split(".");
    const fakePayload = btoa(
      JSON.stringify({ code: "FAKECODE", exp: Date.now() + 10_000 }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const tampered = `${fakePayload}.${sig}`;
    expect(await mod.verifyInviteCookieValue(tampered)).toBeNull();
  });

  it("returns null for expired payload", async () => {
    const mod = await loadCookieModule();
    const value = await mod.signInvitePayload("BLOEM2026");
    // Jump past the 30-day expiry
    vi.setSystemTime(new Date("2026-07-20T12:00:00Z"));
    expect(await mod.verifyInviteCookieValue(value)).toBeNull();
  });

  it("returns null for malformed cookie", async () => {
    const mod = await loadCookieModule();
    expect(await mod.verifyInviteCookieValue("not-a-valid-cookie")).toBeNull();
    expect(await mod.verifyInviteCookieValue(".")).toBeNull();
    expect(await mod.verifyInviteCookieValue("a.b.c")).toBeNull();
  });

  it("throws when secret is unconfigured", async () => {
    process.env.INVITE_COOKIE_SECRET = "";
    const mod = await loadCookieModule();
    await expect(mod.signInvitePayload("X")).rejects.toThrow(
      /INVITE_COOKIE_SECRET/,
    );
  });
});
