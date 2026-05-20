import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

import { syncStripeAccountToProfile } from "./profile-sync";

function makeUpdateChain() {
  const updateCalls: unknown[] = [];
  const eqArgs: Array<[string, unknown]> = [];
  const chain = {
    update: vi.fn((values: unknown) => {
      updateCalls.push(values);
      return {
        eq: vi.fn((col: string, value: unknown) => {
          eqArgs.push([col, value]);
          return Promise.resolve({ error: null });
        }),
      };
    }),
  };
  return { chain, updateCalls, eqArgs };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncStripeAccountToProfile", () => {
  function buildAccount(overrides: Partial<Stripe.Account> = {}): Stripe.Account {
    return {
      id: "acct_1",
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      requirements: { currently_due: ["external_account"] } as never,
      metadata: { bloem_user_id: "u-1" },
      ...overrides,
    } as Stripe.Account;
  }

  it("no-ops when metadata.bloem_user_id is missing", async () => {
    await syncStripeAccountToProfile(buildAccount({ metadata: {} }));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("writes the full stripe state for the matching profile", async () => {
    const { chain, updateCalls, eqArgs } = makeUpdateChain();
    mockFrom.mockReturnValue(chain);

    await syncStripeAccountToProfile(
      buildAccount({
        id: "acct_xyz",
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: { currently_due: [] } as never,
      })
    );

    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(updateCalls[0]).toMatchObject({
      stripe_account_id: "acct_xyz",
      stripe_charges_enabled: true,
      stripe_payouts_enabled: true,
      stripe_details_submitted: true,
    });
    expect(eqArgs[0]).toEqual(["id", "u-1"]);
  });

  it("defaults undefined flags to false (defensive against Stripe API drift)", async () => {
    const { chain, updateCalls } = makeUpdateChain();
    mockFrom.mockReturnValue(chain);

    await syncStripeAccountToProfile(
      buildAccount({
        charges_enabled: undefined as never,
        payouts_enabled: undefined as never,
        details_submitted: undefined as never,
        requirements: undefined as never,
      })
    );

    expect(updateCalls[0]).toMatchObject({
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_details_submitted: false,
      stripe_requirements_due: null,
    });
  });

  it("forwards currently_due array to stripe_requirements_due", async () => {
    const { chain, updateCalls } = makeUpdateChain();
    mockFrom.mockReturnValue(chain);

    await syncStripeAccountToProfile(
      buildAccount({
        requirements: {
          currently_due: ["business_profile.url", "tos_acceptance"],
        } as never,
      })
    );

    expect(updateCalls[0]).toMatchObject({
      stripe_requirements_due: ["business_profile.url", "tos_acceptance"],
    });
  });

  it("updates the updated_at timestamp on every write", async () => {
    const { chain, updateCalls } = makeUpdateChain();
    mockFrom.mockReturnValue(chain);

    await syncStripeAccountToProfile(buildAccount());
    expect(updateCalls[0]).toHaveProperty("updated_at");
    expect(typeof (updateCalls[0] as { updated_at: unknown }).updated_at).toBe(
      "string"
    );
  });
});
