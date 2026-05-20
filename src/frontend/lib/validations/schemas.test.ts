import { describe, expect, it } from "vitest";
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
  urlSchema,
  uuidSchema,
  ibanSchema,
  userSignInSchema,
  passwordResetSchema,
  passwordUpdateSchema,
  wardrobePrivacyToggleSchema,
  itemCategorySchema,
  itemConditionSchema,
  itemStatusSchema,
  genderSchema,
  moveToRackSchema,
  privacyToggleSchema,
  marketStatusSchema,
  marketCreationSchema,
  marketUpdateSchema,
  qrBatchCreationSchema,
  qrCodeLinkingSchema,
  qrCodeScanSchema,
  qrCodeInvalidationSchema,
  addToCartSchema,
  removeFromCartSchema,
  extendReservationSchema,
} from "./schemas";

const UUID = "11111111-1111-4111-8111-111111111111";

// ----- primitives -----------------------------------------------------------

describe("primitive schemas", () => {
  describe("emailSchema", () => {
    it("accepts standard email", () => {
      expect(emailSchema.safeParse("user@example.com").success).toBe(true);
    });
    it("rejects empty / malformed / overlong", () => {
      expect(emailSchema.safeParse("").success).toBe(false);
      expect(emailSchema.safeParse("not-an-email").success).toBe(false);
      const long = `${"a".repeat(250)}@example.com`;
      expect(emailSchema.safeParse(long).success).toBe(false);
    });
  });

  describe("passwordSchema", () => {
    it.each([
      ["weak short", "Aa1!"],
      ["no upper", "lowercase1!"],
      ["no lower", "UPPERCASE1!"],
      ["no digit", "NoDigit!"],
      ["no special", "NoSpecial1"],
      ["too long", "A1!" + "x".repeat(100)],
    ])("rejects %s", (_label, pw) => {
      expect(passwordSchema.safeParse(pw).success).toBe(false);
    });
    it("accepts a strong password", () => {
      expect(passwordSchema.safeParse("SecureP@ss1").success).toBe(true);
    });
  });

  describe("nameSchema", () => {
    it("accepts hyphens, apostrophes, periods", () => {
      expect(nameSchema.safeParse("Jean-Luc").success).toBe(true);
      expect(nameSchema.safeParse("O'Brien").success).toBe(true);
      expect(nameSchema.safeParse("St. John").success).toBe(true);
    });
    it("rejects digits and overlong names", () => {
      expect(nameSchema.safeParse("Alice2").success).toBe(false);
      expect(nameSchema.safeParse("A").success).toBe(false);
      expect(nameSchema.safeParse("x".repeat(51)).success).toBe(false);
    });
  });

  describe("phoneSchema", () => {
    it("accepts E.164-like number and empty string", () => {
      expect(phoneSchema.safeParse("+41791234567").success).toBe(true);
      expect(phoneSchema.safeParse("").success).toBe(true);
      expect(phoneSchema.safeParse(undefined).success).toBe(true);
    });
    it("rejects letters", () => {
      expect(phoneSchema.safeParse("+41abc").success).toBe(false);
    });
  });

  describe("urlSchema", () => {
    it("accepts https URL and empty string", () => {
      expect(urlSchema.safeParse("https://example.com").success).toBe(true);
      expect(urlSchema.safeParse("").success).toBe(true);
    });
    it("rejects malformed", () => {
      expect(urlSchema.safeParse("not-a-url").success).toBe(false);
    });
  });

  describe("uuidSchema", () => {
    it("accepts valid v4 UUID", () => {
      expect(uuidSchema.safeParse(UUID).success).toBe(true);
    });
    it("rejects non-UUID", () => {
      expect(uuidSchema.safeParse("abc").success).toBe(false);
    });
  });

  describe("ibanSchema (primitive)", () => {
    it("accepts NL IBAN, rejects whitespace and too-short", () => {
      expect(ibanSchema.safeParse("NL91ABNA0417164300").success).toBe(true);
      expect(ibanSchema.safeParse("NL91 ABNA").success).toBe(false);
      expect(ibanSchema.safeParse("NL12").success).toBe(false);
    });
  });
});

// ----- user schemas ---------------------------------------------------------

