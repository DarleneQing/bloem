import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend, mockCheckRateLimit, mockHeadersGet } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockHeadersGet: vi.fn(),
}));

vi.mock("@/lib/email/resend", () => ({
  resend: { emails: { send: mockSend } },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: mockHeadersGet }),
}));

import { sendContactEmail } from "./actions";

const VALID_INPUT = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  subject: "Question about hangers",
  message: "This message is long enough to pass validation.",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockResolvedValue({ success: true, disabled: true });
  mockHeadersGet.mockReturnValue(null);
  mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
});

describe("sendContactEmail", () => {
  it("sends successfully on the happy path", async () => {
    const result = await sendContactEmail(VALID_INPUT);
    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("escapes HTML-significant characters before interpolating into the email body", async () => {
    await sendContactEmail({
      ...VALID_INPUT,
      firstName: "<img src=x onerror=alert(1)>",
      message: "Hello & <script>alert('xss')</script> \"quoted\"",
    });

    const html = mockSend.mock.calls[0][0].html as string;
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;quoted&quot;");
  });

  it("keeps the plain-text body and Resend envelope fields unescaped", async () => {
    await sendContactEmail({
      ...VALID_INPUT,
      email: "ada@example.com",
      subject: "A & B",
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.replyTo).toBe("ada@example.com");
    expect(call.subject).toBe("Contact Form: A & B");
    expect(call.text).toContain("A & B");
  });

  it("returns an error without sending when rate-limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      disabled: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 1000,
    });

    const result = await sendContactEmail(VALID_INPUT);
    expect(result).toEqual({
      success: false,
      error: "Too many messages sent. Please try again later.",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("keys the rate limit on the caller's IP from x-forwarded-for", async () => {
    mockHeadersGet.mockImplementation((name: string) =>
      name === "x-forwarded-for" ? "203.0.113.5, 10.0.0.1" : null
    );

    await sendContactEmail(VALID_INPUT);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "contact_form",
      "203.0.113.5"
    );
  });

  it("returns a validation error for invalid input without sending", async () => {
    const result = await sendContactEmail({
      ...VALID_INPUT,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
