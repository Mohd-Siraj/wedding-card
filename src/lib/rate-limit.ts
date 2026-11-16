import "server-only";
import { headers } from "next/headers";

// Fixed-window limiter for the open guest forms (PRD: rate limits at launch).
// In-memory, so on serverless each instance keeps its own window. That's
// enough to stop casual abuse; P1 adds stronger spam protection.
const hits = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(action: string, limit: number, windowMs: number) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const key = `${action}:${ip}`;
  const now = Date.now();

  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  }

  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
