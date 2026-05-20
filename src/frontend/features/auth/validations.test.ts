import { describe, expect, it } from "vitest";
import {
  signUpSchema,
  signInSchema,
  updateProfileSchema,
  ibanSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "./validations";

describe("signUpSchema", () => {
  const valid = {
    email: "user@example.com",
    password: "SecureP@ss1",
    firstName: "Jane",
    lastName: "Doe",
  };

  it("accepts minimum valid input", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional phone + address", () => {
    expect(
      signUpSchema.safeParse({
        ...valid,
        phone: "+41791234567",
        address: "Bahnhofstrasse 1",
      }).success
    ).toBe(true);
  });

  it.each([
    ["empty email", { ...valid, email: "" }],
    ["malformed email", { ...valid, email: "not-an-email" }],
    ["short password", { ...valid, password: "Aa1!" }],
    ["password missing uppercase", { ...valid, password: "lowercase1!" }],
    ["password missing lowercase", { ...valid, password: "UPPERCASE1!" }],
    ["password missing digit", { ...valid, password: "Password!" }],
    ["password missing special char", { ...valid, password: "Password1" }],
    ["empty firstName", { ...valid, firstName: "" }],
    ["firstName too short", { ...valid, firstName: "A" }],
    ["firstName too long", { ...valid, firstName: "x".repeat(51) }],
    ["empty lastName", { ...valid, lastName: "" }],
    ["lastName too short", { ...valid, lastName: "B" }],
  ])("rejects %s", (_label, input) => {
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it("reports the field path on error", () => {
    const result = signUpSchema.safeParse({ ...valid, email: "bad" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["email"]);
    }
  });
});

describe("signInSchema", () => {
  it("accepts any non-empty password", () => {
    expect(
      signInSchema.safeParse({ email: "u@x.com", password: "x" }).success
    ).toBe(true);
  });

  it("rejects empty password", () => {
    expect(
      signInSchema.safeParse({ email: "u@x.com", password: "" }).success
    ).toBe(false);
  });

  it("rejects malformed email", () => {
    expect(
      signInSchema.safeParse({ email: "bad", password: "x" }).success
    ).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a single field update", () => {
    expect(updateProfileSchema.safeParse({ firstName: "Alice" }).success).toBe(
      true
    );
  });

  it("accepts empty string for avatarUrl (or(z.literal('')))", () => {
    expect(updateProfileSchema.safeParse({ avatarUrl: "" }).success).toBe(true);
  });

  it("accepts a valid HTTPS URL for avatarUrl", () => {
    expect(
      updateProfileSchema.safeParse({ avatarUrl: "https://cdn.example.com/a.png" })
        .success
    ).toBe(true);
  });

  it("rejects malformed avatarUrl", () => {
    expect(
      updateProfileSchema.safeParse({ avatarUrl: "not-a-url" }).success
    ).toBe(false);
  });
});

describe("ibanSchema", () => {
  const valid = {
    iban: "NL91ABNA0417164300",
    bankName: "ABN AMRO",
    accountHolderName: "Jane Doe",
  };

  it("accepts a valid IBAN payload", () => {
    expect(ibanSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts Swiss IBAN", () => {
    expect(
      ibanSchema.safeParse({ ...valid, iban: "CH9300762011623852957" }).success
    ).toBe(true);
  });

  it("rejects IBAN containing whitespace", () => {
    expect(
      ibanSchema.safeParse({ ...valid, iban: "NL91 ABNA 0417 1643 00" }).success
    ).toBe(false);
  });

  it("rejects IBAN shorter than 15 chars", () => {
    expect(ibanSchema.safeParse({ ...valid, iban: "NL12" }).success).toBe(false);
  });

  it("rejects IBAN longer than 34 chars", () => {
    expect(
      ibanSchema.safeParse({ ...valid, iban: "A".repeat(35) }).success
    ).toBe(false);
  });

  it("rejects empty bank name and account holder name", () => {
    expect(ibanSchema.safeParse({ ...valid, bankName: "" }).success).toBe(false);
    expect(
      ibanSchema.safeParse({ ...valid, accountHolderName: "" }).success
    ).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(resetPasswordSchema.safeParse({ email: "u@x.com" }).success).toBe(true);
  });
  it("rejects malformed email", () => {
    expect(resetPasswordSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});

describe("updatePasswordSchema (cross-field refine)", () => {
  it("accepts matching strong passwords", () => {
    expect(
      updatePasswordSchema.safeParse({
        password: "SecureP@ss1",
        confirmPassword: "SecureP@ss1",
      }).success
    ).toBe(true);
  });

  it("rejects mismatched passwords on the confirmPassword path", () => {
    const result = updatePasswordSchema.safeParse({
      password: "SecureP@ss1",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes("confirmPassword"))
      ).toBe(true);
    }
  });

  it("rejects weak password even if confirm matches", () => {
    expect(
      updatePasswordSchema.safeParse({
        password: "weak",
        confirmPassword: "weak",
      }).success
    ).toBe(false);
  });
});
