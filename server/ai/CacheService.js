/**
 * CacheService — In-memory TTL cache for AI responses
 *
 * Cache keys:
 *   "transcript:{videoId}"   — raw transcript items
 *   "summary:{videoId}"      — global chunk summary
 *   "embeddings:{courseId}"  — RAG embedding index
 *   "course:{videoId}"       — full generated course output
 *
 * Persistent deduplication is handled by MongoDB courseKey.
 * This cache is a request-level performance optimisation (avoids
 * re-processing the same video within a single server session).
 *
 * TTL: 2 hours by default.
 */

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const store = new Map();

/**
 * Get item from cache. Returns undefined if absent or expired.
 * @param {string} key
 * @returns {any|undefined}
 */
export function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Store an item in cache.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs — optional TTL override in milliseconds
 */
export function set(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Delete a specific cache entry.
 * @param {string} key
 */
export function del(key) {
  store.delete(key);
}

/**
 * Check if a key exists and is not expired.
 * @param {string} key
 * @returns {boolean}
 */
export function has(key) {
  return get(key) !== undefined;
}

/**
 * Returns cache stats (useful for debugging).
 */
export function stats() {
  let live = 0;
  const now = Date.now();
  for (const [, entry] of store) {
    if (now <= entry.expiresAt) live++;
  }
  return { total: store.size, live, expired: store.size - live };
}

/**
 * Purge all expired entries (run periodically to prevent memory leaks).
 */
export function purgeExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key);
  }
}

// Auto-purge expired entries every 30 minutes
setInterval(purgeExpired, 30 * 60 * 1000);
