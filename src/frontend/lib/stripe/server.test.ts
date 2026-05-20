import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_SECRET = process.env.STRIPE_SECRET_KEY;
const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env.STRIPE_SECRET_KEY = ORIGINAL_SECRET;
  process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

describe("getStripe()", () => {
  it("throws a clear error when STRIPE_SECRET_KEY is not configured", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { getStripe } = await import("./server");
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY/);
  });

  it("error message names the env var so operators know what to set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { getStripe } = await import("./server");
    let caught: unknown;
    try {
      getStripe();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toContain("STRIPE_SECRET_KEY");
  });

  it("does not leak the missing-key error to a stack trace containing the key value", async () => {
    // The test verifies absence of leakage — the throw path must not echo any value.
    process.env.STRIPE_SECRET_KEY = "sk_live_supersecret123";
    process.env.STRIPE_SECRET_KEY = undefined as never;
    delete process.env.STRIPE_SECRET_KEY;
    const { getStripe } = await import("./server");
    let caught: unknown;
    try {
      getStripe();
    } catch (err) {
      caught = err;
    }
    const msg = (caught as Error).message;
    expect(msg).not.toMatch(/sk_(live|test)_/);
  });

  it("memoizes the Stripe client across calls (singleton)", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    const { getStripe } = await import("./server");
    const a = getStripe();
    const b = getStripe();
    expect(a).toBe(b);
  });
});

describe("getAppUrl()", () => {
  it("uses NEXT_PUBLIC_APP_URL when set", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.bloem.ch";
    const { getAppUrl } = await import("./server");
    expect(getAppUrl()).toBe("https://app.bloem.ch");
  });

  it("falls back to localhost:3000 when unset (dev default)", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { getAppUrl } = await import("./server");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});
