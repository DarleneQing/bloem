import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncProfileInput } from "./audiences";

const createMock = vi.fn();
const removeMock = vi.fn();
const listMock = vi.fn();

vi.mock("@/lib/email/resend", () => ({
  resend: {
    contacts: {
      create: (...args: unknown[]) => createMock(...args),
      remove: (...args: unknown[]) => removeMock(...args),
      list: (...args: unknown[]) => listMock(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

function baseProfile(
  overrides: Partial<SyncProfileInput> = {}
): SyncProfileInput {
  return {
    email: "user@example.com",
    first_name: "Ada",
    last_name: "Lovelace",
    role: "USER",
    stripe_account_id: null,
    stripe_payouts_enabled: false,
    marketing_consent: true,
    marketing_unsubscribe_token: "tok-1",
    suspended_at: null,
    ...overrides,
  };
}

describe("audiences", () => {
  beforeEach(() => {
    createMock.mockReset().mockResolvedValue({ data: { id: "c_1" } });
    removeMock.mockReset().mockResolvedValue({ data: {} });
    listMock.mockReset().mockResolvedValue({ data: { data: [] } });

    process.env.RESEND_AUDIENCE_ID_BUYER = "aud_buyer";
    process.env.RESEND_AUDIENCE_ID_PENDING_SELLER = "aud_pending";
    process.env.RESEND_AUDIENCE_ID_VERIFIED_SELLER = "aud_verified";
    process.env.RESEND_AUDIENCE_ID_ADMIN = "aud_admin";
  });

  afterEach(() => {
    delete process.env.RESEND_AUDIENCE_ID_BUYER;
    delete process.env.RESEND_AUDIENCE_ID_PENDING_SELLER;
    delete process.env.RESEND_AUDIENCE_ID_VERIFIED_SELLER;
    delete process.env.RESEND_AUDIENCE_ID_ADMIN;
  });

  describe("syncProfile", () => {
    it("removes contact from every audience when consent is false", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(baseProfile({ marketing_consent: false }));

      expect(createMock).not.toHaveBeenCalled();
      expect(removeMock).toHaveBeenCalledTimes(4);
      const audienceIds = removeMock.mock.calls.map(
        (c) => (c[0] as { audienceId: string }).audienceId
      );
      expect(new Set(audienceIds)).toEqual(
        new Set(["aud_buyer", "aud_pending", "aud_verified", "aud_admin"])
      );
    });

    it("removes contact from every audience when account is suspended", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(
        baseProfile({
          marketing_consent: true,
          suspended_at: new Date().toISOString(),
        })
      );

      expect(createMock).not.toHaveBeenCalled();
      expect(removeMock).toHaveBeenCalledTimes(4);
    });

    it("adds to buyer audience and removes from the other three when consented buyer", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(baseProfile());

      expect(createMock).toHaveBeenCalledTimes(1);
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          audienceId: "aud_buyer",
          email: "user@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
          unsubscribed: false,
        })
      );
      expect(removeMock).toHaveBeenCalledTimes(3);
      const removedFrom = removeMock.mock.calls.map(
        (c) => (c[0] as { audienceId: string }).audienceId
      );
      expect(new Set(removedFrom)).toEqual(
        new Set(["aud_pending", "aud_verified", "aud_admin"])
      );
    });

    it("places a Stripe-payouts-enabled user in verified_seller", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(
        baseProfile({
          stripe_account_id: "acct_1",
          stripe_payouts_enabled: true,
        })
      );

      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ audienceId: "aud_verified" })
      );
    });

    it("places an admin user in admin audience regardless of Stripe state", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(
        baseProfile({
          role: "ADMIN",
          stripe_account_id: "acct_1",
          stripe_payouts_enabled: true,
        })
      );

      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ audienceId: "aud_admin" })
      );
    });

    it("skips audiences without configured env vars (no throw)", async () => {
      delete process.env.RESEND_AUDIENCE_ID_PENDING_SELLER;
      const { syncProfile } = await import("./audiences");
      await syncProfile(baseProfile());

      // We still attempt the other three.
      expect(createMock).toHaveBeenCalledTimes(1);
      expect(removeMock).toHaveBeenCalledTimes(2);
    });

    it("does not throw when Resend errors — failure is swallowed and logged", async () => {
      createMock.mockRejectedValueOnce(new Error("resend down"));
      removeMock.mockRejectedValueOnce(new Error("resend down"));

      const { syncProfile } = await import("./audiences");
      await expect(syncProfile(baseProfile())).resolves.toBeUndefined();
    });
  });

  describe("addContact / removeContact", () => {
    it("addContact is a no-op when env var is missing", async () => {
      delete process.env.RESEND_AUDIENCE_ID_BUYER;
      const { addContact } = await import("./audiences");
      await addContact("buyer", {
        email: "x@y.com",
        firstName: null,
        lastName: null,
        unsubscribeToken: "tok",
      });
      expect(createMock).not.toHaveBeenCalled();
    });

    it("removeContact is a no-op when env var is missing", async () => {
      delete process.env.RESEND_AUDIENCE_ID_BUYER;
      const { removeContact } = await import("./audiences");
      await removeContact("buyer", "x@y.com");
      expect(removeMock).not.toHaveBeenCalled();
    });
  });
});
