import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

// ============================================================================
// AUTHENTICATION UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the current authenticated user (client-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }
  
  return user;
}

/**
 * Get the current authenticated user (server-side)
 */
export async function getCurrentUserServer(): Promise<User | null> {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }
  
  return user;
}

/**
 * Check if user is authenticated (client-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  const user = await getCurrentUserServer();
  return !!user;
}

/**
 * Get user profile with computed properties (client-side)
 */
export async function getUserProfile(userId?: string): Promise<ProfileWithStatus | null> {
  const supabase = createClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return null;
    userId = user.id;
  }
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  
  if (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
  
  return {
    ...profile,
    isActiveSeller: !!profile.iban_verified_at,
  };
}

/**
 * Get user profile with computed properties (server-side)
 */
export async function getUserProfileServer(userId?: string): Promise<ProfileWithStatus | null> {
  const supabase = await createServerClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const user = await getCurrentUserServer();
    if (!user) return null;
    userId = user.id;
  }
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  
  if (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
  
  return {
    ...profile,
    isActiveSeller: !!profile.iban_verified_at,
  };
}

/**
 * Check if user is an active seller (client-side)
 */
export async function isActiveSeller(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.isActiveSeller ?? false;
}

/**
 * Check if user is an active seller (server-side)
 */
export async function isActiveSellerServer(): Promise<boolean> {
  const profile = await getUserProfileServer();
  return profile?.isActiveSeller ?? false;
}

/**
 * Check if user is an admin (client-side)
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "ADMIN";
}

/**
 * Check if user is an admin (server-side)
 */
export async function isAdminServer(): Promise<boolean> {
  const profile = await getUserProfileServer();
  return profile?.role === "ADMIN";
}

/**
 * Check if user has permission to access resource (client-side)
 */
export async function hasPermission(
  resourceOwnerId: string,
  allowAdmin: boolean = true
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admin can access everything if allowed
  if (allowAdmin) {
    const profile = await getUserProfile();
    if (profile?.role === "ADMIN") return true;
  }
  
  // User can only access their own resources
  return user.id === resourceOwnerId;
}

/**
 * Check if user has permission to access resource (server-side)
 */
export async function hasPermissionServer(
  resourceOwnerId: string,
  allowAdmin: boolean = true
): Promise<boolean> {
  const user = await getCurrentUserServer();
  if (!user) return false;
  
  // Admin can access everything if allowed
  if (allowAdmin) {
    const profile = await getUserProfileServer();
    if (profile?.role === "ADMIN") return true;
  }
  
  // User can only access their own resources
  return user.id === resourceOwnerId;
}

/**
 * Require authentication (client-side)
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Require authentication (server-side)
 * Throws error if user is not authenticated
 */
export async function requireAuthServer(): Promise<User> {
  const user = await getCurrentUserServer();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Require active seller status (client-side)
 * Throws error if user is not an active seller
 */
export async function requireActiveSeller(): Promise<ProfileWithStatus> {
  const profile = await getUserProfile();
  if (!profile) {
    throw new Error("Authentication required");
  }
  if (!profile.isActiveSeller) {
    throw new Error("Active seller status required");
  }
  return profile;
}

/**
 * Require active seller status (server-side)
 * Throws error if user is not an active seller
 */
export async function requireActiveSellerServer(): Promise<ProfileWithStatus> {
  const profile = await getUserProfileServer();
  if (!profile) {
    throw new Error("Authentication required");
  }
  if (!profile.isActiveSeller) {
    throw new Error("Active seller status required");
  }
  return profile;
}

/**
 * Require admin status (client-side)
 * Throws error if user is not an admin
 */
export async function requireAdmin(): Promise<ProfileWithStatus> {
  const profile = await getUserProfile();
  if (!profile) {
    throw new Error("Authentication required");
  }
  if (profile.role !== "ADMIN") {
    throw new Error("Admin status required");
  }
  return profile;
}

/**
 * Require admin status (server-side)
 * Throws error if user is not an admin
 */
export async function requireAdminServer(): Promise<ProfileWithStatus> {
  const profile = await getUserProfileServer();
  if (!profile) {
    throw new Error("Authentication required");
  }
  if (profile.role !== "ADMIN") {
    throw new Error("Admin status required");
  }
  return profile;
}

// ============================================================================
// AUTHENTICATION STATE UTILITIES
// ============================================================================

/**
 * Get authentication state with user and profile (client-side)
 */
export async function getAuthState(): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      profile: null,
      isAuthenticated: false,
      isActiveSeller: false,
      isAdmin: false,
    };
  }
  
  const profile = await getUserProfile(user.id);
  
  return {
    user,
    profile,
    isAuthenticated: true,
    isActiveSeller: profile?.isActiveSeller ?? false,
    isAdmin: profile?.role === "ADMIN",
  };
}

