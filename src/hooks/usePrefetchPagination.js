/**
 * usePrefetchPagination.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Cache-aware paginated data hook with background prefetch.
 *
 * Works with any Redux module that follows the standard pagination pattern:
 *   fetchRequest({ page, per_page, filters }) → state.meta.page
 *
 * Prefetch flow:
 *   1. User navigates to page N
 *   2. If page N is in Redux pageCache → serve instantly (no spinner)
 *   3. Otherwise → dispatch fetchAction (normal API call)
 *   4. After page N is displayed, prefetch page N+1 in the background
 *   5. On "Next Page", instantly show prefetched data + prefetch N+2
 *   6. Duplicate prefetch/fetch calls are avoided via in-flight tracking
 *
 * @param {{
 *   fetchAction:        ActionCreator,
 *   metaSelector:       Selector,
 *   pageCacheSelector:  Selector,       // (state) => state.module.pageCache
 *   serveFromCacheAction: ActionCreator, // action({ data, meta })
 *   prefetchAction:     ActionCreator,   // optional — dispatched for next page
 *   listLoading:        boolean,
 *   debounceMs?:        number,
 *   perPageOptions?:    number[],
 *   cacheKeyPrefix?:    string,          // e.g. 'patients'
 *   filtersSelector?:   Selector,
 * }} options
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import pageCache from '../services/pageCacheManager';

const DEFAULT_DEBOUNCE_MS = 200;
const DEFAULT_PER_PAGE    = 5;

export default function usePrefetchPagination({
  fetchAction,
  metaSelector,
  pageCacheSelector,
  serveFromCacheAction,
  prefetchAction,
  listLoading = false,
  debounceMs  = DEFAULT_DEBOUNCE_MS,
  perPageOptions = [5],
  cacheKeyPrefix = '',
  filtersSelector,
}) {
  const dispatch   = useDispatch();
  const meta       = useSelector(metaSelector);
  const reduxCache = useSelector(pageCacheSelector ?? (() => ({})));
  const filters    = useSelector(filtersSelector ?? (() => ({})));

  const currentPage = meta?.page      ?? 1;
  const lastPage    = meta?.last_page  ?? 1;
  const total       = meta?.total      ?? 0;
  const perPage     = meta?.per_page   ?? DEFAULT_PER_PAGE;

  // Debounce ref: holds the pending setTimeout id
  const debounceRef   = useRef(null);
  // Track in-flight prefetch pages to avoid duplicates
  const inFlightRef   = useRef(new Set());

  // "Optimistic" page — updates instantly for UX, actual fetch is debounced
  const [optimisticPage, setOptimisticPage] = useState(currentPage);

  // Keep optimistic page in sync when meta changes (e.g. after filter reset)
  useEffect(() => {
    setOptimisticPage(currentPage);
  }, [currentPage]);

  // ── Build cache key for a given page (must match pageCacheManager.makeKey) ──
  const buildCacheKey = useCallback(
    (page) => {
      if (!cacheKeyPrefix) return null;
      const params = { page, per_page: perPage, ...filters };
      return pageCache.makeKey(cacheKeyPrefix, params);
    },
    [cacheKeyPrefix, perPage, filters]
  );

  // ── Check if a page is already cached (Redux only) ────────────────────────────
  const isPageCached = useCallback(
    (page) => {
      const key = buildCacheKey(page);
      if (!key) return false;
      return !!reduxCache[key];
    },
    [buildCacheKey, reduxCache]
  );

  // ── Get cached data for a page (Redux only) ────────────────────────────────
  const getCachedPage = useCallback(
    (page) => {
      const key = buildCacheKey(page);
      if (!key) return null;
      return reduxCache[key] || null;
    },
    [buildCacheKey, reduxCache]
  );

  // ── Trigger prefetch for a specific page (deduped) ──────────────────────────
  const triggerPrefetch = useCallback(
    (page) => {
      if (page < 1 || page > lastPage) return;
      if (isPageCached(page)) return;
      if (inFlightRef.current.has(page)) return; // already in-flight

      inFlightRef.current.add(page);

      // Dispatch the fetch for the next page — the saga handles the actual
      // API call and caching. We dispatch fetchAction with a special
      // `_prefetch` flag so the saga knows this is a background prefetch.
      if (prefetchAction) {
        dispatch(prefetchAction({ page, per_page: perPage, _prefetch: true }));
      } else {
        dispatch(fetchAction({ page, per_page: perPage, _prefetch: true }));
      }

      // Remove from in-flight set after a reasonable timeout
      setTimeout(() => {
        inFlightRef.current.delete(page);
      }, 10000);
    },
    [dispatch, fetchAction, prefetchAction, lastPage, perPage, isPageCached]
  );

  // ── Go to a specific page ─────────────────────────────────────────────────
  const goToPage = useCallback(
    (page) => {
      if (page < 1 || page > lastPage) return;

      // Update optimistic immediately (no flicker)
      setOptimisticPage(page);

      // Cancel any pending debounced fetch
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // ── Cache hit → serve instantly ───────────────────────────────────────
      const cached = getCachedPage(page);
      if (cached && serveFromCacheAction) {
        dispatch(serveFromCacheAction(cached));
        // Prefetch the NEXT page in the background
        const nextPage = page + 1;
        if (nextPage <= lastPage) {
          // Small delay so the UI renders the cached data first
          setTimeout(() => triggerPrefetch(nextPage), 50);
        }
        return;
      }

      // ── Cache miss → debounce the API fetch ───────────────────────────────
      debounceRef.current = setTimeout(() => {
        dispatch(fetchAction({ page, per_page: perPage }));
        // After this fetch completes, the saga will handle prefetching
        // the next page automatically
      }, debounceMs);
    },
    [
      dispatch, fetchAction, serveFromCacheAction,
      lastPage, perPage, debounceMs,
      getCachedPage, triggerPrefetch,
    ]
  );

  const nextPage = useCallback(
    () => goToPage(optimisticPage + 1),
    [goToPage, optimisticPage]
  );

  const prevPage = useCallback(
    () => goToPage(optimisticPage - 1),
    [goToPage, optimisticPage]
  );

  const changePerPage = useCallback(
    (newPerPage) => {
      setOptimisticPage(1);
      dispatch(fetchAction({ page: 1, per_page: newPerPage }));
    },
    [dispatch, fetchAction]
  );

  // ── Page range for pagination UI (e.g. 1 … 4 5 6 … 20) ──────────────────
  const getPageRange = useCallback(
    (windowSize = 5) => {
      if (lastPage <= windowSize + 2) {
        return Array.from({ length: lastPage }, (_, i) => i + 1);
      }

      const half  = Math.floor(windowSize / 2);
      let start   = Math.max(2, optimisticPage - half);
      let end     = Math.min(lastPage - 1, optimisticPage + half);

      if (optimisticPage - half <= 1)         end   = Math.min(lastPage - 1, windowSize);
      if (optimisticPage + half >= lastPage)  start = Math.max(2, lastPage - windowSize + 1);

      const pages = [1];
      if (start > 2) pages.push('…');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < lastPage - 1) pages.push('…');
      pages.push(lastPage);
      return pages;
    },
    [optimisticPage, lastPage]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    // Capture ref values to keep React Hooks lint happy and ensure cleanup
    // operates on the same Set instance.
    const debounceRefCurrent = debounceRef;
    const inFlightSet = inFlightRef.current;
    return () => {
      if (debounceRefCurrent.current) clearTimeout(debounceRefCurrent.current);
      inFlightSet.clear();
    };
  }, []);

  return {
    currentPage:   optimisticPage,
    lastPage,
    total,
    perPage,
    perPageOptions,
    isFirstPage:   optimisticPage <= 1,
    isLastPage:    optimisticPage >= lastPage,
    isLoading:     listLoading,
    goToPage,
    nextPage,
    prevPage,
    changePerPage,
    getPageRange,
  };
}