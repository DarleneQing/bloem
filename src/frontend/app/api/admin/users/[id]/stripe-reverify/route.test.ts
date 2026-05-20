/**
 * Tests for POST /api/admin/users/[id]/stripe-reverify.
 *
 * Admin-only. Two paths:
 *   A. seller already has stripe_account_id → reuse, create only the
 *      AccountLink (no second Connect account created).
 *   B. seller does NOT have stripe_account_id → create a Connect account,
 *      persist the id, THEN create the AccountLink.
 *
 * Critical: if profile update fails after Stripe account creation, we must
 * NOT proceed to create the link (otherwise we hand out a link to an
 * orphan account that we can't reconcile).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAdminServer,
  mockFrom,
  mockAccountLinksCreate,
  mockCreateConnectedAccount,
} = vi.hoisted(() => ({
  mockRequireAdminServer: vi.fn(),
  mockFrom: vi.fn(),
  mockAccountLinksCreate: vi.fn(),
  mockCreateConnectedAccount: vi.fn(),
}));

vi.mock("@/lib/auth/utils", () => ({
  requireAdminServer: () => mockRequireAdminServer(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    accountLinks: { create: mockAccountLinksCreate },
  }),
  getAppUrl: () => "https://app.bloem.test",
}));

vi.mock("@/lib/stripe/connect-account", () => ({
  createStripeConnectedAccount: (input: unknown) =>
    mockCreateConnectedAccount(input),
}));

import { POST } from "./route";

const TARGET_ID = "22222222-2222-4222-8222-222222222222";

function selectSingleChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function updateEqChain(result: { error: unknown }) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(result),
    }),
  };
}

function request() {
  return new Request(
    `http://localhost/api/admin/users/${TARGET_ID}/stripe-reverify`,
    { method: "POST" }
  ) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminServer.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
});

describe("POST /api/admin/users/[id]/stripe-reverify", () => {
  it("returns 500 when admin gate throws", async () => {
    mockRequireAdminServer.mockRejectedValue(new Error("not admin"));
    const res = await POST(request(), { params: { id: TARGET_ID } });
    expect(res.status).toBe(500);
  });

  it("returns 404 when target user is not found", async () => {
    mockFrom.mockReturnValueOnce(
      selectSingleChain({ data: null, error: { message: "no rows" } })
    );
    const res = await POST(request(), { params: { id: TARGET_ID } });
    expect(res.status).toBe(404);
  });

  // ----- Path A: existing stripe_account_id -----------------------------

  describe("reuse existing stripe_account_id (no new Connect account)", () => {
    it("calls accountLinks.create against the existing account", async () => {
      mockFrom.mockReturnValueOnce(
        selectSingleChain({
          data: {
            id: TARGET_ID,
            email: "seller@example.com",
            first_name: "Alice",
            last_name: "Doe",
            stripe_account_id: "acct_existing",
            stripe_details_submitted: true,
          },
          error: null,
        })
      );
      mockAccountLinksCreate.mockResolvedValue({
        url: "https://connect.stripe.com/setup/abc",
        object: "account_link",
      });

      const res = await POST(request(), { params: { id: TARGET_ID } });
      expect(res.status).toBe(200);

      expect(mockCreateConnectedAccount).not.toHaveBeenCalled();
      expect(mockAccountLinksCreate).toHaveBeenCalledWith({
        account: "acct_existing",
        refresh_url: "https://app.bloem.test/profile?onboarding=refresh",
        return_url: "https://app.bloem.test/profile?onboarding=return",
        type: "account_onboarding",
      });

      const body = await res.json();
      expect(body.data.url).toBe("https://connect.stripe.com/setup/abc");
      expect(body.data.linkType).toBe("account_onboarding");
    });
  });

  // ----- Path B: create new account -------------------------------------

  describe("create new connected account when stripe_account_id missing", () => {
    it("creates Connect account, persists id, then creates AccountLink", async () => {
      let call = 0;
      mockFrom.mockImplementation(() => {
        call++;
        if (call === 1) {
          return selectSingleChain({
            data: {
              id: TARGET_ID,
              email: "newseller@example.com",
              first_name: "Bob",
              last_name: "Smith",
              stripe_account_id: null,
              stripe_details_submitted: false,
            },
            error: null,
          });
        }
        return updateEqChain({ error: null });
      });
      mockCreateConnectedAccount.mockResolvedValue({ id: "acct_new" });
      mockAccountLinksCreate.mockResolvedValue({
        url: "https://connect.stripe.com/setup/new",
      });

      const res = await POST(request(), { params: { id: TARGET_ID } });
      expect(res.status).toBe(200);

      expect(mockCreateConnectedAccount).toHaveBeenCalledWith({
        userId: TARGET_ID,
        email: "newseller@example.com",
        displayName: "Bob Smith",
      });
      expect(mockAccountLinksCreate).toHaveBeenCalledWith(
        expect.objectContaining({ account: "acct_new" })
      );
    });

    it("passes undefined displayName when first/last names are empty", async () => {
      let call = 0;
      mockFrom.mockImplementation(() => {
        call++;
        if (call === 1) {
          return selectSingleChain({
            data: {
              id: TARGET_ID,
              email: "newseller@example.com",
              first_name: null,
              last_name: null,
              stripe_account_id: null,
              stripe_details_submitted: false,
            },
            error: null,
          });
        }
        return updateEqChain({ error: null });
      });
      mockCreateConnectedAccount.mockResolvedValue({ id: "acct_new" });
      mockAccountLinksCreate.mockResolvedValue({ url: "u" });

      await POST(request(), { params: { id: TARGET_ID } });
      expect(mockCreateConnectedAccount).toHaveBeenCalledWith({
        userId: TARGET_ID,
        email: "newseller@example.com",
        displayName: undefined,
      });
    });

    it("does NOT create AccountLink if profile update fails (no orphan link)", async () => {
      let call = 0;
      mockFrom.mockImplementation(() => {
        call++;
        if (call === 1) {
          return selectSingleChain({
            data: {
              id: TARGET_ID,
              email: "x@x.com",
              first_name: "X",
              last_name: "Y",
              stripe_account_id: null,
              stripe_details_submitted: false,
            },
            error: null,
          });
        }
        return updateEqChain({ error: { message: "db conflict" } });
      });
      mockCreateConnectedAccount.mockResolvedValue({ id: "acct_new" });

      const res = await POST(request(), { params: { id: TARGET_ID } });
      expect(res.status).toBe(500);
      expect(mockAccountLinksCreate).not.toHaveBeenCalled();
      const body = await res.json();
      expect(body.error).toMatch(/failed to link/i);
    });
  });

  // ----- sensitive data -------------------------------------------------

  describe("sensitive data leak guard", () => {
    it("does not echo the Stripe SDK error stack to the client", async () => {
      mockFrom.mockReturnValueOnce(
        selectSingleChain({
          data: {
            id: TARGET_ID,
            email: "x@x.com",
            first_name: "X",
            last_name: "Y",
            stripe_account_id: "acct_existing",
            stripe_details_submitted: true,
          },
          error: null,
        })
      );
      const err: Error & { stack?: string } = new Error("rate_limit");
      err.stack = "...sk_live_NEVERLEAKTHIS...";
      mockAccountLinksCreate.mockRejectedValue(err);

      const res = await POST(request(), { params: { id: TARGET_ID } });
      expect(res.status).toBe(500);
      const body = await res.text();
      expect(body).not.toContain("sk_live_");
      expect(body).not.toContain("NEVERLEAKTHIS");
    });
  });
});
