import { createClient } from "@/lib/supabase/client";

export interface PaymentInitResult {
  success: boolean;
  paymentIntent?: unknown;
  clientSecret?: string;
  error?: string;
}

/**
 * Start checkout payment via Supabase Edge Function (browser client only).
 */
export async function initializePayment(
  amount: number,
  currency: string = "CHF",
  metadata?: Record<string, unknown>
): Promise<PaymentInitResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.functions.invoke("process-payment", {
      body: {
        amount: Math.round(amount * 100),
        currency,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error("Payment initialization error:", error);
      return {
        success: false,
        error: error.message || "Payment initialization failed",
      };
    }

    return {
      success: true,
      paymentIntent: data.payment_intent,
      clientSecret: data.client_secret,
    };
  } catch (error) {
    console.error("Payment initialization error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Payment initialization failed",
    };
  }
}
