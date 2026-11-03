import { cache, TTL } from "./cache";
import { circuitCheck, circuitSuccess, circuitFailure } from "./circuit";

export interface FetchOptions {
  cacheKey?: string;
  ttlMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * 200);
}

export async function fetchWithRetry(
  url: string,
  opts: FetchOptions = {}
): Promise<Response> {
  const { cacheKey, ttlMs, retries = 3, headers } = opts;

  // cache hit
  if (cacheKey) {
    const cached = cache.get<{ status: number; body: string; headers: Record<string, string> }>(cacheKey);
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        headers: cached.headers,
      });
    }
  }

  // circuit breaker
  const cb = circuitCheck(url);
  if (!cb.allowed) {
    throw new Error(`Circuit open for ${new URL(url).host}`);
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok && res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      // cache successful
      if (cacheKey && res.ok && ttlMs) {
        const body = await res.clone().text();
        const h: Record<string, string> = {};
        res.headers.forEach((v, k) => (h[k] = v));
        cache.set(cacheKey, { status: res.status, body, headers: h }, ttlMs);
      }
      circuitSuccess(url);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const backoff = jitter(Math.min(1000 * Math.pow(2, attempt), 8000));
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }
  circuitFailure(url);
  throw lastErr instanceof Error ? lastErr : new Error("fetch failed");
}

export { cache, TTL };