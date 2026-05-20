import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncProfileInput } from "./audiences";

const createMock = vi.fn();
const updateMock = vi.fn();
const removeMock = vi.fn();

vi.mock("@/lib/email/resend", () => ({
  resend: {
    contacts: {
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      remove: (...args: unknown[]) => removeMock(...args),
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
    createMock.mockReset().mockResolvedValue({ data: { id: "c_1" }, error: null });
    updateMock.mockReset().mockResolvedValue({ data: {}, error: null });
    removeMock.mockReset().mockResolvedValue({ data: {} });

    process.env.RESEND_AUDIENCE_ID = "aud_default";
  });

  afterEach(() => {
    delete process.env.RESEND_AUDIENCE_ID;
  });

  describe("syncProfile", () => {
    it("creates a contact with unsubscribed=false when consented", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(baseProfile());

      expect(createMock).toHaveBeenCalledTimes(1);
      const call = createMock.mock.calls[0][0];
      expect(call.audienceId).toBe("aud_default");
      expect(call.email).toBe("user@example.com");
      expect(call.firstName).toBe("Ada");
      expect(call.lastName).toBe("Lovelace");
      expect(call.unsubscribed).toBe(false);
      expect(call.properties.bloem_segment).toBe("buyer");
      expect(call.properties.bloem_unsubscribe_token).toBe("tok-1");
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("sets bloem_segment=verified_seller when Stripe payouts are enabled", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(
        baseProfile({
          stripe_account_id: "acct_1",
          stripe_payouts_enabled: true,
        })
      );

      const call = createMock.mock.calls[0][0];
      expect(call.properties.bloem_segment).toBe("verified_seller");
    });

    it("sets bloem_segment=admin when role is ADMIN", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(baseProfile({ role: "ADMIN" }));
      expect(createMock.mock.calls[0][0].properties.bloem_segment).toBe(
        "admin"
      );
    });

    it("sets unsubscribed=true when consent is false", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(baseProfile({ marketing_consent: false }));
      expect(createMock.mock.calls[0][0].unsubscribed).toBe(true);
    });

    it("sets unsubscribed=true when account is suspended (regardless of consent)", async () => {
      const { syncProfile } = await import("./audiences");
      await syncProfile(
        baseProfile({
          marketing_consent: true,
          suspended_at: new Date().toISOString(),
        })
      );
      expect(createMock.mock.calls[0][0].unsubscribed).toBe(true);
    });

    it("falls back to update when create returns an error (already exists)", async () => {
      createMock.mockResolvedValueOnce({
        data: null,
        error: { message: "Contact already exists" },
      });
      const { syncProfile } = await import("./audiences");
      await syncProfile(baseProfile());

      expect(createMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledTimes(1);
      const updateCall = updateMock.mock.calls[0][0];
      expect(updateCall.audienceId).toBe("aud_default");
      expect(updateCall.email).toBe("user@example.com");
      expect(updateCall.properties.bloem_segment).toBe("buyer");
    });

    it("falls back to update when create throws", async () => {
      createMock.mockRejectedValueOnce(new Error("network"));
      const { syncProfile } = await import("./audiences");
      await syncProfile(baseProfile());

      expect(updateMock).toHaveBeenCalledTimes(1);
    });

    it("is a no-op when RESEND_AUDIENCE_ID is unset", async () => {
      delete process.env.RESEND_AUDIENCE_ID;
      const { syncProfile } = await import("./audiences");
      await syncProfile(baseProfile());

      expect(createMock).not.toHaveBeenCalled();
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("does not throw when both create AND update fail (silent failure)", async () => {
      createMock.mockRejectedValueOnce(new Error("network"));
      updateMock.mockRejectedValueOnce(new Error("still down"));
      const { syncProfile } = await import("./audiences");
      await expect(syncProfile(baseProfile())).resolves.toBeUndefined();
    });
  });

  describe("removeContact", () => {
    it("removes by email from the configured audience", async () => {
      const { removeContact } = await import("./audiences");
      await removeContact("x@y.com");

      expect(removeMock).toHaveBeenCalledWith({
        audienceId: "aud_default",
        email: "x@y.com",
      });
    });

    it("is a no-op when RESEND_AUDIENCE_ID is unset", async () => {
      delete process.env.RESEND_AUDIENCE_ID;
      const { removeContact } = await import("./audiences");
      await removeContact("x@y.com");
      expect(removeMock).not.toHaveBeenCalled();
    });

    it("swallows errors silently", async () => {
      removeMock.mockRejectedValueOnce(new Error("boom"));
      const { removeContact } = await import("./audiences");
      await expect(removeContact("x@y.com")).resolves.toBeUndefined();
    });
  });
});
