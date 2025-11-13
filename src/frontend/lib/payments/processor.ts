import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

// ============================================================================
// PAYMENT PROCESSING UTILITIES
// ============================================================================

/**
 * Initialize payment processing (client-side)
 */
export async function initializePayment(
  amount: number,
  currency: string = "CHF",
  metadata?: Record<string, any>
): Promise<PaymentInitResult> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.functions.invoke("process-payment", {
      body: {
        amount: Math.round(amount * 100), // Convert to cents
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
      error: error instanceof Error ? error.message : "Payment initialization failed",
    };
  }
}

/**
 * Confirm payment (client-side)
 */
export async function confirmPayment(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<PaymentConfirmResult> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.functions.invoke("confirm-payment", {
      body: {
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId,
      },
    });
    
    if (error) {
      console.error("Payment confirmation error:", error);
      return {
        success: false,
        error: error.message || "Payment confirmation failed",
      };
    }
    
    return {
      success: true,
      paymentIntent: data.payment_intent,
      transaction: data.transaction,
    };
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment confirmation failed",
    };
  }
}

/**
 * Process refund (server-side)
 */
export async function processRefund(
  transactionId: string,
  amount?: number,
  reason?: string
): Promise<RefundResult> {
  const supabase = await createServerClient();
  
  try {
    const { data, error } = await supabase.functions.invoke("process-refund", {
      body: {
        transaction_id: transactionId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason || "Refund requested",
      },
    });
    
    if (error) {
      console.error("Refund processing error:", error);
      return {
        success: false,
        error: error.message || "Refund processing failed",
      };
    }
    
    return {
      success: true,
      refund: data.refund,
      transaction: data.transaction,
    };
  } catch (error) {
    console.error("Refund processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Refund processing failed",
    };
  }
}

// ============================================================================
// PAYOUT PROCESSING UTILITIES
// ============================================================================

/**
 * Request payout to seller (server-side)
 */
export async function requestPayout(
  sellerId: string,
  amount: number,
  iban: string,
  description?: string
): Promise<PayoutResult> {
  const supabase = await createServerClient();
  
  try {
    const { data, error } = await supabase.functions.invoke("request-payout", {
      body: {
        seller_id: sellerId,
        amount: Math.round(amount * 100), // Convert to cents
        iban,
        description: description || "Seller payout",
      },
    });
    
    if (error) {
      console.error("Payout request error:", error);
      return {
        success: false,
        error: error.message || "Payout request failed",
      };
    }
    
    return {
      success: true,
      payout: data.payout,
    };
  } catch (error) {
    console.error("Payout request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payout request failed",
    };
  }
}

/**
 * Process payout batch (server-side)
 */
export async function processPayoutBatch(
  payoutIds: string[]
): Promise<PayoutBatchResult> {
  const supabase = await createServerClient();
  
  try {
    const { data, error } = await supabase.functions.invoke("process-payout-batch", {
      body: {
        payout_ids: payoutIds,
      },
    });
    
    if (error) {
      console.error("Payout batch processing error:", error);
      return {
        success: false,
        error: error.message || "Payout batch processing failed",
      };
    }
    
    return {
      success: true,
      payouts: data.payouts,
      batch_id: data.batch_id,
    };
  } catch (error) {
    console.error("Payout batch processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payout batch processing failed",
    };
  }
}

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

/**
 * Create transaction record
 */
export async function createTransaction(
  transactionData: CreateTransactionData
): Promise<TransactionResult> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        buyer_id: transactionData.buyerId,
        seller_id: transactionData.sellerId,
        item_id: transactionData.itemId,
        amount: Math.round(transactionData.amount * 100),
        currency: transactionData.currency || "CHF",
        payment_intent_id: transactionData.paymentIntentId,
        status: "PENDING",
        metadata: transactionData.metadata,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Transaction creation error:", error);
      return {
        success: false,
        error: error.message || "Transaction creation failed",
      };
    }
    
    return {
      success: true,
      transaction: data,
    };
  } catch (error) {
    console.error("Transaction creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transaction creation failed",
    };
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  metadata?: Record<string, any>
): Promise<TransactionResult> {
  const supabase = createClient();
  
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    
    if (metadata) {
      updateData.metadata = metadata;
    }
    
    if (status === "COMPLETED") {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transactionId)
      .select()
      .single();
    
    if (error) {
      console.error("Transaction update error:", error);
      return {
        success: false,
        error: error.message || "Transaction update failed",
      };
    }
    
    return {
      success: true,
      transaction: data,
    };
  } catch (error) {
    console.error("Transaction update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transaction update failed",
    };
  }
}

/**
 * Get transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        items (
          id,
          title,
          image_urls,
          thumbnail_url
        ),
        profiles!transactions_buyer_id_fkey (
          first_name,
          last_name
        ),
        profiles!transactions_seller_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq("id", transactionId)
      .single();
    
    if (error) {
      console.error("Transaction fetch error:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Transaction fetch error:", error);
    return null;
  }
}

// ============================================================================
// PAYMENT VALIDATION UTILITIES
// ============================================================================

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number): PaymentValidation {
  const errors: string[] = [];
  
  if (amount <= 0) {
    errors.push("Amount must be greater than 0");
  }
  
  if (amount < 0.01) {
    errors.push("Minimum amount is CHF 0.01");
  }
  
  if (amount > 10000) {
    errors.push("Maximum amount is CHF 10,000");
  }
  
  if (!Number.isFinite(amount)) {
    errors.push("Amount must be a valid number");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate IBAN format
 */
