import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isActiveSellerProfile,
  handleAuthError,
  isAuthError,
  isValidEmail,
  validatePasswordStrength,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getAuthRedirectUrl,
  getSignOutRedirectUrl,
  getProtectedRedirectUrl,
} from "./utils";
import type { User } from "@supabase/supabase-js";

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
});

// ----- isActiveSellerProfile ------------------------------------------------

describe("isActiveSellerProfile", () => {
  it("is true only when stripe_payouts_enabled is true", () => {
    expect(isActiveSellerProfile({ stripe_payouts_enabled: true })).toBe(true);
  });
  it.each([
    [false],
    [null],
    [undefined],
  ])("is false when stripe_payouts_enabled is %s", (val) => {
    expect(isActiveSellerProfile({ stripe_payouts_enabled: val })).toBe(false);
  });
  it("ignores legacy iban_verified_at — Connect is the source of truth", () => {
    // Even with old IBAN flag set, the active-seller check should ignore it.
    expect(
      isActiveSellerProfile({
        stripe_payouts_enabled: false,
        // @ts-expect-error — proves the function only reads stripe_payouts_enabled
        iban_verified_at: "2026-01-01T00:00:00Z",
      })
    ).toBe(false);
  });
});

// ----- handleAuthError ------------------------------------------------------

describe("handleAuthError", () => {
  it.each([
    ["Invalid login credentials", "Invalid email or password"],
    ["Email not confirmed", "Please check your email and confirm your account"],
    ["User not found", "No account found with this email address"],
    ["Password should be at least 8 chars", "Password must be at least 8 characters long"],
    ["Invalid email", "Please enter a valid email address"],
    ["User already registered", "An account with this email already exists"],
    ["Too many requests", "Too many attempts. Please try again later"],
  ])("maps Supabase message '%s' to friendly text", (input, expected) => {
    expect(handleAuthError({ message: input }, "signIn")).toBe(expected);
  });

  it("falls back to the original message when unrecognized", () => {
    expect(handleAuthError({ message: "Something weird" }, "op")).toBe(
      "Something weird"
    );
  });

  it("falls back to generic copy when no message", () => {
    expect(handleAuthError({}, "op")).toBe("An authentication error occurred");
  });

  it("logs to console.error with the operation name", () => {
    handleAuthError({ message: "Whatever" }, "myOp");
    expect(errorSpy).toHaveBeenCalled();
    const [first] = errorSpy.mock.calls[0] as string[];
    expect(first).toContain("myOp");
  });
});

// ----- isAuthError ----------------------------------------------------------

describe("isAuthError", () => {
  it.each([
    "Invalid login credentials",
    "Email not confirmed",
    "User not found",
    "Password should be at least 8 characters",
    "Invalid email",
    "User already registered",
    "Too many requests",
    "Authentication required",
    "Active seller status required",
    "Admin status required",
  ])("returns true for %s", (msg) => {
    expect(isAuthError({ message: msg })).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isAuthError({ message: "Network timeout" })).toBe(false);
  });

  it("returns false when message is undefined", () => {
    expect(isAuthError({})).toBe(false);
  });
});

// ----- isValidEmail ---------------------------------------------------------

describe("isValidEmail", () => {
  it.each([
    ["user@example.com", true],
    ["a@b.co", true],
    ["plus+tag@domain.io", true],
    ["", false],
    ["no-at-sign", false],
    ["double@@sign.com", false],
    ["spaces in@email.com", false],
    ["@nolocal.com", false],
    ["nodomain@", false],
  ])("isValidEmail(%s) === %s", (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });
});

// ----- validatePasswordStrength --------------------------------------------

describe("validatePasswordStrength", () => {
  it("isValid=true for a strong password with no errors", () => {
    const r = validatePasswordStrength("SecureP@ss1");
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.strength).toBeGreaterThan(0);
  });

  it("collects all four character-class errors for an empty string", () => {
    const r = validatePasswordStrength("");
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBe(5); // length + 4 character classes
  });

  it("returns a short-only error when long enough but no variety", () => {
    const r = validatePasswordStrength("aa");
    expect(r.errors).toContain("Password must be at least 8 characters long");
  });

  it("strength is between 0 and 100", () => {
    const r = validatePasswordStrength("SecureP@ss1");
    expect(r.strength).toBeGreaterThanOrEqual(0);
    expect(r.strength).toBeLessThanOrEqual(100);
  });
});

// ----- calculatePasswordStrength -------------------------------------------

describe("calculatePasswordStrength", () => {
  it("returns 0..100", () => {
    for (const pw of ["", "x", "Password1", "SecureP@ss1", "Ultra!Mega2024SecurePw"]) {
      const s = calculatePasswordStrength(pw);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it("penalizes repeated characters (3+ run)", () => {
    const repeated = calculatePasswordStrength("Aaa1!Aaa1");
    const varied = calculatePasswordStrength("Bc1!Df2@Gh3#");
    expect(varied).toBeGreaterThan(repeated);
  });

  it("penalizes common sequences abc / 123 / qwe", () => {
    expect(calculatePasswordStrength("Abc1!Abc1!")).toBeLessThan(
      calculatePasswordStrength("Xz9!Mn7@Lk5#")
    );
  });

  it("longer passwords score higher", () => {
    expect(calculatePasswordStrength("ShortP@s1")).toBeLessThan(
      calculatePasswordStrength("ShortP@s1ButLonger123!")
    );
  });
});

// ----- getPasswordStrengthLabel --------------------------------------------

describe("getPasswordStrengthLabel", () => {
  it.each([
    [0, "Weak"],
    [29, "Weak"],
    [30, "Fair"],
    [59, "Fair"],
    [60, "Good"],
    [79, "Good"],
    [80, "Strong"],
    [100, "Strong"],
  ])("strength %d → '%s'", (s, label) => {
    expect(getPasswordStrengthLabel(s)).toBe(label);
  });
});

// ----- redirect URL helpers ------------------------------------------------

describe("redirect URL helpers", () => {
  it("getAuthRedirectUrl returns '/' for null user", () => {
    expect(getAuthRedirectUrl(null)).toBe("/");
  });
  it("getAuthRedirectUrl returns '/profile' for an authed user", () => {
    expect(getAuthRedirectUrl({ id: "u1" } as User)).toBe("/profile");
  });
  it("getSignOutRedirectUrl returns the sign-in page", () => {
    expect(getSignOutRedirectUrl()).toBe("/auth/sign-in");
  });
  it("getProtectedRedirectUrl returns the sign-in page", () => {
    expect(getProtectedRedirectUrl()).toBe("/auth/sign-in");
  });
});
