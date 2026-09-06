import { env } from "../config/env.js";

// In-memory sliding window IP store
const ipStore = new Map();

// Periodic cleanup of expired IP records every 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipStore.entries()) {
    if (now > record.resetTime) {
      ipStore.delete(key);
    }
  }
}, 3 * 60 * 1000);

/**
 * Creates an Express rate limiter middleware based on IP address
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests allowed per window
 * @param {string} options.message - Error message when limit exceeded
 */
export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || env.rateLimitWindowMs || 60 * 1000;
  const max = options.max || env.rateLimitMaxGlobal || 120;
  const message = options.message || "Too many requests, please try again later.";

  return (req, res, next) => {
    // Extract IP address from request (handling proxies)
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      "unknown-ip";

    const key = `${options.prefix || "global"}:${clientIp}`;
    const now = Date.now();

    let record = ipStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipStore.set(key, record);
    } else {
      record.count += 1;
    }

    // Set standard RateLimit headers
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        success: false,
        message,
        retryAfter,
      });
    }

    next();
  };
}

// Global API rate limiter (e.g. 120 req/min/IP)
export const globalRateLimiter = createRateLimiter({
  prefix: "global",
  max: env.rateLimitMaxGlobal,
  windowMs: env.rateLimitWindowMs,
  message: "Too many requests to TechStar API. Please try again in a minute.",
});

// Stricter rate limiter for sensitive public endpoints (e.g. 15 req/min/IP)
export const sensitiveRateLimiter = createRateLimiter({
  prefix: "sensitive",
  max: env.rateLimitMaxSensitive,
  windowMs: env.rateLimitWindowMs,
  message: "Too many login or tracking requests from this IP. Please try again shortly.",
});
