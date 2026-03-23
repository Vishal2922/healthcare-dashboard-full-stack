import { createSlice } from '@reduxjs/toolkit';

/**
 * chatSlice — Module 10: Communication (Notes & Internal Messaging)
 *
 * State shape:
 *   notes              → decrypted notes for the currently viewed appointment
 *   history            → paginated note history (reverse chronological)
 *   historyMeta        → { total, page, per_page, total_pages }
 *   currentAppointmentId → appointment whose notes are currently loaded
 *
 *   sendLoading        → spinner on send button
 *   notesLoading       → skeleton while loading notes list
 *   historyLoading     → skeleton while loading history panel
 *   deleteLoading      → { [noteId]: true } per-note delete spinner
 *
 *   error              → last error string
 *   successMessage     → shown in toast/alert after CUD action
 */

const initialState = {
  notes: [],
  history: [],
  historyMeta: {
    total: 0,
    page: 1,
    per_page: 20,
    total_pages: 0,
  },
  currentAppointmentId: null,

  sendLoading:    false,
  notesLoading:   false,
  historyLoading: false,
  deleteLoading:  {},   // { [noteId]: true }

  error:          null,
  successMessage: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,

  reducers: {

    // ── Fetch Notes for an Appointment ───────────────────────────────────────
    fetchNotesRequest: (state, action) => {
      state.notesLoading          = true;
      state.error                 = null;
      state.currentAppointmentId  = action.payload?.appointmentId ?? null;
    },
    fetchNotesSuccess: (state, action) => {
      state.notes        = action.payload;
      state.notesLoading = false;
    },
    fetchNotesFailure: (state, action) => {
      state.notesLoading = false;
      state.error        = action.payload;
    },

    // ── Fetch Paginated History ──────────────────────────────────────────────
    fetchHistoryRequest: (state) => {
      state.historyLoading = true;
      state.error          = null;
    },
    fetchHistorySuccess: (state, action) => {
      state.history        = action.payload.notes;
      state.historyMeta    = action.payload.pagination;
      state.historyLoading = false;
    },
    fetchHistoryFailure: (state, action) => {
      state.historyLoading = false;
      state.error          = action.payload;
    },

    // ── Send (Create) Note ───────────────────────────────────────────────────
    sendNoteRequest: (state) => {
      state.sendLoading   = true;
      state.error         = null;
      state.successMessage = null;
    },
    sendNoteSuccess: (state, action) => {
      state.sendLoading    = false;
      state.successMessage = 'Note sent successfully.';
      // Append new note to the live notes list (chronological order)
      state.notes.push(action.payload);
      // Also prepend to history if loaded (reverse chronological)
      if (state.history.length > 0) {
        state.history.unshift(action.payload);
        state.historyMeta.total += 1;
      }
    },
    sendNoteFailure: (state, action) => {
      state.sendLoading = false;
      state.error       = action.payload;
    },

    // ── Delete (Soft Delete) Note ────────────────────────────────────────────
    deleteNoteRequest: (state, action) => {
      state.deleteLoading[action.payload] = true;
      state.error                         = null;
      state.successMessage                = null;
    },
    deleteNoteSuccess: (state, action) => {
      const noteId = action.payload;
      delete state.deleteLoading[noteId];
      state.successMessage = 'Note deleted.';
      state.notes   = state.notes.filter((n) => n.id !== noteId);
      state.history = state.history.filter((n) => n.id !== noteId);
      if (state.historyMeta.total > 0) state.historyMeta.total -= 1;
    },
    deleteNoteFailure: (state, action) => {
      const { noteId, message } = action.payload;
      delete state.deleteLoading[noteId];
      state.error = message;
    },

    // ── UI Helpers ───────────────────────────────────────────────────────────
    setCurrentAppointment: (state, action) => {
      state.currentAppointmentId = action.payload;
      // Clear stale notes when switching appointments
      state.notes   = [];
      state.history = [];
      state.historyMeta = initialState.historyMeta;
    },
    clearNotes:   (state) => { state.notes = []; },
    clearSuccess: (state) => { state.successMessage = null; },
    clearError:   (state) => { state.error = null; },
    resetChat:    ()      => initialState,
  },
});

export const {
  fetchNotesRequest,
  fetchNotesSuccess,
  fetchNotesFailure,
  fetchHistoryRequest,
  fetchHistorySuccess,
  fetchHistoryFailure,
  sendNoteRequest,
  sendNoteSuccess,
  sendNoteFailure,
  deleteNoteRequest,
  deleteNoteSuccess,
  deleteNoteFailure,
  setCurrentAppointment,
  clearNotes,
  clearSuccess,
  clearError,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;