/**
 * Get authentication state with user and profile (server-side)
 */
export async function getAuthStateServer(): Promise<AuthState> {
  const user = await getCurrentUserServer();
  if (!user) {
    return {
      user: null,
      profile: null,
      isAuthenticated: false,
      isActiveSeller: false,
      isAdmin: false,
    };
  }
  
  const profile = await getUserProfileServer(user.id);
  
  return {
    user,
    profile,
    isAuthenticated: true,
    isActiveSeller: profile?.isActiveSeller ?? false,
    isAdmin: profile?.role === "ADMIN",
  };
}

// ============================================================================
// AUTHENTICATION ERROR HANDLING
// ============================================================================

/**
 * Handle authentication errors with proper logging
 */
export function handleAuthError(error: any, operation: string): string {
  console.error(`Authentication error in ${operation}:`, error);
  
  // Return user-friendly error messages
  if (error.message?.includes("Invalid login credentials")) {
    return "Invalid email or password";
  }
  
  if (error.message?.includes("Email not confirmed")) {
    return "Please check your email and confirm your account";
  }
  
  if (error.message?.includes("User not found")) {
    return "No account found with this email address";
  }
  
  if (error.message?.includes("Password should be at least")) {
    return "Password must be at least 8 characters long";
  }
  
  if (error.message?.includes("Invalid email")) {
    return "Please enter a valid email address";
  }
  
  if (error.message?.includes("User already registered")) {
    return "An account with this email already exists";
  }
  
  if (error.message?.includes("Too many requests")) {
    return "Too many attempts. Please try again later";
  }
  
  return error.message || "An authentication error occurred";
}

/**
 * Check if error is authentication-related
 */
export function isAuthError(error: any): boolean {
  const authErrorMessages = [
    "Invalid login credentials",
    "Email not confirmed",
    "User not found",
    "Password should be at least",
    "Invalid email",
    "User already registered",
    "Too many requests",
    "Authentication required",
    "Active seller status required",
    "Admin status required",
  ];
  
  return authErrorMessages.some(msg => 
    error.message?.includes(msg) || error.message === msg
  );
}

// ============================================================================
// AUTHENTICATION VALIDATION UTILITIES
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
}

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;
  
  // Length bonus
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  
  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 10; // Common sequences
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  if (strength < 30) return "Weak";
  if (strength < 60) return "Fair";
  if (strength < 80) return "Good";
  return "Strong";
}

// ============================================================================
// AUTHENTICATION REDIRECT UTILITIES
// ============================================================================

/**
 * Get redirect URL after authentication
 */
export function getAuthRedirectUrl(user: User | null): string {
  if (!user) {
    return "/";
  }
  
  // Check if user has completed profile setup
  // This would typically check if required fields are filled
  return "/profile";
}

/**
 * Get redirect URL after sign out
 */
export function getSignOutRedirectUrl(): string {
  return "/";
}

/**
 * Get redirect URL for protected routes
 */
export function getProtectedRedirectUrl(): string {
  return "/auth/sign-in";
}

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileWithStatus extends Profile {
  isActiveSeller: boolean;
}

export interface AuthState {
  user: User | null;
  profile: ProfileWithStatus | null;
  isAuthenticated: boolean;
  isActiveSeller: boolean;
  isAdmin: boolean;
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: number;
}

export interface AuthError {
  message: string;
  code?: string;
  details?: any;
}
