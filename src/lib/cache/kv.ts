/**
 * Cache layer using Vercel KV (Redis).
 * Falls back gracefully when KV is not configured (local dev).
 */

let kv: {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, options?: { ex?: number }) => Promise<void>;
} | null = null;

async function getKV() {
  if (kv) return kv;
  try {
    const vercelKV = await import('@vercel/kv');
    kv = vercelKV.kv as unknown as typeof kv;
    return kv;
  } catch {
    // KV not available — return in-memory fallback
    return null;
  }
}

// In-memory cache for local development
const memoryCache = new Map<string, { value: unknown; expires: number }>();

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const kvInstance = await getKV();
    if (kvInstance) {
      return await kvInstance.get<T>(key);
    }
    // Fallback to memory cache
    const entry = memoryCache.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry.value as T;
    }
    memoryCache.delete(key);
    return null;
  } catch {
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 86400
): Promise<void> {
  try {
    const kvInstance = await getKV();
    if (kvInstance) {
      await kvInstance.set(key, value, { ex: ttlSeconds });
      return;
    }
    // Fallback to memory cache
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export function corridorCacheKey(
  corridorId: string,
  type: 'analysis' | 'narrative' | 'pilot'
): string {
  return `pulseroute:${type}:${corridorId}`;
}

/**
 * Creates a cache key from coordinates for dynamically searched areas.
 * Rounds to ~100m precision so near-duplicate searches hit cache.
 */
export function coordsCacheKey(
  center: [number, number],
  type: 'analysis' | 'narrative' | 'pilot'
): string {
  const lng = Math.round(center[0] * 1000) / 1000;
  const lat = Math.round(center[1] * 1000) / 1000;
  return `pulseroute:${type}:${lng}_${lat}`;
}
