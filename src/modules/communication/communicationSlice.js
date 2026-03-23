import { createSlice } from '@reduxjs/toolkit';

/**
 * communicationSlice — Module 7: Communication Notes
 *
 * State shape:
 *   notes           → array of decrypted notes for current appointment
 *   history         → paginated note history
 *   pagination      → { total, page, per_page, total_pages }
 *
 *   loading         → fetching notes list
 *   createLoading   → creating a note
 *   historyLoading  → fetching history
 *   deleteLoading   → { [noteId]: true }
 *
 *   error           → last error message
 *   successMessage  → toast after action
 */

const initialState = {
  notes:          [],
  history:        [],
  pagination: {
    total:       0,
    page:        1,
    per_page:    20,
    total_pages: 0,
  },

  loading:        false,
  createLoading:  false,
  historyLoading: false,
  deleteLoading:  {},

  error:          null,
  successMessage: null,
};

const communicationSlice = createSlice({
  name: 'communication',
  initialState,

  reducers: {

    // ── Fetch Notes ────────────────────────────────────────────────────────────
    fetchNotesRequest: (state) => {
      state.loading = true;
      state.error   = null;
    },
    fetchNotesSuccess: (state, action) => {
      state.notes   = action.payload;
      state.loading = false;
    },
    fetchNotesFailure: (state, action) => {
      state.loading = false;
      state.error   = action.payload;
    },

    // ── Create Note ────────────────────────────────────────────────────────────
    createNoteRequest: (state) => {
      state.createLoading = true;
      state.error         = null;
      state.successMessage = null;
    },
    createNoteSuccess: (state, action) => {
      state.createLoading  = false;
      state.successMessage = 'Note created successfully.';
      // Append the newly created note
      state.notes.push(action.payload);
    },
    createNoteFailure: (state, action) => {
      state.createLoading = false;
      state.error         = action.payload;
    },

    // ── Fetch Note History ─────────────────────────────────────────────────────
    fetchNoteHistoryRequest: (state) => {
      state.historyLoading = true;
      state.error          = null;
    },
    fetchNoteHistorySuccess: (state, action) => {
      state.historyLoading = false;
      state.history        = action.payload.notes ?? [];
      state.pagination     = action.payload.pagination ?? state.pagination;
    },
    fetchNoteHistoryFailure: (state, action) => {
      state.historyLoading = false;
      state.error          = action.payload;
    },

    // ── Delete Note ────────────────────────────────────────────────────────────
    deleteNoteRequest: (state, action) => {
      state.deleteLoading[action.payload] = true;
      state.error                         = null;
    },
    deleteNoteSuccess: (state, action) => {
      const id = action.payload;
      delete state.deleteLoading[id];
      state.notes          = state.notes.filter((n) => n.id !== id);
      state.history        = state.history.filter((n) => n.id !== id);
      state.successMessage = 'Note deleted successfully.';
    },
    deleteNoteFailure: (state, action) => {
      const { id, message } = action.payload;
      delete state.deleteLoading[id];
      state.error = message;
    },

    // ── UI Helpers ─────────────────────────────────────────────────────────────
    clearSuccess:       (state) => { state.successMessage = null; },
    clearError:         (state) => { state.error = null; },
    resetCommunication: ()      => initialState,
  },
});

export const {
  fetchNotesRequest,
  fetchNotesSuccess,
  fetchNotesFailure,
  createNoteRequest,
  createNoteSuccess,
  createNoteFailure,
  fetchNoteHistoryRequest,
  fetchNoteHistorySuccess,
  fetchNoteHistoryFailure,
  deleteNoteRequest,
  deleteNoteSuccess,
  deleteNoteFailure,
  clearSuccess,
  clearError,
  resetCommunication,
} = communicationSlice.actions;

export default communicationSlice.reducer;
