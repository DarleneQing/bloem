import React from "react";

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Custom error classes for different types of errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = "INTERNAL_ERROR",
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", context?: Record<string, any>) {
    super(message, "AUTHENTICATION_ERROR", 401, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions", context?: Record<string, any>) {
    super(message, "AUTHORIZATION_ERROR", 403, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", context?: Record<string, any>) {
    super(message, "NOT_FOUND_ERROR", 404, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict", context?: Record<string, any>) {
    super(message, "CONFLICT_ERROR", 409, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded", context?: Record<string, any>) {
    super(message, "RATE_LIMIT_ERROR", 429, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed", context?: Record<string, any>) {
    super(message, "DATABASE_ERROR", 500, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = "External service error", context?: Record<string, any>) {
    super(message, "EXTERNAL_SERVICE_ERROR", 502, context);
  }
}

export class PaymentError extends AppError {
  constructor(message: string = "Payment processing failed", context?: Record<string, any>) {
    super(message, "PAYMENT_ERROR", 402, context);
  }
}

// ============================================================================
// ERROR HANDLING FUNCTIONS
// ============================================================================

/**
 * Handle and format errors for API responses
 */
export function handleError(error: unknown): ErrorResponse {
  // Log the error for debugging
  console.error("Error occurred:", error);

  // Handle known error types
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        context: error.context,
      },
    };
  }

  // Handle Supabase errors
  if (error && typeof error === "object" && "code" in error) {
    const supabaseError = error as any;
    return {
      success: false,
      error: {
        code: "SUPABASE_ERROR",
        message: formatSupabaseError(supabaseError),
        statusCode: 400,
        context: {
          supabaseCode: supabaseError.code,
          details: supabaseError.details,
          hint: supabaseError.hint,
        },
      },
    };
  }

  // Handle validation errors (Zod)
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as any;
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        statusCode: 400,
        context: {
          issues: zodError.issues,
        },
      },
    };
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message,
      statusCode: 500,
    },
  };
}

/**
 * Format Supabase error messages
 */
export function formatSupabaseError(error: any): string {
  const code = error.code;
  const message = error.message;

  switch (code) {
    case "PGRST116":
      return "No data found";
    case "23505":
      return "This item already exists";
    case "23503":
      return "Referenced data not found";
    case "42501":
      return "You don't have permission to perform this action";
    case "42P01":
      return "Database table not found";
    case "42703":
      return "Database column not found";
    case "22001":
      return "Data too long for column";
    case "22003":
      return "Numeric value out of range";
    case "22007":
      return "Invalid date format";
    case "22008":
      return "Invalid time format";
    case "22012":
      return "Division by zero";
    case "22023":
      return "Invalid parameter value";
    case "22024":
      return "Unterminated string literal";
    case "22025":
      return "Invalid escape sequence";
    case "22026":
      return "String data length mismatch";
    case "22027":
      return "Trim error";
    case "22028":
      return "Invalid regular expression";
    case "22029":
      return "Invalid regular expression flag";
    case "22030":
      return "Invalid regular expression quantifier";
    case "22031":
      return "Invalid regular expression character class";
    case "22032":
      return "Invalid regular expression character class range";
    case "22033":
      return "Invalid regular expression character class range end";
    case "22034":
      return "Invalid regular expression character class range start";
    case "22035":
      return "Invalid regular expression character class range step";
    case "22036":
      return "Invalid regular expression character class range step direction";
    case "22037":
      return "Invalid regular expression character class range step magnitude";
    case "22038":
      return "Invalid regular expression character class range step magnitude direction";
    case "22039":
      return "Invalid regular expression character class range step magnitude direction magnitude";
    case "22040":
      return "Invalid regular expression character class range step magnitude direction magnitude direction";
    default:
      return message || "Database operation failed";
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  context?: Record<string, any>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      context,
    },
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

// ============================================================================
// ERROR BOUNDARY UTILITIES
// ============================================================================

/**
 * Error boundary for React components
 */
export function withErrorBoundary<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return class ErrorBoundary extends React.Component<
    T & { children?: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: T & { children?: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error("Error boundary caught an error:", error, errorInfo);
      // Log to error reporting service
      logError(error, { errorInfo, component: Component.name });
    }

    render() {
      if (this.state.hasError) {
        if (fallback) {
          const FallbackComponent = fallback;
          return (
            <FallbackComponent
              error={this.state.error!}
              resetError={() => this.setState({ hasError: false, error: undefined })}
            />
          );
        }

        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              We&apos;re sorry, but something unexpected happened.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
}

// ============================================================================
// ERROR LOGGING UTILITIES
// ============================================================================

/**
 * Log error to external service
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error logged:", errorData);
  }

  // Send to error reporting service (e.g., Sentry, LogRocket, etc.)
  if (typeof window !== "undefined" && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, { extra: context });
  }

  // Send to custom error endpoint
  if (typeof window !== "undefined") {
    fetch("/api/errors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorData),
    }).catch((fetchError) => {
      console.error("Failed to log error:", fetchError);
    });
  }
}

/**
 * Log warning
 */
export function logWarning(message: string, context?: Record<string, any>): void {
  const warningData = {
    message,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    context,
  };

  console.warn("Warning:", warningData);

  if (typeof window !== "undefined" && (window as any).Sentry) {
    (window as any).Sentry.captureMessage(message, "warning", { extra: context });
  }
}

/**
 * Log info
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  const infoData = {
    message,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    context,
  };

  console.info("Info:", infoData);
}

// ============================================================================
// ERROR RECOVERY UTILITIES
// ============================================================================

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Timeout wrapper for async functions
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = "Operation timed out"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Safe async function wrapper
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ success: boolean; data?: T; error?: Error }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    logError(error as Error);
    return {
      success: false,
      error: error as Error,
      data: fallback,
    };
  }
}

// ============================================================================
// VALIDATION ERROR UTILITIES
// ============================================================================

/**
 * Format validation errors from Zod
 */
export function formatValidationErrors(errors: any[]): string[] {
  return errors.map((error) => {
    const path = error.path.join(".");
    return `${path}: ${error.message}`;
  });
}

/**
 * Create validation error from Zod error
 */
export function createValidationError(zodError: any): ValidationError {
  const messages = formatValidationErrors(zodError.issues);
  return new ValidationError(messages.join(", "), {
    issues: zodError.issues,
  });
}

// ============================================================================
// ERROR MONITORING UTILITIES
// ============================================================================

/**
 * Monitor function execution and catch errors
 */
export function monitorFunction<T extends (...args: any[]) => any>(
  fn: T,
  functionName: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          logError(error, {
            functionName,
            args: args.length > 0 ? args : undefined,
          });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      logError(error as Error, {
        functionName,
        args: args.length > 0 ? args : undefined,
      });
      throw error;
    }
  }) as T;
}

/**
 * Performance monitoring wrapper
 */
export function monitorPerformance<T extends (...args: any[]) => any>(
  fn: T,
  functionName: string
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    
    try {
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const end = performance.now();
          const duration = end - start;
          
          if (duration > 1000) {
            logWarning(`Slow function execution: ${functionName} took ${duration.toFixed(2)}ms`);
          }
        });
      }
      
      const end = performance.now();
      const duration = end - start;
      
      if (duration > 1000) {
        logWarning(`Slow function execution: ${functionName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      
      logError(error as Error, {
        functionName,
        duration,
        args: args.length > 0 ? args : undefined,
      });
      
      throw error;
    }
  }) as T;
}

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    context?: Record<string, any>;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  [key: string]: any;
}
