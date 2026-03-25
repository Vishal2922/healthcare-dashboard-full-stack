/**
 * PaginationBar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable pagination component that consumes the output of usePrefetchPagination.
 *
 * Features:
 *   • Prev / Next buttons
 *   • Numbered page buttons with ellipsis (…)
 *   • Per-page selector (10 / 20 / 50)
 *   • "Showing X–Y of Z results" summary
 *   • Subtle prefetch indicator (tiny dot when next page is being loaded)
 *   • Fully accessible (aria-label, aria-current)
 *
 * Usage:
 *   import PaginationBar from './PaginationBar';
 *   import usePrefetchPagination from '../../hooks/usePrefetchPagination';
 *
 *   const pagination = usePrefetchPagination({
 *     fetchAction:   fetchPatientsRequest,
 *     metaSelector:  selectPatientMeta,
 *     listLoading,
 *   });
 *
 *   <PaginationBar
 *     {...pagination}
 *     isPrefetching={prefetching}   // optional: shows a subtle indicator
 *   />
 */

import React from 'react';

// ── Base styles (inline — no CSS file needed) ─────────────────────────────────
const styles = {
  container: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexWrap:       'wrap',
    gap:            '12px',
    padding:        '12px 0 4px',
    userSelect:     'none',
  },
  summary: {
    fontSize:  '0.8125rem',
    color:     '#6b7280',
    flexShrink: 0,
  },
  controls: {
    display:    'flex',
    alignItems: 'center',
    gap:        '4px',
    flexWrap:   'wrap',
  },
  pageBtn: (active, disabled) => ({
    minWidth:     '34px',
    height:       '34px',
    padding:      '0 8px',
    border:       `1px solid ${active ? '#3b82f6' : '#e5e7eb'}`,
    borderRadius: '6px',
    background:   active ? '#3b82f6' : disabled ? '#f9fafb' : '#fff',
    color:        active ? '#fff' : disabled ? '#d1d5db' : '#374151',
    cursor:       disabled ? 'not-allowed' : 'pointer',
    fontWeight:   active ? 600 : 400,
    fontSize:     '0.8125rem',
    lineHeight:   1,
    transition:   'all 0.12s',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
  }),
  ellipsis: {
    padding:   '0 4px',
    color:     '#9ca3af',
    fontSize:  '0.875rem',
    lineHeight: '34px',
  },
  perPageWrapper: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
    fontSize:   '0.8125rem',
    color:      '#6b7280',
  },
  select: {
    border:       '1px solid #e5e7eb',
    borderRadius: '6px',
    padding:      '4px 8px',
    fontSize:     '0.8125rem',
    color:        '#374151',
    background:   '#fff',
    cursor:       'pointer',
  },
  prefetchDot: {
    width:           '6px',
    height:          '6px',
    borderRadius:    '50%',
    background:      '#93c5fd',
    animation:       'ehrPulse 1.2s ease-in-out infinite',
    flexShrink:      0,
    title:           'Prefetching next page…',
  },
};

// ── Arrow icons ───────────────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function PaginationBar({
  currentPage,
  lastPage,
  total,
  perPage,
  perPageOptions = [10, 20, 50],
  isFirstPage,
  isLastPage,
  isLoading      = false,
  isPrefetching  = false,
  goToPage,
  nextPage,
  prevPage,
  changePerPage,
  getPageRange,
}) {
  if (!total || lastPage <= 0) return null;

  // ── Row range summary ─────────────────────────────────────────────────────
  const rangeStart = (currentPage - 1) * perPage + 1;
  const rangeEnd   = Math.min(currentPage * perPage, total);

  return (
    <div style={styles.container}>
      {/* Left: summary + prefetch indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={styles.summary}>
          Showing{' '}
          <strong style={{ color: '#374151' }}>{rangeStart}–{rangeEnd}</strong>
          {' '}of{' '}
          <strong style={{ color: '#374151' }}>{total}</strong>
          {' '}results
        </span>

        {/* Subtle dot while prefetching next page */}
        {isPrefetching && (
          <>
            <style>{`@keyframes ehrPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
            <div
              style={styles.prefetchDot}
              title="Prefetching next page…"
              aria-hidden="true"
            />
          </>
        )}
      </div>

      {/* Center: prev / next buttons */}
      <div style={styles.controls} role="navigation" aria-label="Pagination">
        {/* Prev */}
        <button
          style={styles.pageBtn(false, isFirstPage || isLoading)}
          onClick={prevPage}
          disabled={isFirstPage || isLoading}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </button>

        {/* Page indicator */}
        <span style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 500, padding: '0 8px' }}>
          Page {currentPage} of {lastPage}
        </span>

        {/* Next */}
        <button
          style={styles.pageBtn(false, isLastPage || isLoading)}
          onClick={nextPage}
          disabled={isLastPage || isLoading}
          aria-label="Next page"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Right: per-page selector */}
      <div style={styles.perPageWrapper}>
        <label htmlFor="ehr-per-page">Rows:</label>
        <select
          id="ehr-per-page"
          style={styles.select}
          value={perPage}
          onChange={(e) => changePerPage(Number(e.target.value))}
          disabled={isLoading}
        >
          {perPageOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}