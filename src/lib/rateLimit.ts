export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// In-memory, per-instance rate limiting. Ported from the coaching-platform's
// lib/rateLimit.ts so this marketing site uses the same simple pattern rather
// than reintroducing Redis/KV infrastructure (the exact dependency this
// migration removes).
//
// Best-effort by design: on Vercel serverless each warm instance keeps its own
// Map, so this is a coarse throttle, not a global counter. Turnstile is the
// primary bot/abuse gate on every submission; this is defense in depth.
const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = requests.get(key);

  if (!record || now > record.resetAt) {
    requests.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetAt: record.resetAt };
}
