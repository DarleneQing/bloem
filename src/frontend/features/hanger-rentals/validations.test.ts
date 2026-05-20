import { describe, expect, it } from "vitest";
import {
  createHangerRentalSchema,
  updateHangerRentalSchema,
  hangerRentalIdSchema,
} from "./validations";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("createHangerRentalSchema", () => {
  it("accepts a valid 5-hanger rental", () => {
    expect(
      createHangerRentalSchema.safeParse({ marketId: UUID, hangerCount: 5 })
        .success
    ).toBe(true);
  });

  it("accepts boundary hangerCount 1 and 100", () => {
    expect(
      createHangerRentalSchema.safeParse({ marketId: UUID, hangerCount: 1 })
        .success
    ).toBe(true);
    expect(
      createHangerRentalSchema.safeParse({ marketId: UUID, hangerCount: 100 })
        .success
    ).toBe(true);
  });

  it("rejects 0 and over-100", () => {
    expect(
      createHangerRentalSchema.safeParse({ marketId: UUID, hangerCount: 0 })
        .success
    ).toBe(false);
    expect(
      createHangerRentalSchema.safeParse({ marketId: UUID, hangerCount: 101 })
        .success
    ).toBe(false);
  });

  it("rejects non-integer count", () => {
    expect(
      createHangerRentalSchema.safeParse({ marketId: UUID, hangerCount: 2.5 })
        .success
    ).toBe(false);
  });

  it("rejects non-UUID marketId", () => {
    expect(
      createHangerRentalSchema.safeParse({ marketId: "abc", hangerCount: 5 })
        .success
    ).toBe(false);
  });
});

describe("updateHangerRentalSchema", () => {
  it("requires both id and hangerCount", () => {
    expect(updateHangerRentalSchema.safeParse({}).success).toBe(false);
    expect(updateHangerRentalSchema.safeParse({ id: UUID }).success).toBe(false);
    expect(
      updateHangerRentalSchema.safeParse({ id: UUID, hangerCount: 10 }).success
    ).toBe(true);
  });
});

describe("hangerRentalIdSchema", () => {
  it("accepts a UUID", () => {
    expect(hangerRentalIdSchema.safeParse({ id: UUID }).success).toBe(true);
  });
  it("rejects non-UUID", () => {
    expect(hangerRentalIdSchema.safeParse({ id: "abc" }).success).toBe(false);
  });
});
