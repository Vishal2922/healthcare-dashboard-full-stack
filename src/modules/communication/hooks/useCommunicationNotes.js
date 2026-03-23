import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';

import {
  fetchNotesRequest,
  createNoteRequest,
  fetchNoteHistoryRequest,
  deleteNoteRequest,
  clearSuccess,
  clearError,
  resetCommunication,
} from '../communicationSlice';

/**
 * useCommunicationNotes() — Module 7
 *
 * Available to Provider and Nurse roles.
 *
 * Usage:
 *   const comm = useCommunicationNotes();
 *   comm.loadNotes(appointmentId);
 *   comm.sendNote({ appointmentId, message: '...', note_type: 'clinical' });
 *   comm.loadHistory({ appointmentId, page: 1 });
 *   comm.removeNote(noteId);
 *
 * Does NOT auto-load — the caller must provide an appointmentId.
 */
export default function useCommunicationNotes() {
  const dispatch = useDispatch();

  // ── All selectors unconditional ──────────────────────────────────────────
  const notes          = useSelector((s) => s.communication.notes);
  const history        = useSelector((s) => s.communication.history);
  const pagination     = useSelector((s) => s.communication.pagination);
  const loading        = useSelector((s) => s.communication.loading);
  const createLoading  = useSelector((s) => s.communication.createLoading);
  const historyLoading = useSelector((s) => s.communication.historyLoading);
  const deleteLoading  = useSelector((s) => s.communication.deleteLoading);
  const error          = useSelector((s) => s.communication.error);
  const successMsg     = useSelector((s) => s.communication.successMessage);

  // ── Actions ──────────────────────────────────────────────────────────────
  const loadNotes = useCallback(
    (appointmentId) => dispatch(fetchNotesRequest(appointmentId)),
    [dispatch]
  );

  const sendNote = useCallback(
    ({ appointmentId, message, note_type, visible_to_role }) =>
      dispatch(createNoteRequest({ appointmentId, message, note_type, visible_to_role })),
    [dispatch]
  );

  const loadHistory = useCallback(
    ({ appointmentId, page = 1, per_page = 20 } = {}) =>
      dispatch(fetchNoteHistoryRequest({ appointmentId, page, per_page })),
    [dispatch]
  );

  const removeNote = useCallback(
    (noteId) => dispatch(deleteNoteRequest(noteId)),
    [dispatch]
  );

  const dismissSuccess = useCallback(() => dispatch(clearSuccess()), [dispatch]);
  const dismissError   = useCallback(() => dispatch(clearError()),   [dispatch]);
  const resetState     = useCallback(() => dispatch(resetCommunication()), [dispatch]);

  // Derived helpers
  const isDeleting = useCallback((id) => !!deleteLoading[id], [deleteLoading]);

  return {
    // State
    notes,
    history,
    pagination,
    loading,
    createLoading,
    historyLoading,
    deleteLoading,
    error,
    successMessage: successMsg,
    // Actions
    loadNotes,
    sendNote,
    loadHistory,
    removeNote,
    dismissSuccess,
    dismissError,
    resetState,
    // Derived
    isDeleting,
    noteCount: notes.length,
  };
}
