import { describe, expect, it } from "vitest";
import { SOCIAL_LINKS } from "./social-links";

describe("SOCIAL_LINKS", () => {
  it("exposes instagram / linkedin / email", () => {
    expect(SOCIAL_LINKS).toHaveProperty("instagram");
    expect(SOCIAL_LINKS).toHaveProperty("linkedin");
    expect(SOCIAL_LINKS).toHaveProperty("email");
  });

  it("Instagram link points to letsbloem on instagram.com", () => {
    expect(SOCIAL_LINKS.instagram).toMatch(/^https:\/\/(www\.)?instagram\.com\//);
    expect(SOCIAL_LINKS.instagram).toMatch(/letsbloem/i);
  });

  it("LinkedIn link is to /company/bloemcircularfashion", () => {
    expect(SOCIAL_LINKS.linkedin).toMatch(/^https:\/\/(www\.)?linkedin\.com\/company\//);
    expect(SOCIAL_LINKS.linkedin).toContain("bloemcircularfashion");
  });

  it("Email link uses mailto: protocol and the @letsbloem.com domain", () => {
    expect(SOCIAL_LINKS.email).toMatch(/^mailto:/);
    expect(SOCIAL_LINKS.email).toContain("@letsbloem.com");
  });
});
