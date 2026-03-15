import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

/**
 * Returns true if the request is within the allowed rate.
 * key      — unique identifier (e.g. "evaluate:127.0.0.1")
 * limit    — max requests allowed in the window
 * windowMs — rolling window in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Prune expired buckets to prevent unbounded memory growth
  for (const [k, b] of store) {
    if (now > b.resetAt) store.delete(k);
  }

  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

/** Extract the best available client IP from a Next.js request. */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
