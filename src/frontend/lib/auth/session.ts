import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { User, Session } from "@supabase/supabase-js";
import type { ProfileWithStatus } from "./utils";

// ============================================================================
// SESSION MANAGEMENT UTILITIES
// ============================================================================

/**
 * Get current session (client-side)
 */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error("Error getting current session:", error);
    return null;
  }
  
  return session;
}

/**
 * Get current session (server-side)
 */
export async function getCurrentSessionServer(): Promise<Session | null> {
  const supabase = await createServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error("Error getting current session:", error);
    return null;
  }
  
  return session;
}

/**
 * Check if session is valid and not expired
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at ? session.expires_at > now : true;
}

/**
 * Get session expiration time
 */
export function getSessionExpiration(session: Session | null): Date | null {
  if (!session?.expires_at) return null;
  return new Date(session.expires_at * 1000);
}

/**
 * Get time until session expires (in seconds)
 */
export function getTimeUntilExpiration(session: Session | null): number | null {
  if (!session?.expires_at) return null;
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, session.expires_at - now);
}

/**
 * Check if session is about to expire (within 5 minutes)
 */
export function isSessionExpiringSoon(session: Session | null): boolean {
  const timeUntilExpiration = getTimeUntilExpiration(session);
  return timeUntilExpiration !== null && timeUntilExpiration < 300; // 5 minutes
}

// ============================================================================
// SESSION REFRESH UTILITIES
// ============================================================================

/**
 * Refresh current session (client-side)
 */
export async function refreshSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error("Error refreshing session:", error);
    return null;
  }
  
  return session;
}

/**
 * Refresh current session (server-side)
 */
export async function refreshSessionServer(): Promise<Session | null> {
  const supabase = await createServerClient();
  const { data: { session }, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error("Error refreshing session:", error);
    return null;
  }
  
  return session;
}

/**
 * Auto-refresh session if needed
 */
export async function autoRefreshSession(): Promise<Session | null> {
  const session = await getCurrentSession();
  
  if (!session) return null;
  
  // Refresh if session is expiring soon
  if (isSessionExpiringSoon(session)) {
    return await refreshSession();
  }
  
  return session;
}

// ============================================================================
// SESSION STORAGE UTILITIES
// ============================================================================

/**
 * Store session data in localStorage (client-side only)
 */
export function storeSessionData(key: string, data: any): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(`session_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error("Error storing session data:", error);
  }
}

/**
 * Retrieve session data from localStorage (client-side only)
 */
export function getSessionData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  
  try {
    const data = localStorage.getItem(`session_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error retrieving session data:", error);
    return null;
  }
}

/**
 * Remove session data from localStorage (client-side only)
 */
export function removeSessionData(key: string): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(`session_${key}`);
  } catch (error) {
    console.error("Error removing session data:", error);
  }
}

/**
 * Clear all session data from localStorage (client-side only)
 */
export function clearAllSessionData(): void {
  if (typeof window === "undefined") return;
  
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith("session_"));
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing session data:", error);
  }
}

// ============================================================================
// SESSION MONITORING UTILITIES
// ============================================================================

/**
 * Session state change handler type
 */
export type SessionStateChangeHandler = (session: Session | null) => void;

/**
 * Session monitoring class for client-side session management
 */
export class SessionMonitor {
  private handlers: Set<SessionStateChangeHandler> = new Set();
  private supabase = createClient();
  private isMonitoring = false;

  /**
   * Start monitoring session changes
   */
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.notifyHandlers(session);
    });
  }

  /**
   * Stop monitoring session changes
   */
  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.handlers.clear();
  }

  /**
   * Add session state change handler
   */
  addHandler(handler: SessionStateChangeHandler): () => void {
    this.handlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Notify all handlers of session change
   */
  private notifyHandlers(session: Session | null): void {
    this.handlers.forEach(handler => {
      try {
        handler(session);
      } catch (error) {
        console.error("Error in session change handler:", error);
      }
    });
  }
}

/**
 * Global session monitor instance
 */
export const sessionMonitor = new SessionMonitor();

// ============================================================================
// SESSION VALIDATION UTILITIES
// ============================================================================

/**
 * Validate session and user data
 */
