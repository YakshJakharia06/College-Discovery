/**
 * Minimal in-memory rate limiter.
 *
 * Known limitation (worth mentioning in your video): this state lives in
 * each serverless function instance's memory. On Vercel, concurrent
 * instances don't share this Map, so under real multi-instance load this is
 * a best-effort deterrent, not an airtight guarantee. For an MVP this is a
 * reasonable, explainable tradeoff per the assignment's "don't over-engineer
 * rate limiting" guidance. A production upgrade path would be Redis
 * (Upstash) or Vercel's own rate-limiting middleware.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
