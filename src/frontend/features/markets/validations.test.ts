import { describe, expect, it } from "vitest";
import { submitSellerApplicationSchema } from "./validations";

describe("submitSellerApplicationSchema", () => {
  const valid = {
    marketId: "550e8400-e29b-41d4-a716-446655440000",
    stylePhotoUrls: [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
      "https://example.com/4.jpg",
    ],
    socialMediaConsent: true as const,
    itemCount: 24,
    itemCountRange: "11-25" as const,
    brandIds: ["550e8400-e29b-41d4-a716-446655440001"],
    wantsToVolunteer: true,
  };

  it("accepts a complete application", () => {
    expect(submitSellerApplicationSchema.parse(valid)).toEqual(valid);
  });

  it("rejects when social consent is false", () => {
    expect(() =>
      submitSellerApplicationSchema.parse({ ...valid, socialMediaConsent: false })
    ).toThrow();
  });

  it("requires at least four photos", () => {
    expect(() =>
      submitSellerApplicationSchema.parse({
        ...valid,
        stylePhotoUrls: valid.stylePhotoUrls.slice(0, 3),
      })
    ).toThrow();
  });
});
