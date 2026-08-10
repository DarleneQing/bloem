import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockExchangeCodeForSession } = vi.hoisted(() => ({
  mockExchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  }),
}));

import { GET } from "./route";

function callbackRequest(query: string) {
  return new Request(`http://localhost/auth/callback${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /auth/callback — next redirect validation", () => {
  it("redirects to a valid path-relative next param", async () => {
    const res = await GET(callbackRequest("?next=%2Fwardrobe"));
    expect(res.headers.get("location")).toBe("http://localhost/wardrobe");
  });

  it("falls back to /profile when next is missing", async () => {
    const res = await GET(callbackRequest(""));
    expect(res.headers.get("location")).toBe("http://localhost/profile");
  });

  it("blocks protocol-relative open-redirect targets", async () => {
    const res = await GET(callbackRequest("?next=%2F%2Fevil.com"));
    expect(res.headers.get("location")).toBe("http://localhost/profile");
  });

  it("blocks backslash open-redirect targets", async () => {
    const res = await GET(callbackRequest("?next=%2F%5Cevil.com"));
    expect(res.headers.get("location")).toBe("http://localhost/profile");
  });

  it("blocks absolute-URL next targets", async () => {
    const res = await GET(
      callbackRequest("?next=https%3A%2F%2Fevil.com%2Fphish")
    );
    expect(res.headers.get("location")).toBe("http://localhost/profile");
  });

  it("exchanges the code and still applies next validation", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const res = await GET(callbackRequest("?code=abc123&next=%2Fprofile"));
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(res.headers.get("location")).toBe("http://localhost/profile");
  });

  it("redirects to sign-in with the error message when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid code" },
    });
    const res = await GET(callbackRequest("?code=bad&next=%2Fwardrobe"));
    expect(res.headers.get("location")).toBe(
      "http://localhost/auth/sign-in?error=invalid%20code"
    );
  });
});
