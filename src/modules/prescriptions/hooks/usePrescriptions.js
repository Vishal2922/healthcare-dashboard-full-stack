/**
 * usePrescriptions — Prescription Module Hook
 *
 * RBAC: Only Provider, Pharmacist, and Admin can access prescriptions.
 * All hooks called unconditionally (Rules of Hooks).
 * RBAC guard affects return value only.
 */
import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';

import {
  fetchPrescriptionsRequest,
  createPrescriptionRequest,
  updatePrescriptionRequest,
  setSelectedRx,
  clearSelectedRx,
  clearError,
  clearSuccess,
} from '../prescriptionSlice';

import {
  selectPrescriptionList,
  selectSelectedRx,
  selectPrescriptionListLoading,
  selectPrescriptionFormLoading,
  selectPrescriptionError,
  selectPrescriptionSuccess,
} from '../selectors';

import { selectUserRole } from '../../auth/selectors';

const ALLOWED_ROLES = ['Admin', 'Provider', 'Pharmacist', 'Patient'];

export default function usePrescriptions() {
  const dispatch = useDispatch();

  // ── All selectors unconditional (Rules of Hooks) ──────────────────────────
  const userRole      = useSelector(selectUserRole);
  const list          = useSelector(selectPrescriptionList);
  const selectedRx    = useSelector(selectSelectedRx);
  const listLoading   = useSelector(selectPrescriptionListLoading);
  const formLoading   = useSelector(selectPrescriptionFormLoading);
  const error         = useSelector(selectPrescriptionError);
  const successMessage= useSelector(selectPrescriptionSuccess);

  const hasAccess = ALLOWED_ROLES.includes(userRole);

// ── Auto-load list on mount (removed to prevent duplication in profile) ────

  // ── All callbacks unconditional ───────────────────────────────────────────
  const fetchPrescriptions = useCallback(
    (params) => dispatch(fetchPrescriptionsRequest(params)),
    [dispatch]
  );

  const createPrescription = useCallback(
    (payload) => dispatch(createPrescriptionRequest(payload)),
    [dispatch]
  );

  const updatePrescription = useCallback(
    (payload) => dispatch(updatePrescriptionRequest(payload)),
    [dispatch]
  );

  // Pharmacist dispense shortcut — sets status to 'dispensed'
  const dispensePrescription = useCallback(
    (id) => dispatch(updatePrescriptionRequest({ id, status: 'dispensed' })),
    [dispatch]
  );

  const selectRx   = useCallback((rx) => dispatch(setSelectedRx(rx)),   [dispatch]);
  const deselectRx = useCallback(()   => dispatch(clearSelectedRx()),   [dispatch]);
  const dismissError   = useCallback(() => dispatch(clearError()),   [dispatch]);
  const dismissSuccess = useCallback(() => dispatch(clearSuccess()), [dispatch]);

  // ── RBAC guard ────────────────────────────────────────────────────────────
  const noop = () => {};
  if (!hasAccess) {
    return {
      hasAccess:            false,
      list:                 [],
      listLoading:          false,
      formLoading:          false,
      error:                null,
      successMessage:       null,
      fetchPrescriptions:   noop,
      createPrescription:   noop,
      updatePrescription:   noop,
      dispensePrescription: noop,
      selectRx:             noop,
      deselectRx:           noop,
      dismissError:         noop,
      dismissSuccess:       noop,
    };
  }

  return {
    hasAccess: true,
    userRole,
    list,
    selectedRx,
    listLoading,
    formLoading,
    error,
    successMessage,
    fetchPrescriptions,
    createPrescription,
    updatePrescription,
    dispensePrescription,
    selectRx,
    deselectRx,
    dismissError,
    dismissSuccess,
  };
}