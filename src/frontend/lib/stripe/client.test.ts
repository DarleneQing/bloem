import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const { mockLoadStripe } = vi.hoisted(() => ({ mockLoadStripe: vi.fn() }));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: mockLoadStripe,
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = ORIGINAL_KEY;
});

describe("getStripeJs()", () => {
  it("resolves to null (graceful degrade) when publishable key is missing", async () => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const { getStripeJs } = await import("./client");
    await expect(getStripeJs()).resolves.toBeNull();
    expect(mockLoadStripe).not.toHaveBeenCalled();
  });

  it("calls loadStripe with the publishable key when set", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_abc";
    mockLoadStripe.mockResolvedValue({ id: "stripe-instance" });
    const { getStripeJs } = await import("./client");
    await getStripeJs();
    expect(mockLoadStripe).toHaveBeenCalledWith("pk_test_abc");
  });

  it("memoizes the promise so loadStripe is invoked once per process", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_xyz";
    mockLoadStripe.mockResolvedValue({ id: "stripe-instance" });
    const { getStripeJs } = await import("./client");
    await getStripeJs();
    await getStripeJs();
    await getStripeJs();
    expect(mockLoadStripe).toHaveBeenCalledTimes(1);
  });

  it("never resolves to the literal key value (defensive contract)", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_should_not_appear";
    mockLoadStripe.mockResolvedValue({ id: "stripe-instance" });
    const { getStripeJs } = await import("./client");
    const result = await getStripeJs();
    expect(JSON.stringify(result)).not.toContain("pk_test_should_not_appear");
  });
});