describe("user schemas", () => {
  it("userSignInSchema accepts any non-empty password", () => {
    expect(
      userSignInSchema.safeParse({ email: "u@x.com", password: "x" }).success
    ).toBe(true);
  });

  it("passwordResetSchema requires valid email", () => {
    expect(passwordResetSchema.safeParse({ email: "u@x.com" }).success).toBe(true);
    expect(passwordResetSchema.safeParse({ email: "bad" }).success).toBe(false);
  });

  describe("passwordUpdateSchema (cross-field refine)", () => {
    it("accepts matching passwords", () => {
      expect(
        passwordUpdateSchema.safeParse({
          password: "SecureP@ss1",
          confirmPassword: "SecureP@ss1",
        }).success
      ).toBe(true);
    });
    it("reports mismatch on confirmPassword path", () => {
      const r = passwordUpdateSchema.safeParse({
        password: "SecureP@ss1",
        confirmPassword: "Other!P@ss1",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(
          r.error.issues.some((i) => i.path.includes("confirmPassword"))
        ).toBe(true);
      }
    });
  });

  it("wardrobePrivacyToggleSchema requires boolean", () => {
    expect(wardrobePrivacyToggleSchema.safeParse({ public: true }).success).toBe(
      true
    );
    expect(wardrobePrivacyToggleSchema.safeParse({ public: "yes" }).success).toBe(
      false
    );
  });
});

// ----- item enums -----------------------------------------------------------

describe("item enum schemas", () => {
  it.each([
    "TOPS",
    "BOTTOMS",
    "DRESSES",
    "OUTERWEAR",
    "SHOES",
    "ACCESSORIES",
    "BAGS",
    "JEWELRY",
    "OTHER",
  ])("itemCategorySchema accepts %s", (c) => {
    expect(itemCategorySchema.safeParse(c).success).toBe(true);
  });

  it("itemCategorySchema rejects unknown", () => {
    expect(itemCategorySchema.safeParse("UNKNOWN").success).toBe(false);
  });

  it.each(["NEW_WITH_TAGS", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR"])(
    "itemConditionSchema accepts %s",
    (c) => expect(itemConditionSchema.safeParse(c).success).toBe(true)
  );

  it.each(["WARDROBE", "RACK", "SOLD"])(
    "itemStatusSchema accepts %s",
    (s) => expect(itemStatusSchema.safeParse(s).success).toBe(true)
  );

  it.each(["MEN", "WOMEN", "UNISEX"])("genderSchema accepts %s", (g) =>
    expect(genderSchema.safeParse(g).success).toBe(true)
  );
});

// ----- item action schemas --------------------------------------------------

describe("moveToRackSchema", () => {
  it("enforces UUID itemId and price 1..1000", () => {
    expect(
      moveToRackSchema.safeParse({ itemId: UUID, sellingPrice: 1 }).success
    ).toBe(true);
    expect(
      moveToRackSchema.safeParse({ itemId: UUID, sellingPrice: 1000 }).success
    ).toBe(true);
    expect(
      moveToRackSchema.safeParse({ itemId: UUID, sellingPrice: 0 }).success
    ).toBe(false);
    expect(
      moveToRackSchema.safeParse({ itemId: UUID, sellingPrice: 1001 }).success
    ).toBe(false);
    expect(
      moveToRackSchema.safeParse({ itemId: "abc", sellingPrice: 10 }).success
    ).toBe(false);
  });
});

describe("privacyToggleSchema", () => {
  it("requires UUID", () => {
    expect(privacyToggleSchema.safeParse({ itemId: UUID }).success).toBe(true);
    expect(privacyToggleSchema.safeParse({ itemId: "abc" }).success).toBe(false);
  });
});

// ----- market schemas -------------------------------------------------------

describe("market schemas", () => {
  const baseMarket = {
    name: "Lausanne Pop-Up",
    streetName: "Rue de Bourg",
    city: "Lausanne",
    country: "Switzerland",
    startDate: "2026-06-01T10:00",
    endDate: "2026-06-01T18:00",
  };

  it.each(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"])(
    "marketStatusSchema accepts %s",
    (s) => expect(marketStatusSchema.safeParse(s).success).toBe(true)
  );

  describe("marketCreationSchema", () => {
    it("accepts a minimal valid market", () => {
      expect(marketCreationSchema.safeParse(baseMarket).success).toBe(true);
    });
    it("rejects end before start", () => {
      const r = marketCreationSchema.safeParse({
        ...baseMarket,
        startDate: "2026-06-01T18:00",
        endDate: "2026-06-01T10:00",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.includes("endDate"))).toBe(true);
      }
    });
    it("rejects equal start and end (not strictly greater)", () => {
      expect(
        marketCreationSchema.safeParse({
          ...baseMarket,
          startDate: "2026-06-01T10:00",
          endDate: "2026-06-01T10:00",
        }).success
      ).toBe(false);
    });
    it("rejects malformed date strings", () => {
      expect(
        marketCreationSchema.safeParse({
          ...baseMarket,
          startDate: "not-a-date",
        }).success
      ).toBe(false);
    });
    it("rejects description shorter than 10 chars (when supplied)", () => {
      expect(
        marketCreationSchema.safeParse({
          ...baseMarket,
          description: "short",
        }).success
      ).toBe(false);
    });
  });

  describe("marketUpdateSchema (partial, with id)", () => {
    it("requires id", () => {
      expect(marketUpdateSchema.safeParse({}).success).toBe(false);
    });
    it("accepts a partial update", () => {
      expect(
        marketUpdateSchema.safeParse({ id: UUID, name: "New name" }).success
      ).toBe(true);
    });
    it("still enforces endDate > startDate when both supplied", () => {
      expect(
        marketUpdateSchema.safeParse({
          id: UUID,
          startDate: "2026-06-01T18:00",
          endDate: "2026-06-01T10:00",
        }).success
      ).toBe(false);
    });
    it("skips date check if only one date is supplied", () => {
      expect(
        marketUpdateSchema.safeParse({
          id: UUID,
          startDate: "2026-06-01T10:00",
        }).success
      ).toBe(true);
    });
  });
});

// ----- QR schemas -----------------------------------------------------------

describe("QR schemas", () => {
  describe("qrBatchCreationSchema", () => {
    const valid = { prefix: "BATCH_01", codeCount: 50, marketId: UUID };

    it("accepts a valid batch creation", () => {
      expect(qrBatchCreationSchema.safeParse(valid).success).toBe(true);
    });
    it("rejects lowercase prefix", () => {
      expect(
        qrBatchCreationSchema.safeParse({ ...valid, prefix: "batch" }).success
      ).toBe(false);
    });
    it("accepts hyphens and underscores in prefix", () => {
      expect(
        qrBatchCreationSchema.safeParse({ ...valid, prefix: "A_B-C" }).success
      ).toBe(true);
    });
    it("enforces codeCount 1..500", () => {
      expect(
        qrBatchCreationSchema.safeParse({ ...valid, codeCount: 0 }).success
      ).toBe(false);
      expect(
        qrBatchCreationSchema.safeParse({ ...valid, codeCount: 501 }).success
      ).toBe(false);
      expect(
        qrBatchCreationSchema.safeParse({ ...valid, codeCount: 500 }).success
      ).toBe(true);
    });
    it("requires marketId", () => {
      expect(
        qrBatchCreationSchema.safeParse({ prefix: "X", codeCount: 1 }).success
      ).toBe(false);
    });
  });

  it("qrCodeLinkingSchema requires both UUIDs", () => {
    expect(
      qrCodeLinkingSchema.safeParse({ qrCodeId: UUID, itemId: UUID }).success
    ).toBe(true);
    expect(
      qrCodeLinkingSchema.safeParse({ qrCodeId: "abc", itemId: UUID }).success
    ).toBe(false);
  });

  describe("qrCodeScanSchema (strict BLOEM-…-NNNNN)", () => {
    it("accepts proper format", () => {
      expect(
        qrCodeScanSchema.safeParse({ code: "BLOEM-TEST-00001" }).success
      ).toBe(true);
    });
    it("rejects missing BLOEM- prefix", () => {
      expect(qrCodeScanSchema.safeParse({ code: "TEST-00001" }).success).toBe(
        false
      );
    });
    it("rejects 4-digit sequence", () => {
      expect(
        qrCodeScanSchema.safeParse({ code: "BLOEM-TEST-0001" }).success
      ).toBe(false);
    });
  });

  it("qrCodeInvalidationSchema requires non-empty reason", () => {
    expect(
      qrCodeInvalidationSchema.safeParse({ reason: "lost" }).success
    ).toBe(true);
    expect(qrCodeInvalidationSchema.safeParse({ reason: "" }).success).toBe(
      false
    );
  });
});

// ----- cart schemas ---------------------------------------------------------

describe("cart schemas", () => {
  it("addToCartSchema requires UUID", () => {
    expect(addToCartSchema.safeParse({ itemId: UUID }).success).toBe(true);
    expect(addToCartSchema.safeParse({ itemId: "abc" }).success).toBe(false);
  });
  it("removeFromCartSchema requires UUID", () => {
    expect(removeFromCartSchema.safeParse({ cartItemId: UUID }).success).toBe(
      true
    );
    expect(removeFromCartSchema.safeParse({ cartItemId: "abc" }).success).toBe(
      false
    );
  });
  it("extendReservationSchema requires UUID", () => {
    expect(
      extendReservationSchema.safeParse({ cartItemId: UUID }).success
    ).toBe(true);
    expect(
      extendReservationSchema.safeParse({ cartItemId: "abc" }).success
    ).toBe(false);
  });
});
