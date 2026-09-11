import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitAction =
  | "login"
  | "login-ip"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "resend-verification";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfterSeconds: number;
  errorMessage?: string;
}

// Initialize Upstash Redis client if credentials are provided
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

// Define sliding-window rate limiters matching specification:
// - login: 5 attempts / 15 min (Key: IP:email)
// - login-ip: 30 attempts / 15 min (Key: IP, protects against password spraying)
// - register: 3 attempts / 1 hour
// - forgot-password: 3 attempts / 1 hour
// - reset-password: 5 attempts / 15 min
// - resend-verification: 3 attempts / 15 min
const limiters: Record<RateLimitAction, Ratelimit | null> = {
  login: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "ratelimit:auth:login",
        analytics: true,
        timeout: 1500,
      })
    : null,
  "login-ip": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "15 m"),
        prefix: "ratelimit:auth:login-ip",
        analytics: true,
        timeout: 1500,
      })
    : null,
  register: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        prefix: "ratelimit:auth:register",
        analytics: true,
        timeout: 1500,
      })
    : null,
  "forgot-password": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        prefix: "ratelimit:auth:forgot-password",
        analytics: true,
        timeout: 1500,
      })
    : null,
  "reset-password": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "ratelimit:auth:reset-password",
        analytics: true,
        timeout: 1500,
      })
    : null,
  "resend-verification": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "15 m"),
        prefix: "ratelimit:auth:resend-verification",
        analytics: true,
        timeout: 1500,
      })
    : null,
};

/**
 * Extracts client IP address from request headers or Next.js headers().
 * Prioritizes trusted proxy headers (cf-connecting-ip, x-real-ip) over x-forwarded-for.
 */
export async function getClientIp(request?: Request | Headers | null): Promise<string> {
  let headersList: Headers | null = null;

  if (request instanceof Request) {
    headersList = request.headers;
  } else if (request instanceof Headers) {
    headersList = request;
  } else {
    try {
      const { headers } = await import("next/headers");
      headersList = await headers();
    } catch {
      // Outside of Next.js server request context
      headersList = null;
    }
  }

  if (headersList) {
    const cfIp = headersList.get("cf-connecting-ip");
    if (cfIp?.trim()) return cfIp.trim();

    const realIp = headersList.get("x-real-ip");
    if (realIp?.trim()) return realIp.trim();

    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0]?.trim();
      if (firstIp) return firstIp;
    }
  }

  return "127.0.0.1";
}

/**
 * Checks rate limit for a specific authentication action and identifier.
 * Fails open if Upstash Redis is unconfigured or unreachable.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = limiters[action];

  // Fail-open if Redis is not configured
  if (!limiter || !redis) {
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
      retryAfterSeconds: 0,
    };
  }

  try {
    const result = await limiter.limit(identifier);

    if (!result.success) {
      const now = Date.now();
      const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - now) / 1000));
      const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
      const timeString = minutes > 1 ? `${minutes} minutes` : `${minutes} minute`;

      return {
        success: false,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfterSeconds,
        errorMessage: `Too many attempts. Please try again in ${timeString}.`,
      };
    }

    return {
      success: true,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfterSeconds: 0,
    };
  } catch (error) {
    // Fail-open if Redis encounters network issues or errors
    console.warn(
      `[RateLimit] Error checking rate limit for action "${action}" (${identifier}), failing open:`,
      error
    );
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
      retryAfterSeconds: 0,
    };
  }
}

/**
 * Returns standard 429 Too Many Requests response with Retry-After and rate limit headers.
 */
export function rateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const message =
    customMessage || result.errorMessage || "Too many attempts. Please try again later.";

  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    }
  );
}