export function validateIBAN(iban: string): PaymentValidation {
  const errors: string[] = [];
  
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();
  
  // Basic IBAN format validation
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/.test(cleanIban)) {
    errors.push("Invalid IBAN format");
  }
  
  // Length validation
  if (cleanIban.length < 15 || cleanIban.length > 34) {
    errors.push("IBAN must be between 15 and 34 characters");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount: number, feePercentage: number = 5): number {
  return Math.round(amount * (feePercentage / 100) * 100) / 100;
}

/**
 * Calculate seller payout amount
 */
export function calculateSellerPayout(amount: number, feePercentage: number = 5): number {
  const fee = calculatePlatformFee(amount, feePercentage);
  return Math.round((amount - fee) * 100) / 100;
}

// ============================================================================
// PAYMENT WEBHOOK UTILITIES
// ============================================================================

/**
 * Verify webhook signature (Stripe)
 */
export function verifyWebhookSignature(
  _payload: string,
  _signature: string,
  _secret: string
): boolean {
  // This would implement proper Stripe webhook signature verification
  // Stripe uses HMAC-SHA256 with timestamp and payload
  // For now, return true (implement based on Stripe webhook verification)
  return true;
}

/**
 * Process payment webhook (Stripe events)
 */
export async function processPaymentWebhook(
  eventType: string,
  eventData: any
): Promise<WebhookResult> {
  try {
    switch (eventType) {
      case "payment_intent.succeeded":
        return await handlePaymentSuccess(eventData);
      case "payment_intent.payment_failed":
        return await handlePaymentFailure(eventData);
      case "payout.paid":
        return await handlePayoutSuccess(eventData);
      case "payout.failed":
        return await handlePayoutFailure(eventData);
      default:
        return {
          success: true,
          message: "Event type not handled",
        };
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Webhook processing failed",
    };
  }
}

/**
 * Handle payment success webhook (Stripe payment_intent.succeeded)
 */
async function handlePaymentSuccess(eventData: any): Promise<WebhookResult> {
  const paymentIntentId = eventData.id;
  
  // Update transaction status
  const result = await updateTransactionStatus(
    paymentIntentId,
    "COMPLETED",
    { webhook_data: eventData }
  );
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }
  
  // Update item status to sold
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("items")
    .update({
      status: "SOLD",
      sold_at: new Date().toISOString(),
    })
    .eq("id", result.transaction?.item_id);
  
  if (error) {
    console.error("Error updating item status:", error);
  }
  
  return {
    success: true,
    message: "Payment processed successfully",
  };
}

/**
 * Handle payment failure webhook (Stripe payment_intent.payment_failed)
 */
async function handlePaymentFailure(eventData: any): Promise<WebhookResult> {
  const paymentIntentId = eventData.id;
  
  const result = await updateTransactionStatus(
    paymentIntentId,
    "FAILED",
    { webhook_data: eventData }
  );
  
  return {
    success: result.success,
    error: result.error,
    message: "Payment failure processed",
  };
}

/**
 * Handle payout success webhook (Stripe payout.paid)
 */
async function handlePayoutSuccess(eventData: any): Promise<WebhookResult> {
  // Update payout status in database
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("payouts")
    .update({
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
      webhook_data: eventData,
    })
    .eq("payout_id", eventData.id);
  
  if (error) {
    console.error("Error updating payout status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
  
  return {
    success: true,
    message: "Payout success processed",
  };
}

/**
 * Handle payout failure webhook (Stripe payout.failed)
 */
async function handlePayoutFailure(eventData: any): Promise<WebhookResult> {
  // Update payout status in database
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("payouts")
    .update({
      status: "FAILED",
      failed_at: new Date().toISOString(),
      webhook_data: eventData,
    })
    .eq("payout_id", eventData.id);
  
  if (error) {
    console.error("Error updating payout status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
  
  return {
    success: true,
    message: "Payout failure processed",
  };
}

// ============================================================================
// TYPES
// ============================================================================

export type TransactionStatus = 
  | "PENDING" 
  | "PROCESSING" 
  | "COMPLETED" 
  | "FAILED" 
  | "CANCELLED" 
  | "REFUNDED";

export interface PaymentInitResult {
  success: boolean;
  paymentIntent?: any;
  clientSecret?: string;
  error?: string;
}

export interface PaymentConfirmResult {
  success: boolean;
  paymentIntent?: any;
  transaction?: any;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refund?: any;
  transaction?: any;
  error?: string;
}

export interface PayoutResult {
  success: boolean;
  payout?: any;
  error?: string;
}

export interface PayoutBatchResult {
  success: boolean;
  payouts?: any[];
  batch_id?: string;
  error?: string;
}

export interface CreateTransactionData {
  buyerId: string;
  sellerId: string;
  itemId: string;
  amount: number;
  currency?: string;
  paymentIntentId?: string;
  metadata?: Record<string, any>;
}

export interface TransactionResult {
  success: boolean;
  transaction?: any;
  error?: string;
}

export interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  item_id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payment_intent_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface PaymentValidation {
  isValid: boolean;
  errors: string[];
}

export interface WebhookResult {
  success: boolean;
  message?: string;
  error?: string;
}
