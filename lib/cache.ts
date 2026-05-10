const cacheStore = new Map<string, { value: unknown; expiresAt: number }>();

export async function withCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = cacheStore.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const value = await loader();
  cacheStore.set(key, {
    value,
    expiresAt: now + ttlMs
  });
  return value;
}

export function invalidateCache(prefix: string) {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}
