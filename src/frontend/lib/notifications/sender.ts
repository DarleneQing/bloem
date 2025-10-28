import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

// ============================================================================
// NOTIFICATION SYSTEM UTILITIES
// ============================================================================

/**
 * Send email notification
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  template: string,
  data: Record<string, any> = {}
): Promise<NotificationResult> {
  const supabase = createClient();
  
  try {
    const { data: result, error } = await supabase.functions.invoke("send-email", {
      body: {
        to,
        subject,
        template,
        data,
      },
    });
    
    if (error) {
      console.error("Email notification error:", error);
      return {
        success: false,
        error: error.message || "Email notification failed",
      };
    }
    
    return {
      success: true,
      messageId: result.message_id,
    };
  } catch (error) {
    console.error("Email notification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Email notification failed",
    };
  }
}

/**
 * Send SMS notification
 */
export async function sendSMSNotification(
  to: string,
  message: string,
  template?: string,
  data: Record<string, any> = {}
): Promise<NotificationResult> {
  const supabase = createClient();
  
  try {
    const { data: result, error } = await supabase.functions.invoke("send-sms", {
      body: {
        to,
        message,
        template,
        data,
      },
    });
    
    if (error) {
      console.error("SMS notification error:", error);
      return {
        success: false,
        error: error.message || "SMS notification failed",
      };
    }
    
    return {
      success: true,
      messageId: result.message_id,
    };
  } catch (error) {
    console.error("SMS notification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMS notification failed",
    };
  }
}

/**
 * Send push notification
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<NotificationResult> {
  const supabase = createClient();
  
  try {
    const { data: result, error } = await supabase.functions.invoke("send-push", {
      body: {
        user_id: userId,
        title,
        body,
        data,
      },
    });
    
    if (error) {
      console.error("Push notification error:", error);
      return {
        success: false,
        error: error.message || "Push notification failed",
      };
    }
    
    return {
      success: true,
      messageId: result.message_id,
    };
  } catch (error) {
    console.error("Push notification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Push notification failed",
    };
  }
}

/**
 * Send in-app notification
 */
