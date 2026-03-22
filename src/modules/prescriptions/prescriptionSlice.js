/**
 * prescriptionSlice — Prescription Management Module
 *
 * State shape:
 *   list            → array of prescriptions for current view
 *   selectedRx      → prescription being viewed / edited
 *   listLoading     → table skeleton
 *   formLoading     → drawer submit spinner
 *   error           → last error string
 *   successMessage  → toast message after CUD action
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list:           [],
  selectedRx:     null,
  listLoading:    false,
  formLoading:    false,
  error:          null,
  successMessage: null,
};

const prescriptionSlice = createSlice({
  name: 'prescriptions',
  initialState,

  reducers: {

    // ── Fetch List ────────────────────────────────────────────────────────────
    fetchPrescriptionsRequest: (state) => {
      state.listLoading = true;
      state.error       = null;
    },
    fetchPrescriptionsSuccess: (state, action) => {
      state.list        = action.payload;
      state.listLoading = false;
    },
    fetchPrescriptionsFailure: (state, action) => {
      state.listLoading = false;
      state.error       = action.payload;
    },

    // ── Create ────────────────────────────────────────────────────────────────
    createPrescriptionRequest: (state) => {
      state.formLoading = true;
      state.error       = null;
    },
    createPrescriptionSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = action.payload?.message || 'Prescription created successfully.';
      // Backend returns { prescription: {...} } — prepend to list
      const rx = action.payload?.prescription;
      if (rx) {
        state.list = [rx, ...state.list];
      }
    },
    createPrescriptionFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Update (Provider edits / Pharmacist dispenses) ────────────────────────
    updatePrescriptionRequest: (state) => {
      state.formLoading = true;
      state.error       = null;
    },
    updatePrescriptionSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = action.payload?.message || 'Prescription updated.';
      // Patch the item in list if we have an id
      const { id, status } = action.payload ?? {};
      if (id) {
        state.list = state.list.map((rx) =>
          rx.id === id ? { ...rx, status, ...action.payload } : rx
        );
      }
    },
    updatePrescriptionFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── UI helpers ────────────────────────────────────────────────────────────
    setSelectedRx:   (state, action) => { state.selectedRx     = action.payload; },
    clearSelectedRx: (state)         => { state.selectedRx     = null; },
    clearError:      (state)         => { state.error          = null; },
    clearSuccess:    (state)         => { state.successMessage  = null; },
  },
});

export const {
  fetchPrescriptionsRequest,
  fetchPrescriptionsSuccess,
  fetchPrescriptionsFailure,
  createPrescriptionRequest,
  createPrescriptionSuccess,
  createPrescriptionFailure,
  updatePrescriptionRequest,
  updatePrescriptionSuccess,
  updatePrescriptionFailure,
  setSelectedRx,
  clearSelectedRx,
  clearError,
  clearSuccess,
} = prescriptionSlice.actions;

export default prescriptionSlice.reducer;