import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  fetchAppointmentsRequest,
  bookAppointmentRequest,
  updateStatusRequest,
  cancelAppointmentRequest,
  checkSlotConflictRequest,
  resetBookingState,
  resetConflictCheck,
  setSelectedAppointment,
  clearAppointmentError,
  setFilterStatus,
  serveFromPrefetchCache,
} from '../appointmentSlice';

export default function useAppointments() {
  const dispatch = useDispatch();

  const {
    list, pagination, selectedAppointment,
    loading, rowLoading, error, filters,
    prefetchedPages, offlineQueue, isOnline,
    isDrainingQueue, conflictCheck,
    bookingLoading, bookingError, bookingSuccess,
  } = useSelector((state) => state.appointments);

  const loadAppointments = useCallback(
    (overrides = {}) => dispatch(fetchAppointmentsRequest(overrides)),
    [dispatch]
  );

  const goToPage = useCallback(
    (page) => {
      if (prefetchedPages[page]) {
        // Instant serve from cache, then revalidate in background
        dispatch(serveFromPrefetchCache({ page }));
        dispatch(fetchAppointmentsRequest({ page }));
      } else {
        dispatch(fetchAppointmentsRequest({ page }));
      }
    },
    [dispatch, prefetchedPages]
  );

  const bookAppointment = useCallback(
    (payload) => dispatch(bookAppointmentRequest(payload)),
    [dispatch]
  );

  const updateStatus = useCallback(
    (id, status) => dispatch(updateStatusRequest({ id, status })),
    [dispatch]
  );

  const cancelAppointment = useCallback(
    (id) => dispatch(cancelAppointmentRequest({ id })),
    [dispatch]
  );

  const checkSlotConflict = useCallback(
    (payload) => dispatch(checkSlotConflictRequest(payload)),
    [dispatch]
  );

  const selectAppointment = useCallback(
    (appt) => dispatch(setSelectedAppointment(appt)),
    [dispatch]
  );

  const clearError = useCallback(
    () => dispatch(clearAppointmentError()),
    [dispatch]
  );

  const resetBooking = useCallback(
    () => dispatch(resetBookingState()),
    [dispatch]
  );

  const resetConflict = useCallback(
    () => dispatch(resetConflictCheck()),
    [dispatch]
  );

  const filterByStatus = useCallback(
    (status) => {
      dispatch(setFilterStatus(status));
      dispatch(fetchAppointmentsRequest({ status, page: 1 }));
    },
    [dispatch]
  );

  const isRowLoading = useCallback(
    (id) => !!rowLoading[id],
    [rowLoading]
  );

  return {
    // State
    list, pagination, selectedAppointment,
    loading, rowLoading, error, filters,
    prefetchedPages,
    offlineQueue, offlineQueueCount: offlineQueue.length,
    isOnline, isDrainingQueue,
    conflictCheck,
    bookingLoading, bookingError, bookingSuccess,
    // Actions
    loadAppointments, goToPage,
    bookAppointment, updateStatus, cancelAppointment,
    checkSlotConflict, selectAppointment,
    clearError, resetBooking, resetConflict, filterByStatus,
    // Derived
    isRowLoading,
  };
}