"use server";

import { resend } from "@/lib/email/resend";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Send a contact form email
 */
export async function sendContactEmail(data: ContactFormInput) {
  try {
    // Validate input
    const validatedData = contactFormSchema.parse(data);

    // Send email using Resend
    const result = await resend.emails.send({
      from: 'Bloem Contact Form <onboarding@resend.dev>', // Replace with your verified domain
      to: ['ophlia.cn@gmail.com'], // Your receiving email
      replyTo: validatedData.email,
      subject: `Contact Form: ${validatedData.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1a1a1a;
                background: #fafafa;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              }
              .header {
                background: #6B22B1;
                padding: 40px 30px;
                text-align: center;
              }
              .logo-text {
                font-size: 32px;
                font-weight: 900;
                color: white;
                letter-spacing: -0.5px;
                margin-bottom: 8px;
              }
              .tagline {
                color: #BED35C;
                font-size: 14px;
                font-weight: 600;
                letter-spacing: 0.5px;
                text-transform: lowercase;
              }
              .badge {
                display: inline-block;
                background: rgba(190, 211, 92, 0.2);
                color: #BED35C;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-top: 16px;
                letter-spacing: 0.3px;
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 18px;
                color: #6B22B1;
                font-weight: 700;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 2px solid #F7F4F2;
              }
              .field-group {
                margin-bottom: 24px;
              }
              .field-label {
                font-size: 12px;
                font-weight: 700;
                color: #B79CED;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                display: block;
              }
              .field-value {
                background: #F7F4F2;
                padding: 14px 18px;
                border-radius: 10px;
                font-size: 15px;
                color: #1a1a1a;
                border-left: 4px solid #B79CED;
              }
              .field-value a {
                color: #6B22B1;
                text-decoration: none;
                font-weight: 600;
              }
              .field-value a:hover {
                text-decoration: underline;
              }
              .message-container {
                background: linear-gradient(135deg, #F7F4F2 0%, #ffffff 100%);
                padding: 24px;
                border-radius: 12px;
                border: 2px solid #F7F4F2;
                border-left: 6px solid #BED35C;
                margin-top: 8px;
              }
              .message-label {
                font-size: 12px;
                font-weight: 700;
                color: #6B22B1;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 12px;
                display: block;
              }
              .message-text {
                color: #333;
                font-size: 15px;
                line-height: 1.7;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .divider {
                height: 2px;
                background: linear-gradient(90deg, #B79CED 0%, #BED35C 100%);
                margin: 32px 0;
                border-radius: 2px;
              }
              .action-box {
                background: #F7F4F2;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
              }
              .action-text {
                color: #666;
                font-size: 14px;
                margin-bottom: 12px;
              }
              .reply-button {
                display: inline-block;
                background: #6B22B1;
                color: white;
                padding: 12px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                transition: background 0.2s;
              }
              .footer {
                background: #F7F4F2;
                padding: 30px;
                text-align: center;
              }
              .footer-text {
                color: #666;
                font-size: 13px;
                line-height: 1.8;
              }
              .footer-brand {
                color: #6B22B1;
                font-weight: 700;
              }
              .footer-accent {
                color: #BED35C;
                font-weight: 600;
              }
              @media only screen and (max-width: 600px) {
                body {
                  padding: 10px;
                }
                .content {
                  padding: 30px 20px;
                }
                .header {
                  padding: 30px 20px;
                }
              }
              
              /* Dark Mode Support */
              @media (prefers-color-scheme: dark) {
                body {
                  background: #1a1a1a !important;
                }
                .container {
                  background: #2d2d2d !important;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
                }
                .header {
                  background: #5a1a8f !important;
                }
                .tagline {
                  color: #d4e87c !important;
                }
                .badge {
                  background: rgba(212, 232, 124, 0.2) !important;
                  color: #d4e87c !important;
                }
                .content {
                  background: #2d2d2d !important;
                }
                .greeting {
                  color: #B79CED !important;
                  border-bottom: 2px solid #3a3a3a !important;
                }
                .field-label {
                  color: #c9ade8 !important;
                }
                .field-value {
                  background: #3a3a3a !important;
                  color: #e0e0e0 !important;
                  border-left: 4px solid #9d6dc9 !important;
                }
                .field-value a {
                  color: #c9ade8 !important;
                }
                .message-container {
                  background: linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 100%) !important;
                  border: 2px solid #3a3a3a !important;
                  border-left: 6px solid #b8c95a !important;
                }
                .message-label {
                  color: #c9ade8 !important;
                }
                .message-text {
                  color: #d0d0d0 !important;
                }
                .divider {
                  background: linear-gradient(90deg, #9d6dc9 0%, #b8c95a 100%) !important;
                }
                .action-box {
                  background: #3a3a3a !important;
                }
                .action-text {
                  color: #b0b0b0 !important;
                }
                .footer {
                  background: #242424 !important;
                }
                .footer-text {
                  color: #999 !important;
                }
                .footer-brand {
                  color: #c9ade8 !important;
                }
                .footer-accent {
                  color: #d4e87c !important;
                }
              }
              
              /* Force light mode colors in dark mode for better compatibility */
              [data-ogsc] body,
              [data-ogsb] body {
                background: #fafafa !important;
              }
              [data-ogsc] .container,
              [data-ogsb] .container {
                background: white !important;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- Header -->
              <div class="header">
                <div class="logo-text">bloem</div>
                <div class="tagline">circular fashion. digital. easy.</div>
                <div class="badge">✉️ New Message</div>
              </div>

              <!-- Content -->
              <div class="content">
                <div class="greeting">
                  You have a new message from your contact form!
                </div>

                <!-- From Field -->
                <div class="field-group">
                  <span class="field-label">👤 From</span>
                  <div class="field-value">
                    ${validatedData.firstName} ${validatedData.lastName}
                  </div>
                </div>

                <!-- Email Field -->
                <div class="field-group">
                  <span class="field-label">📧 Email Address</span>
                  <div class="field-value">
                    <a href="mailto:${validatedData.email}">
                      ${validatedData.email}
                    </a>
                  </div>
                </div>

                <!-- Subject Field -->
                <div class="field-group">
                  <span class="field-label">💬 Subject</span>
                  <div class="field-value">
                    ${validatedData.subject}
                  </div>
                </div>

                <!-- Message -->
                <div class="field-group">
                  <div class="message-container">
                    <span class="message-label">📝 Message</span>
                    <div class="message-text">${validatedData.message}</div>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Action Box -->
                <div class="action-box">
                  <p class="action-text">
                    💬 To respond, simply hit <strong>Reply</strong> in your email client
                  </p>
                  <p class="action-text" style="margin-top: 8px; font-size: 13px;">
                    Your reply will go directly to: <strong style="color: #6B22B1;">${validatedData.email}</strong>
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p class="footer-text">
                  This message was sent from the <span class="footer-brand">bloem</span> contact form<br>
                  <span class="footer-accent">together we bloem</span> • Building circular fashion communities
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
New Contact Form Submission from Bloem

From: ${validatedData.firstName} ${validatedData.lastName}
Email: ${validatedData.email}
Subject: ${validatedData.subject}

Message:
${validatedData.message}

---
This email was sent from the Bloem contact form.
Reply directly to this email to respond to ${validatedData.firstName}.
      `.trim(),
    });

    if (result.error) {
      console.error("Error sending email:", result.error);
      return {
        success: false,
        error: "Failed to send message. Please try again later.",
      };
    }

    return {
      success: true,
      message: "Your message has been sent successfully!",
    };
  } catch (error) {
    console.error("Error in sendContactEmail:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
}

