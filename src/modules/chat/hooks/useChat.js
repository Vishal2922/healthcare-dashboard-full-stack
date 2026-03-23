import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';

import {
  fetchNotesRequest,
  fetchHistoryRequest,
  sendNoteRequest,
  deleteNoteRequest,
  setCurrentAppointment,
  clearNotes,
  clearSuccess,
  clearError,
  resetChat,
} from '../chatSlice';

import { selectUserRole } from '../../auth/selectors';

// Roles allowed to use the communication module (mirrors backend middleware)
const ALLOWED_ROLES = ['Provider', 'Nurse', 'Admin'];

/**
 * useChat(appointmentId?) — Module 10
 *
 * Provides notes CRUD + history for a given appointment.
 *
 * Usage:
 *   const chat = useChat(appointmentId);
 *   chat.sendNote({ message: 'Patient is improving', note_type: 'clinical' });
 *   chat.deleteNote(noteId);
 *   chat.loadHistory({ page: 2 });
 *
 * All hooks are called unconditionally (Rules of Hooks).
 * RBAC guard is at the bottom — only affects return value.
 */
export default function useChat(appointmentId = null) {
  const dispatch = useDispatch();

  // ── All selectors unconditional ──────────────────────────────────────────
  const userRole      = useSelector(selectUserRole);
  const notes         = useSelector((s) => s.chat.notes);
  const history       = useSelector((s) => s.chat.history);
  const historyMeta   = useSelector((s) => s.chat.historyMeta);
  const currentApptId = useSelector((s) => s.chat.currentAppointmentId);
  const sendLoading   = useSelector((s) => s.chat.sendLoading);
  const notesLoading  = useSelector((s) => s.chat.notesLoading);
  const histLoading   = useSelector((s) => s.chat.historyLoading);
  const deleteLoading = useSelector((s) => s.chat.deleteLoading);
  const error         = useSelector((s) => s.chat.error);
  const successMsg    = useSelector((s) => s.chat.successMessage);

  const hasAccess = ALLOWED_ROLES.includes(userRole);

  // ── Auto-load notes when appointmentId changes ───────────────────────────
  useEffect(() => {
    if (!hasAccess || !appointmentId) return;
    dispatch(setCurrentAppointment(appointmentId));
    dispatch(fetchNotesRequest({ appointmentId }));
  }, [dispatch, appointmentId, hasAccess]);

  // ── All useCallbacks unconditional ───────────────────────────────────────
  const loadNotes = useCallback(
    (apptId) =>
      dispatch(fetchNotesRequest({ appointmentId: apptId ?? appointmentId })),
    [dispatch, appointmentId]
  );

  const loadHistory = useCallback(
    ({ page = 1, per_page = 20 } = {}) =>
      dispatch(
        fetchHistoryRequest({
          appointmentId: appointmentId ?? currentApptId,
          page,
          per_page,
        })
      ),
    [dispatch, appointmentId, currentApptId]
  );

  const sendNote = useCallback(
    ({ message, note_type = 'note', visible_to_role } = {}) => {
      if (!message?.trim()) return;
      dispatch(
        sendNoteRequest({
          appointmentId: appointmentId ?? currentApptId,
          message:       message.trim(),
          note_type,
          visible_to_role,
        })
      );
    },
    [dispatch, appointmentId, currentApptId]
  );

  const deleteNote = useCallback(
    (noteId) => dispatch(deleteNoteRequest(noteId)),
    [dispatch]
  );

  const setAppointment = useCallback(
    (apptId) => dispatch(setCurrentAppointment(apptId)),
    [dispatch]
  );

  const clearNotesAction   = useCallback(() => dispatch(clearNotes()),   [dispatch]);
  const dismissSuccess     = useCallback(() => dispatch(clearSuccess()), [dispatch]);
  const dismissError       = useCallback(() => dispatch(clearError()),   [dispatch]);
  const resetChatState     = useCallback(() => dispatch(resetChat()),    [dispatch]);

  // Helper: is a specific note being deleted?
  const isNoteDeleting = useCallback(
    (noteId) => !!deleteLoading[noteId],
    [deleteLoading]
  );

  // ── RBAC guard — AFTER all hooks ─────────────────────────────────────────
  if (!hasAccess) {
    return { accessDenied: true, userRole };
  }

  return {
    // State
    notes,
    history,
    historyMeta,
    currentAppointmentId: currentApptId,
    sendLoading,
    notesLoading,
    historyLoading: histLoading,
    deleteLoading,
    error,
    successMessage: successMsg,
    accessDenied:   false,
    userRole,
    // Actions
    loadNotes,
    loadHistory,
    sendNote,
    deleteNote,
    setAppointment,
    clearNotes:   clearNotesAction,
    dismissSuccess,
    dismissError,
    resetChat:    resetChatState,
    // Derived
    isNoteDeleting,
    noteCount: notes.length,
  };
}