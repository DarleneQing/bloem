import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAccountsCreate } = vi.hoisted(() => ({
  mockAccountsCreate: vi.fn(),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    v2: {
      core: {
        accounts: { create: mockAccountsCreate },
      },
    },
  }),
}));

import { createStripeConnectedAccount } from "./connect-account";

beforeEach(() => {
  vi.clearAllMocks();
  mockAccountsCreate.mockResolvedValue({ id: "acct_test_xxx" });
});

describe("createStripeConnectedAccount", () => {
  it("calls v2.core.accounts.create with the user's email and the bloem_user_id metadata", async () => {
    await createStripeConnectedAccount({
      userId: "user-123",
      email: "jane@bloem.test",
      displayName: "Jane's Seller Profile",
    });

    expect(mockAccountsCreate).toHaveBeenCalledOnce();
    expect(mockAccountsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_email: "jane@bloem.test",
        display_name: "Jane's Seller Profile",
        metadata: { bloem_user_id: "user-123" },
      })
    );
  });

  it("falls back to email when displayName is empty/whitespace", async () => {
    await createStripeConnectedAccount({
      userId: "u",
      email: "fallback@bloem.test",
      displayName: "   ",
    });
    expect(mockAccountsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "fallback@bloem.test" })
    );
  });

  it("falls back to email when displayName is undefined", async () => {
    await createStripeConnectedAccount({
      userId: "u",
      email: "fallback@bloem.test",
    });
    expect(mockAccountsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "fallback@bloem.test" })
    );
  });

  it("hardcodes Swiss country and CHF currency for Bloem's market", async () => {
    await createStripeConnectedAccount({ userId: "u", email: "e@x.com" });
    const args = mockAccountsCreate.mock.calls[0]?.[0];
    expect(args).toMatchObject({
      identity: expect.objectContaining({ country: "ch", entity_type: "individual" }),
      defaults: expect.objectContaining({ currency: "chf" }),
      dashboard: "express",
    });
  });

  it("requests recipient + stripe_transfers capability (Connect v2 separate-charges-and-transfers)", async () => {
    await createStripeConnectedAccount({ userId: "u", email: "e@x.com" });
    const args = mockAccountsCreate.mock.calls[0]?.[0];
    expect(args).toMatchObject({
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
    });
  });

  it("sets platform as fees_collector and losses_collector", async () => {
    await createStripeConnectedAccount({ userId: "u", email: "e@x.com" });
    const args = mockAccountsCreate.mock.calls[0]?.[0];
    expect(args.defaults.responsibilities).toEqual({
      fees_collector: "application",
      losses_collector: "application",
    });
  });

  it("returns the created account object", async () => {
    mockAccountsCreate.mockResolvedValue({ id: "acct_abc" });
    const result = await createStripeConnectedAccount({
      userId: "u",
      email: "e@x.com",
    });
    expect(result).toEqual({ id: "acct_abc" });
  });
});