export async function sendInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, any> = {}
): Promise<NotificationResult> {
  const supabase = createClient();
  
  try {
    const { data: result, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error("In-app notification error:", error);
      return {
        success: false,
        error: error.message || "In-app notification failed",
      };
    }
    
    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    console.error("In-app notification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "In-app notification failed",
    };
  }
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<NotificationResult> {
  return sendEmailNotification(
    userEmail,
    "Welcome to Bloem!",
    "welcome",
    {
      user_name: userName,
      app_url: process.env.NEXT_PUBLIC_APP_URL,
    }
  );
}

/**
 * Send item sold notification
 */
export async function sendItemSoldNotification(
  sellerId: string,
  itemTitle: string,
  buyerName: string,
  amount: number
): Promise<NotificationResult> {
  // Get seller's email
  const supabase = createClient();
  const { data: seller } = await supabase
    .from("profiles")
    .select("email, first_name")
    .eq("id", sellerId)
    .single();
  
  if (!seller) {
    return {
      success: false,
      error: "Seller not found",
    };
  }
  
  return sendEmailNotification(
    seller.email,
    "Your item has been sold!",
    "item-sold",
    {
      seller_name: seller.first_name,
      item_title: itemTitle,
      buyer_name: buyerName,
      amount: amount,
      app_url: process.env.NEXT_PUBLIC_APP_URL,
    }
  );
}

/**
 * Send payment received notification
 */
export async function sendPaymentReceivedNotification(
  sellerId: string,
  amount: number,
  itemTitle: string
): Promise<NotificationResult> {
  // Send in-app notification
  const inAppResult = await sendInAppNotification(
    sellerId,
    "PAYMENT_RECEIVED",
    "Payment Received",
    `You received €${amount.toFixed(2)} for "${itemTitle}"`,
    {
      amount,
      item_title: itemTitle,
    }
  );
  
  // Send email notification
  const supabase = createClient();
  const { data: seller } = await supabase
    .from("profiles")
    .select("email, first_name")
    .eq("id", sellerId)
    .single();
  
  if (seller) {
    await sendEmailNotification(
      seller.email,
      "Payment Received",
      "payment-received",
      {
        seller_name: seller.first_name,
        amount: amount,
        item_title: itemTitle,
        app_url: process.env.NEXT_PUBLIC_APP_URL,
      }
    );
  }
  
  return inAppResult;
}

/**
 * Send market reminder notification
 */
export async function sendMarketReminderNotification(
  userId: string,
  marketName: string,
  marketDate: string,
  marketLocation: string
): Promise<NotificationResult> {
  return sendInAppNotification(
    userId,
    "MARKET_REMINDER",
    "Market Reminder",
    `Don't forget about ${marketName} on ${marketDate} at ${marketLocation}`,
    {
      market_name: marketName,
      market_date: marketDate,
      market_location: marketLocation,
    }
  );
}

/**
 * Send QR code linked notification
 */
export async function sendQRCodeLinkedNotification(
  sellerId: string,
  itemTitle: string,
  qrCode: string
): Promise<NotificationResult> {
  return sendInAppNotification(
    sellerId,
    "QR_CODE_LINKED",
    "QR Code Linked",
    `QR code linked to "${itemTitle}"`,
    {
      item_title: itemTitle,
      qr_code: qrCode,
    }
  );
}

/**
 * Send payout processed notification
 */
export async function sendPayoutProcessedNotification(
  sellerId: string,
  amount: number,
  payoutDate: string
): Promise<NotificationResult> {
  // Send in-app notification
  const inAppResult = await sendInAppNotification(
    sellerId,
    "PAYOUT_PROCESSED",
    "Payout Processed",
    `Your payout of €${amount.toFixed(2)} has been processed`,
    {
      amount,
      payout_date: payoutDate,
    }
  );
  
  // Send email notification
  const supabase = createClient();
  const { data: seller } = await supabase
    .from("profiles")
    .select("email, first_name")
    .eq("id", sellerId)
    .single();
  
  if (seller) {
    await sendEmailNotification(
      seller.email,
      "Payout Processed",
      "payout-processed",
      {
        seller_name: seller.first_name,
        amount: amount,
        payout_date: payoutDate,
        app_url: process.env.NEXT_PUBLIC_APP_URL,
      }
    );
  }
  
  return inAppResult;
}

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Notification[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);
    
    if (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("read", false);
    
    if (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  const supabase = createClient();
  
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    
    if (error) {
      console.error("Error getting unread notification count:", error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);
    
    if (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(
  userId: string
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error deleting all notifications:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    return false;
  }
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching notification preferences:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return null;
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error("Error updating notification preferences:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return false;
  }
}

// ============================================================================
// NOTIFICATION SCHEDULING
// ============================================================================

/**
 * Schedule notification
 */
export async function scheduleNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  scheduledAt: string,
  data: Record<string, any> = {}
): Promise<NotificationResult> {
  const supabase = createClient();
  
  try {
    const { data: result, error } = await supabase
      .from("scheduled_notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        scheduled_at: scheduledAt,
        status: "SCHEDULED",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error scheduling notification:", error);
      return {
        success: false,
        error: error.message || "Failed to schedule notification",
      };
    }
    
    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule notification",
    };
  }
}

/**
 * Process scheduled notifications
 */
export async function processScheduledNotifications(): Promise<void> {
  const supabase = await createServerClient();
  
  try {
    const now = new Date().toISOString();
    
    // Get notifications that are due
    const { data: scheduledNotifications, error } = await supabase
      .from("scheduled_notifications")
      .select("*")
      .eq("status", "SCHEDULED")
      .lte("scheduled_at", now);
    
    if (error) {
      console.error("Error fetching scheduled notifications:", error);
      return;
    }
    
    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      return;
    }
    
    // Process each notification
    for (const notification of scheduledNotifications) {
      try {
        // Send the notification
        const result = await sendInAppNotification(
          notification.user_id,
          notification.type,
          notification.title,
          notification.message,
          notification.data
        );
        
        // Update status
        await supabase
          .from("scheduled_notifications")
          .update({
            status: result.success ? "SENT" : "FAILED",
            sent_at: result.success ? new Date().toISOString() : null,
            error: result.error || null,
          })
          .eq("id", notification.id);
      } catch (error) {
        console.error("Error processing scheduled notification:", error);
        
        // Mark as failed
        await supabase
          .from("scheduled_notifications")
          .update({
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", notification.id);
      }
    }
  } catch (error) {
    console.error("Error processing scheduled notifications:", error);
  }
}

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType = 
  | "ITEM_SOLD"
  | "PAYMENT_RECEIVED"
  | "MARKET_REMINDER"
  | "QR_CODE_LINKED"
  | "PAYOUT_PROCESSED"
  | "GENERAL"
  | "SYSTEM";

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  item_sold_notifications: boolean;
  payment_notifications: boolean;
  market_reminders: boolean;
  marketing_emails: boolean;
  created_at: string;
  updated_at: string;
}
