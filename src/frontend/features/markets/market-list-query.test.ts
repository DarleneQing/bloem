import { describe, expect, it } from "vitest";
import { marketListQuerySchema, registerMarketSchema } from "./validations";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("marketListQuerySchema", () => {
  it("accepts an empty object", () => {
    expect(marketListQuerySchema.safeParse({}).success).toBe(true);
  });

  it.each(["ACTIVE", "all"])("accepts status=%s", (status) => {
    expect(marketListQuerySchema.safeParse({ status }).success).toBe(true);
  });

  it("rejects status=COMPLETED (no longer exposed by user-visible API)", () => {
    expect(marketListQuerySchema.safeParse({ status: "COMPLETED" }).success).toBe(
      false
    );
  });

  it("rejects search longer than 200 chars", () => {
    expect(
      marketListQuerySchema.safeParse({ search: "x".repeat(201) }).success
    ).toBe(false);
  });

  it("rejects non-positive page", () => {
    expect(marketListQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(marketListQuerySchema.safeParse({ page: -1 }).success).toBe(false);
  });

  it("rejects limit > 50", () => {
    expect(marketListQuerySchema.safeParse({ limit: 51 }).success).toBe(false);
  });

  it("rejects unknown sortBy and sortOrder", () => {
    expect(marketListQuerySchema.safeParse({ sortBy: "name" }).success).toBe(
      false
    );
    expect(
      marketListQuerySchema.safeParse({ sortOrder: "random" }).success
    ).toBe(false);
  });

  it("accepts both sort orders", () => {
    expect(marketListQuerySchema.safeParse({ sortOrder: "asc" }).success).toBe(
      true
    );
    expect(marketListQuerySchema.safeParse({ sortOrder: "desc" }).success).toBe(
      true
    );
  });
});

describe("registerMarketSchema", () => {
  it("accepts a UUID", () => {
    expect(registerMarketSchema.safeParse({ marketId: UUID }).success).toBe(true);
  });
  it("rejects non-UUID", () => {
    expect(registerMarketSchema.safeParse({ marketId: "abc" }).success).toBe(
      false
    );
  });
  it("rejects missing marketId", () => {
    expect(registerMarketSchema.safeParse({}).success).toBe(false);
  });
});
