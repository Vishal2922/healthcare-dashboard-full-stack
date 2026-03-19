import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';

import {
  fetchPatientsRequest,
  fetchPatientByIdRequest,
  createPatientRequest,
  updatePatientRequest,
  deletePatientRequest,
  prefetchPatientsMetaRequest,
  setSelectedPatient,
  clearSelectedPatient,
  setFilters,
  resetFilters,
  clearSuccess,
  clearError,
} from '../patientSlice';

import {
  selectPatientList,
  selectSelectedPatient,
  selectPatientMeta,
  selectPatientFilters,
  selectPatientListLoading,
  selectPatientDetailLoading,
  selectPatientFormLoading,
  selectPatientPrefetched,
  selectPatientError,
  selectPatientSuccess,
  selectPatientOfflineQueue,
  selectPatientIsOnline,
  selectPatientIsFlushing,
} from '../selectors';

import { selectUserRole, selectIsAdmin } from '../../auth/selectors';

const ALLOWED_ROLES = ['Admin', 'Provider', 'Nurse', 'Receptionist'];

/**
 * usePatients() — Module 8
 *
 * ALL hooks called unconditionally at top (Rules of Hooks).
 * RBAC guard is at the BOTTOM — only affects return value.
 */
export default function usePatients() {
  const dispatch = useDispatch();

  // ── All selectors unconditional ────────────────────────────────────────────
  const userRole        = useSelector(selectUserRole);
  const isAdmin         = useSelector(selectIsAdmin);
  const patientList     = useSelector(selectPatientList);
  const selectedPatient = useSelector(selectSelectedPatient);
  const meta            = useSelector(selectPatientMeta);
  const filters         = useSelector(selectPatientFilters);
  const listLoading     = useSelector(selectPatientListLoading);
  const detailLoading   = useSelector(selectPatientDetailLoading);
  const formLoading     = useSelector(selectPatientFormLoading);
  const prefetched      = useSelector(selectPatientPrefetched);
  const error           = useSelector(selectPatientError);
  const successMessage  = useSelector(selectPatientSuccess);
  const offlineQueue    = useSelector(selectPatientOfflineQueue);
  const isOnline        = useSelector(selectPatientIsOnline);
  const isFlushing      = useSelector(selectPatientIsFlushing);

  const hasAccess = ALLOWED_ROLES.includes(userRole);

  // ── useEffect unconditional — guarded internally ───────────────────────────
  useEffect(() => {
    if (!hasAccess) return;
    if (!prefetched) {
      dispatch(prefetchPatientsMetaRequest());
    }
  }, [dispatch, prefetched, hasAccess]);

  // ── All useCallbacks unconditional ─────────────────────────────────────────
  const fetchPatients = useCallback(
    (params = {}) => dispatch(fetchPatientsRequest(params)),
    [dispatch]
  );
  const fetchPatientById = useCallback(
    (id) => dispatch(fetchPatientByIdRequest(id)),
    [dispatch]
  );
  const createPatient = useCallback(
    (payload) => dispatch(createPatientRequest(payload)),
    [dispatch]
  );
  const updatePatient = useCallback(
    (payload) => dispatch(updatePatientRequest(payload)),
    [dispatch]
  );
  const deletePatient = useCallback(
    (id) => { if (!isAdmin) return; dispatch(deletePatientRequest(id)); },
    [dispatch, isAdmin]
  );
  const selectPatient      = useCallback((p) => dispatch(setSelectedPatient(p)), [dispatch]);
  const clearPatient       = useCallback(() => dispatch(clearSelectedPatient()),  [dispatch]);
  const applyFilters       = useCallback((f) => dispatch(setFilters(f)),          [dispatch]);
  const clearFiltersAction = useCallback(() => dispatch(resetFilters()),          [dispatch]);
  const dismissSuccess     = useCallback(() => dispatch(clearSuccess()),          [dispatch]);
  const dismissError       = useCallback(() => dispatch(clearError()),            [dispatch]);

  // ── RBAC guard — AFTER all hooks ───────────────────────────────────────────
  if (!hasAccess) {
    return { accessDenied: true, userRole };
  }

  return {
    patientList, selectedPatient, meta, filters,
    listLoading, detailLoading, formLoading,
    error, successMessage,
    offlineQueue, pendingCount: offlineQueue.length, isOnline, isFlushing,
    accessDenied: false, canDelete: isAdmin, userRole,
    fetchPatients, fetchPatientById, createPatient, updatePatient, deletePatient,
    selectPatient, clearPatient, applyFilters, clearFilters: clearFiltersAction,
    dismissSuccess, dismissError,
  };
}
