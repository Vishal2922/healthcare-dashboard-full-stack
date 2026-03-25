/**
 * pageCacheManager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * In-memory + sessionStorage page cache for prefetch pagination.
 *
 * Each cache entry is keyed by a cache key derived from:
 *   module + page + per_page + filters (sorted, stable JSON)
 *
 * Cache entries are stored in memory for fast access and also
 * persisted in sessionStorage so they survive in-tab navigation.
 *
 * TTL: 5 minutes (configurable). Stale entries are ignored.
 *
 * Usage:
 *   import pageCache from './pageCacheManager';
 *   const key = pageCache.makeKey('patients', { page: 2, per_page: 10, search: 'john' });
 *   pageCache.set(key, { data: [...], meta: {...} });
 *   const cached = pageCache.get(key);   // null if stale/missing
 *   pageCache.invalidate('patients');    // clear all patient pages
 *   pageCache.clear();                   // clear everything
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SS_KEY       = 'ehr_page_cache';

// ── In-memory store ───────────────────────────────────────────────────────────
let _memCache = {};

// ── sessionStorage helpers ────────────────────────────────────────────────────
function ssLoad() {
  try {
    return JSON.parse(sessionStorage.getItem(SS_KEY) || '{}');
  } catch { return {}; }
}

function ssSave(cache) {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(cache)); } catch {}
}

// Hydrate memory cache from sessionStorage on first import
_memCache = ssLoad();

// ── Key generation ────────────────────────────────────────────────────────────
function stableStringify(obj) {
  if (!obj || typeof obj !== 'object') return String(obj);
  return JSON.stringify(
    Object.keys(obj).sort().reduce((acc, k) => {
      acc[k] = obj[k];
      return acc;
    }, {})
  );
}

// ── Cache operations ─────────────────────────────────────────────────────────

const pageCache = {

  /**
   * Generate a stable cache key for a given module + params combo.
   * @param {string} module   e.g. 'patients'
   * @param {object} params   { page, per_page, search, status, ... }
   * @returns {string}
   */
  makeKey(module, params = {}) {
    return `${module}::${stableStringify(params)}`;
  },

  /**
   * Store a page result.
   * @param {string} key
   * @param {{ data: Array, meta: object }} value
   */
  set(key, value) {
    const entry = { value, ts: Date.now() };
    _memCache[key] = entry;
    ssSave(_memCache);
  },

  /**
   * Retrieve a page result. Returns null if missing or stale.
   * @param {string} key
   * @returns {{ data: Array, meta: object } | null}
   */
  get(key) {
    const entry = _memCache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      delete _memCache[key];
      ssSave(_memCache);
      return null;
    }
    return entry.value;
  },

  /**
   * Check if a cache entry exists and is fresh.
   */
  has(key) {
    return this.get(key) !== null;
  },

  /**
   * Invalidate all cache entries for a module.
   * Call after a mutation (create/update/delete).
   * @param {string} module
   */
  invalidate(module) {
    const prefix = `${module}::`;
    Object.keys(_memCache).forEach((k) => {
      if (k.startsWith(prefix)) delete _memCache[k];
    });
    ssSave(_memCache);
  },

  /**
   * Invalidate all cache entries across all modules.
   */
  clear() {
    _memCache = {};
    sessionStorage.removeItem(SS_KEY);
  },

  /**
   * Get all cached keys for a module (for debugging).
   */
  keysFor(module) {
    const prefix = `${module}::`;
    return Object.keys(_memCache).filter((k) => k.startsWith(prefix));
  },
};

export default pageCache;