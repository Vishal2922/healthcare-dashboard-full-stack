import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';

import {
  fetchBillingSummaryRequest,
  fetchInvoicesRequest,
  fetchInvoiceByIdRequest,
  createInvoiceRequest,
  updateInvoiceStatusRequest,
  deleteInvoiceRequest,
  setSelectedInvoice,
  clearSelectedInvoice,
  setFilters,
  resetFilters,
  clearSuccess,
  clearError,
} from '../billingSlice';

import {
  selectInvoiceList,
  selectSelectedInvoice,
  selectBillingSummary,
  selectBillingMeta,
  selectBillingFilters,
  selectBillingListLoading,
  selectBillingDetailLoading,
  selectBillingFormLoading,
  selectBillingSummaryLoading,
  selectBillingPrefetched,
  selectBillingError,
  selectBillingSuccess,
  selectBillingOfflineQueue,
  selectBillingIsOnline,
  selectBillingIsFlushing,
} from '../selectors';

import { selectUserRole, selectIsAdmin } from '../../auth/selectors';

/**
 * RBAC for billing (from backend routes/api.php):
 *   billingStaff = Admin, Provider  → can CREATE invoices + see summary
 *   billingAll   = Admin, Provider, Patient → can READ + update status
 *   adminOnly    = Admin → can DELETE
 */
const READ_ROLES   = ['Admin', 'Provider', 'Patient'];
const WRITE_ROLES  = ['Admin', 'Provider'];

/**
 * useBilling() — Module 11: Billing & Payments
 *
 * ALL hooks unconditional at top (Rules of Hooks).
 * RBAC guard at the BOTTOM — only affects return value.
 *
 * Prefetch:
 *   On mount, fires fetchBillingSummaryRequest once per session.
 *   This populates summary cards instantly on page load.
 *
 * Offline Queue:
 *   Exposes pendingCount + isOnline for the offline banner.
 */
export default function useBilling() {
  const dispatch = useDispatch();

  // ── All selectors — unconditional ──────────────────────────────────────────
  const userRole       = useSelector(selectUserRole);
  const isAdmin        = useSelector(selectIsAdmin);
  const invoiceList    = useSelector(selectInvoiceList);
  const selectedInvoice= useSelector(selectSelectedInvoice);
  const summary        = useSelector(selectBillingSummary);
  const meta           = useSelector(selectBillingMeta);
  const filters        = useSelector(selectBillingFilters);
  const listLoading    = useSelector(selectBillingListLoading);
  const detailLoading  = useSelector(selectBillingDetailLoading);
  const formLoading    = useSelector(selectBillingFormLoading);
  const summaryLoading = useSelector(selectBillingSummaryLoading);
  const prefetched     = useSelector(selectBillingPrefetched);
  const error          = useSelector(selectBillingError);
  const successMessage = useSelector(selectBillingSuccess);
  const offlineQueue   = useSelector(selectBillingOfflineQueue);
  const isOnline       = useSelector(selectBillingIsOnline);
  const isFlushing     = useSelector(selectBillingIsFlushing);

  const hasAccess  = READ_ROLES.includes(userRole);
  const canWrite   = WRITE_ROLES.includes(userRole);
  const canDelete  = isAdmin;

  // ── Prefetch summary on mount — unconditional, guarded internally ──────────
  useEffect(() => {
    if (!hasAccess) return;
    if (!prefetched) {
      dispatch(fetchBillingSummaryRequest());
    }
  }, [dispatch, prefetched, hasAccess]);

  // ── All actions — useCallback unconditional ────────────────────────────────
  const fetchSummary = useCallback(
    () => dispatch(fetchBillingSummaryRequest()),
    [dispatch]
  );

  const fetchInvoices = useCallback(
    (params = {}) => dispatch(fetchInvoicesRequest(params)),
    [dispatch]
  );

  const fetchInvoiceById = useCallback(
    (id) => dispatch(fetchInvoiceByIdRequest(id)),
    [dispatch]
  );

  const createInvoice = useCallback(
    (payload) => {
      if (!canWrite) return;
      dispatch(createInvoiceRequest(payload));
    },
    [dispatch, canWrite]
  );

  const updateInvoiceStatus = useCallback(
    (payload) => dispatch(updateInvoiceStatusRequest(payload)),
    [dispatch]
  );

  const deleteInvoice = useCallback(
    (id) => {
      if (!canDelete) return;
      dispatch(deleteInvoiceRequest(id));
    },
    [dispatch, canDelete]
  );

  const selectInvoice = useCallback(
    (invoice) => dispatch(setSelectedInvoice(invoice)),
    [dispatch]
  );

  const clearInvoice = useCallback(
    () => dispatch(clearSelectedInvoice()),
    [dispatch]
  );

  const applyFilters = useCallback(
    (newFilters) => dispatch(setFilters(newFilters)),
    [dispatch]
  );

  const clearFiltersAction = useCallback(
    () => dispatch(resetFilters()),
    [dispatch]
  );

  const dismissSuccess = useCallback(() => dispatch(clearSuccess()), [dispatch]);
  const dismissError   = useCallback(() => dispatch(clearError()),   [dispatch]);

  // ── RBAC guard — AFTER all hooks ───────────────────────────────────────────
  if (!hasAccess) {
    return { accessDenied: true, userRole };
  }

  return {
    // Data
    invoiceList,
    selectedInvoice,
    summary,
    meta,
    filters,

    // Loading states
    listLoading,
    detailLoading,
    formLoading,
    summaryLoading,

    // Feedback
    error,
    successMessage,

    // Offline
    offlineQueue,
    pendingCount: offlineQueue.length,
    isOnline,
    isFlushing,

    // RBAC
    accessDenied: false,
    canWrite,
    canDelete,
    userRole,

    // Actions
    fetchSummary,
    fetchInvoices,
    fetchInvoiceById,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    selectInvoice,
    clearInvoice,
    applyFilters,
    clearFilters: clearFiltersAction,
    dismissSuccess,
    dismissError,
  };
}
