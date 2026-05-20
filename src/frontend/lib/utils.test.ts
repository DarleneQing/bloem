import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn (className merge)", () => {
  it("joins simple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("drops falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("collapses conflicting tailwind classes (last-wins via tailwind-merge)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("supports clsx object form", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("flattens nested arrays", () => {
    expect(cn(["a", "b"], "c", ["d"])).toBe("a b c d");
  });

  it("returns empty string with no args", () => {
    expect(cn()).toBe("");
  });

  it("preserves order-sensitive but non-conflicting classes", () => {
    expect(cn("flex", "items-center", "gap-2")).toBe("flex items-center gap-2");
  });
});
