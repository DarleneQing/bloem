import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/logger";

/**
 * Opt-in rate limiting backed by Upstash Redis.
 *
 * The limiter is created lazily on first use. When the required env vars
 * (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) are unset,
 * `checkRateLimit` returns `{ success: true, disabled: true }` and logs a
 * single warning per process. This keeps the feature shippable before
 * Upstash is provisioned — the route handlers can call this unconditionally.
 *
 * Each tuning preset (e.g. "cart_reserve") gets its own Ratelimit instance
 * with its own sliding window, so different surfaces don't share quota.
 */

type Preset = {
  /** Cache key under which the Ratelimit instance is memoized. */
  key: string;
  /** Max events per window. */
  max: number;
  /** Sliding-window duration accepted by `@upstash/ratelimit`. */
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  /** Logical surface name for Upstash analytics (`/cart-reserve`, etc.). */
  prefix: string;
};

/**
 * Tuning per route. Edit here, not at the call site.
 */
export const RATE_LIMITS = {
  cart_reserve: {
    key: "cart_reserve",
    max: 5,
    window: "1 m",
    prefix: "ratelimit:cart_reserve",
  },
  cart_checkout: {
    key: "cart_checkout",
    max: 10,
    window: "1 m",
    prefix: "ratelimit:cart_checkout",
  },
  auth_sensitive: {
    key: "auth_sensitive",
    max: 10,
    window: "1 m",
    prefix: "ratelimit:auth",
  },
} as const satisfies Record<string, Preset>;

export type RateLimitKey = keyof typeof RATE_LIMITS;

let redis: Redis | null = null;
let configCheckLogged = false;
const limiters = new Map<RateLimitKey, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!configCheckLogged) {
      logger.warn(
        "Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. " +
          "Set both env vars to enable per-route quotas."
      );
      configCheckLogged = true;
    }
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(key: RateLimitKey): Ratelimit | null {
  const cached = limiters.get(key);
  if (cached) return cached;

  const r = getRedis();
  if (!r) return null;

  const preset = RATE_LIMITS[key];
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(preset.max, preset.window),
    analytics: true,
    prefix: preset.prefix,
  });

  limiters.set(key, limiter);
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  /** Quota cap for the window. 0 when rate limiting is disabled. */
  limit: number;
  /** Remaining events in the window. */
  remaining: number;
  /** Unix-ms timestamp when the window resets. */
  reset: number;
  /** True when env vars are missing and the check was bypassed. */
  disabled: boolean;
}

/**
 * Check whether `identifier` has remaining quota under the named preset.
 *
 * `identifier` should be stable per caller — prefer `user.id` for
 * authenticated routes, falling back to client IP for unauthenticated ones.
 */
export async function checkRateLimit(
  key: RateLimitKey,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(key);

  if (!limiter) {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      disabled: true,
    };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    return { success, limit, remaining, reset, disabled: false };
  } catch (error) {
    // Upstash transient failure — fail open to avoid taking down the
    // route, but log loudly. Repeated failures should surface in logs.
    logger.error("Rate limit check failed; allowing request:", error);
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      disabled: true,
    };
  }
}

/**
 * Build standard rate-limit response headers from a result.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (result.disabled) return {};
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
