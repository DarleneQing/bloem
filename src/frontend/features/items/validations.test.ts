import { describe, expect, it } from "vitest";
import {
  itemUploadSchema,
  itemUpdateSchema,
  moveToRackSchema,
  privacyToggleSchema,
  validateImageFile,
  validateImageFiles,
} from "./validations";

const UUID = "11111111-1111-4111-8111-111111111111";

const validItem = {
  title: "Black Wool Coat",
  description: "Classic mid-length wool coat in pristine condition.",
  category: "OUTERWEAR" as const,
  condition: "EXCELLENT" as const,
  isPublic: true,
};

describe("itemUploadSchema", () => {
  it("accepts a minimal valid item", () => {
    expect(itemUploadSchema.safeParse(validItem).success).toBe(true);
  });

  it("defaults isPublic to true when omitted", () => {
    const result = itemUploadSchema.safeParse({
      title: validItem.title,
      description: validItem.description,
      category: validItem.category,
      condition: validItem.condition,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(true);
    }
  });

  it.each([
    ["title too short", { ...validItem, title: "Hi" }],
    ["title too long", { ...validItem, title: "x".repeat(201) }],
    ["description too short", { ...validItem, description: "short" }],
    ["description too long", { ...validItem, description: "x".repeat(501) }],
    ["invalid category", { ...validItem, category: "NOT_A_CATEGORY" }],
    ["invalid condition", { ...validItem, condition: "PERFECT" }],
    ["invalid size", { ...validItem, size: "Large" }],
    ["brand too long", { ...validItem, brand: "x".repeat(101) }],
    ["color too long", { ...validItem, color: "x".repeat(51) }],
    ["sellingPrice below CHF 1", { ...validItem, sellingPrice: 0.5 }],
    ["sellingPrice above CHF 1000", { ...validItem, sellingPrice: 1001 }],
  ])("rejects %s", (_label, input) => {
    expect(itemUploadSchema.safeParse(input).success).toBe(false);
  });

  it("accepts every valid category enum value", () => {
    for (const c of [
      "TOPS",
      "BOTTOMS",
      "DRESSES",
      "OUTERWEAR",
      "SHOES",
      "ACCESSORIES",
      "BAGS",
      "JEWELRY",
      "OTHER",
    ]) {
      expect(
        itemUploadSchema.safeParse({ ...validItem, category: c }).success,
        c
      ).toBe(true);
    }
  });

  it("accepts every valid size", () => {
    for (const s of ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "ONE_SIZE"]) {
      expect(
        itemUploadSchema.safeParse({ ...validItem, size: s }).success,
        s
      ).toBe(true);
    }
  });

  it("accepts price boundaries CHF 1 and CHF 1000", () => {
    expect(
      itemUploadSchema.safeParse({ ...validItem, sellingPrice: 1 }).success
    ).toBe(true);
    expect(
      itemUploadSchema.safeParse({ ...validItem, sellingPrice: 1000 }).success
    ).toBe(true);
  });
});

describe("itemUpdateSchema (all fields optional)", () => {
  it("accepts an empty object", () => {
    expect(itemUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a partial update", () => {
    expect(
      itemUpdateSchema.safeParse({ title: "Updated title here" }).success
    ).toBe(true);
  });

  it("still validates supplied fields", () => {
    expect(itemUpdateSchema.safeParse({ title: "x" }).success).toBe(false);
  });
});

describe("moveToRackSchema", () => {
  it("accepts valid input", () => {
    expect(
      moveToRackSchema.safeParse({ itemId: UUID, sellingPrice: 50 }).success
    ).toBe(true);
  });
  it("rejects non-UUID itemId", () => {
    expect(
      moveToRackSchema.safeParse({ itemId: "abc", sellingPrice: 50 }).success
    ).toBe(false);
  });
  it("enforces price boundaries 1..1000", () => {
    expect(
      moveToRackSchema.safeParse({ itemId: UUID, sellingPrice: 0 }).success
    ).toBe(false);
    expect(
      moveToRackSchema.safeParse({ itemId: UUID, sellingPrice: 1001 }).success
    ).toBe(false);
  });
});

describe("privacyToggleSchema", () => {
  it("accepts UUID", () => {
    expect(privacyToggleSchema.safeParse({ itemId: UUID }).success).toBe(true);
  });
  it("rejects non-UUID", () => {
    expect(privacyToggleSchema.safeParse({ itemId: "abc" }).success).toBe(false);
  });
});

describe("validateImageFile", () => {
  function fakeFile(name: string, type: string, size: number): File {
    const file = new File(["x"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  }

  it("accepts a JPEG up to 5MB", () => {
    expect(validateImageFile(fakeFile("a.jpg", "image/jpeg", 4 * 1024 * 1024))).toBe(
      true
    );
  });

  it("accepts PNG and WebP", () => {
    expect(validateImageFile(fakeFile("a.png", "image/png", 1024))).toBe(true);
    expect(validateImageFile(fakeFile("a.webp", "image/webp", 1024))).toBe(true);
  });

  it("throws when file > 5MB", () => {
    expect(() =>
      validateImageFile(fakeFile("big.jpg", "image/jpeg", 5 * 1024 * 1024 + 1))
    ).toThrow(/too large/i);
  });

  it("throws on invalid mime type", () => {
    expect(() =>
      validateImageFile(fakeFile("a.gif", "image/gif", 1024))
    ).toThrow(/invalid type/i);
  });
});

describe("validateImageFiles", () => {
  function fakeFile(): File {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1024 });
    return file;
  }

  it("throws on empty array", () => {
    expect(() => validateImageFiles([])).toThrow(/at least 1/i);
  });

  it("accepts 1 to 5 files", () => {
    expect(validateImageFiles([fakeFile()])).toBe(true);
    expect(
      validateImageFiles([fakeFile(), fakeFile(), fakeFile(), fakeFile(), fakeFile()])
    ).toBe(true);
  });

  it("throws on > 5 files", () => {
    expect(() =>
      validateImageFiles([
        fakeFile(),
        fakeFile(),
        fakeFile(),
        fakeFile(),
        fakeFile(),
        fakeFile(),
      ])
    ).toThrow(/maximum 5/i);
  });
});
