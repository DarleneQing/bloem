import { describe, expect, it } from "vitest";
import {
  DISCOVER_LINKS,
  COMPANY_LINKS,
  LEGAL_LINKS,
} from "./navigation-links";

const groups = { DISCOVER_LINKS, COMPANY_LINKS, LEGAL_LINKS };

describe("navigation link groups", () => {
  it.each(Object.entries(groups))("%s has at least one entry", (_name, list) => {
    expect(list.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(groups))("%s — every entry has label + href", (_name, list) => {
    for (const entry of list) {
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.href).toBe("string");
      expect(entry.href.length).toBeGreaterThan(0);
    }
  });

  it("DISCOVER_LINKS includes the markets link", () => {
    expect(DISCOVER_LINKS.some((l) => l.href === "/markets")).toBe(true);
  });

  it("COMPANY_LINKS includes About Us and Contact", () => {
    expect(COMPANY_LINKS.find((l) => l.label === "About Us")?.href).toBe("/about");
    expect(COMPANY_LINKS.some((l) => l.label === "Contact")).toBe(true);
  });

  it("LEGAL_LINKS has Privacy, Terms, Cookies", () => {
    const labels = LEGAL_LINKS.map((l) => l.label);
    expect(labels).toContain("Privacy Policy");
    expect(labels).toContain("Terms of Service");
    expect(labels).toContain("Cookies");
  });

  it("anchor links start with '#' and routes start with '/'", () => {
    for (const list of Object.values(groups)) {
      for (const entry of list) {
        expect(
          entry.href.startsWith("#") ||
            entry.href.startsWith("/") ||
            entry.href.startsWith("http") ||
            entry.href.startsWith("mailto:")
        ).toBe(true);
      }
    }
  });
});