export async function validateSession(): Promise<SessionValidationResult> {
  const session = await getCurrentSession();
  
  if (!session) {
    return {
      isValid: false,
      error: "No active session",
      shouldRefresh: false,
    };
  }
  
  if (!isSessionValid(session)) {
    return {
      isValid: false,
      error: "Session expired",
      shouldRefresh: true,
    };
  }
  
  if (!session.user) {
    return {
      isValid: false,
      error: "No user in session",
      shouldRefresh: false,
    };
  }
  
  return {
    isValid: true,
    session,
    user: session.user,
  };
}

/**
 * Validate session and user data (server-side)
 */
export async function validateSessionServer(): Promise<SessionValidationResult> {
  const session = await getCurrentSessionServer();
  
  if (!session) {
    return {
      isValid: false,
      error: "No active session",
      shouldRefresh: false,
    };
  }
  
  if (!isSessionValid(session)) {
    return {
      isValid: false,
      error: "Session expired",
      shouldRefresh: true,
    };
  }
  
  if (!session.user) {
    return {
      isValid: false,
      error: "No user in session",
      shouldRefresh: false,
    };
  }
  
  return {
    isValid: true,
    session,
    user: session.user,
  };
}

// ============================================================================
// SESSION PERSISTENCE UTILITIES
// ============================================================================

/**
 * Persist session data for offline access
 */
export async function persistSessionData(): Promise<void> {
  const session = await getCurrentSession();
  if (!session) return;
  
  // Store essential session data
  storeSessionData("user_id", session.user.id);
  storeSessionData("access_token", session.access_token);
  storeSessionData("expires_at", session.expires_at);
  
  // Store user profile data
  const profile = await getUserProfileFromSession(session);
  if (profile) {
    storeSessionData("profile", profile);
  }
}

/**
 * Restore session data from storage
 */
export function restoreSessionData(): Partial<Session> | null {
  const userId = getSessionData<string>("user_id");
  const accessToken = getSessionData<string>("access_token");
  const expiresAt = getSessionData<number>("expires_at");
  
  if (!userId || !accessToken) return null;
  
  return {
    user: { id: userId } as User,
    access_token: accessToken,
    expires_at: expiresAt || undefined,
  };
}

/**
 * Get user profile from session data
 */
export async function getUserProfileFromSession(session: Session): Promise<ProfileWithStatus | null> {
  // Try to get from stored data first
  const storedProfile = getSessionData<ProfileWithStatus>("profile");
  if (storedProfile) return storedProfile;
  
  // Fallback to API call
  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  
  if (error) {
    console.error("Error getting user profile from session:", error);
    return null;
  }
  
  return {
    ...profile,
    isActiveSeller: !!profile.iban_verified_at,
  };
}

// ============================================================================
// SESSION CLEANUP UTILITIES
// ============================================================================

/**
 * Clean up expired session data
 */
export function cleanupExpiredSessionData(): void {
  if (typeof window === "undefined") return;
  
  const expiresAt = getSessionData<number>("expires_at");
  if (expiresAt && expiresAt < Math.floor(Date.now() / 1000)) {
    clearAllSessionData();
  }
}

/**
 * Clean up session data on sign out
 */
export function cleanupSessionData(): void {
  clearAllSessionData();
}

// ============================================================================
// SESSION ANALYTICS UTILITIES
// ============================================================================

/**
 * Track session events for analytics
 */
export function trackSessionEvent(event: string, data?: any): void {
  if (typeof window === "undefined") return;
  
  try {
    // This would integrate with your analytics service
    console.log(`Session event: ${event}`, data);
    
    // Example: Google Analytics
    // gtag('event', event, data);
    
    // Example: Custom analytics
    // analytics.track(event, data);
  } catch (error) {
    console.error("Error tracking session event:", error);
  }
}

/**
 * Track session duration
 */
export function trackSessionDuration(): void {
  const sessionStart = getSessionData<number>("session_start");
  if (sessionStart) {
    const duration = Math.floor(Date.now() / 1000) - sessionStart;
    trackSessionEvent("session_duration", { duration });
  }
}

/**
 * Start session duration tracking
 */
export function startSessionTracking(): void {
  storeSessionData("session_start", Math.floor(Date.now() / 1000));
}

// ============================================================================
// TYPES
// ============================================================================

export interface SessionValidationResult {
  isValid: boolean;
  session?: Session;
  user?: User;
  error?: string;
  shouldRefresh?: boolean;
}

export interface SessionData {
  user: User;
  profile?: ProfileWithStatus;
  expiresAt: number;
  lastActivity: number;
}

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  duration: number;
  pageViews: number;
  events: SessionEvent[];
}

export interface SessionEvent {
  type: string;
  timestamp: number;
  data?: any;
}
