/**
 * staffSlice.js  (UPDATED — adds createStaffMember + updateStaffMember)
 * ─────────────────────────────────────────────────────────────────────────────
 * Delta: adds create/update staff reducers + offline indicators
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roles:       [],
  permissions: [],
  selectedRole: null,
  staffByRole:  {},
  loading:      false,
  submitting:   false,
  error:        null,
  successMessage: null,

  // ── Offline ────────────────────────────────────────────────────────────────
  isOnline:   true,
  isFlushing: false,
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,

  reducers: {

    fetchRolesRequest: (state) => { state.loading = true; state.error = null; },
    fetchRolesSuccess: (state, action) => { state.roles = action.payload; state.loading = false; },
    fetchRolesFailure: (state, action) => { state.loading = false; state.error = action.payload; },

    fetchRoleRequest: (state) => { state.loading = true; state.selectedRole = null; state.error = null; },
    fetchRoleSuccess: (state, action) => { state.selectedRole = action.payload; state.loading = false; },
    fetchRoleFailure: (state, action) => { state.loading = false; state.error = action.payload; },

    fetchPermissionsRequest: (state) => { state.error = null; },
    fetchPermissionsSuccess: (state, action) => { state.permissions = action.payload; },
    fetchPermissionsFailure: (state, action) => { state.error = action.payload; },

    assignRoleRequest: (state) => { state.submitting = true; state.error = null; },
    assignRoleSuccess: (state) => { state.submitting = false; },
    assignRoleFailure: (state, action) => { state.submitting = false; state.error = action.payload; },

    activateStaffRequest: (state) => { state.submitting = true; state.error = null; },
    activateStaffSuccess: (state, action) => {
      state.submitting = false;
      const updated = action.payload;
      Object.keys(state.staffByRole).forEach((roleId) => {
        state.staffByRole[roleId] = state.staffByRole[roleId].map((s) =>
          s.id === updated.id ? updated : s
        );
      });
    },
    activateStaffFailure: (state, action) => { state.submitting = false; state.error = action.payload; },

    deactivateStaffRequest: (state) => { state.submitting = true; state.error = null; },
    deactivateStaffSuccess: (state, action) => {
      state.submitting = false;
      const updated = action.payload;
      Object.keys(state.staffByRole).forEach((roleId) => {
        state.staffByRole[roleId] = state.staffByRole[roleId].map((s) =>
          s.id === updated.id ? updated : s
        );
      });
    },
    deactivateStaffFailure: (state, action) => { state.submitting = false; state.error = action.payload; },

    fetchStaffByRoleRequest: (state) => { state.loading = true; state.error = null; },
    fetchStaffByRoleSuccess: (state, action) => {
      state.loading = false;
      state.staffByRole[action.payload.role_id] = action.payload.staff;
    },
    fetchStaffByRoleFailure: (state, action) => { state.loading = false; state.error = action.payload; },

    // ── NEW: Create Staff Member ──────────────────────────────────────────────
    createStaffMemberRequest: (state) => {
      state.submitting     = true;
      state.error          = null;
      state.successMessage = null;
    },
    createStaffMemberSuccess: (state, action) => {
      state.submitting     = false;
      state.successMessage = 'Staff member added successfully.';
      // Add to the appropriate role bucket
      const staff  = action.payload?.staff ?? action.payload?.user ?? action.payload;
      const roleId = staff?.role_id;
      if (roleId && state.staffByRole[roleId]) {
        state.staffByRole[roleId].unshift(staff);
      }
    },
    createStaffMemberFailure: (state, action) => {
      state.submitting = false;
      state.error      = action.payload;
    },

    // ── NEW: Update Staff Member ──────────────────────────────────────────────
    updateStaffMemberRequest: (state) => {
      state.submitting     = true;
      state.error          = null;
      state.successMessage = null;
    },
    updateStaffMemberSuccess: (state, action) => {
      state.submitting     = false;
      state.successMessage = 'Staff member updated.';
      const updated = action.payload?.staff ?? action.payload?.user ?? action.payload;
      Object.keys(state.staffByRole).forEach((roleId) => {
        state.staffByRole[roleId] = state.staffByRole[roleId].map((s) =>
          s.id === updated.id ? { ...s, ...updated } : s
        );
      });
    },
    updateStaffMemberFailure: (state, action) => {
      state.submitting = false;
      state.error      = action.payload;
    },

    // ── Offline indicators ────────────────────────────────────────────────────
    setOnlineStatus:   (state, action) => { state.isOnline   = action.payload; },
    setFlushingStatus: (state, action) => { state.isFlushing = action.payload; },

    clearSelectedRole: (state) => { state.selectedRole  = null; },
    clearStaffError:   (state) => { state.error         = null; },
    clearStaffSuccess: (state) => { state.successMessage = null; },
  },
});

export const {
  fetchRolesRequest, fetchRolesSuccess, fetchRolesFailure,
  fetchRoleRequest,  fetchRoleSuccess,  fetchRoleFailure,
  fetchPermissionsRequest, fetchPermissionsSuccess, fetchPermissionsFailure,
  assignRoleRequest,    assignRoleSuccess,    assignRoleFailure,
  activateStaffRequest, activateStaffSuccess, activateStaffFailure,
  deactivateStaffRequest, deactivateStaffSuccess, deactivateStaffFailure,
  fetchStaffByRoleRequest, fetchStaffByRoleSuccess, fetchStaffByRoleFailure,
  createStaffMemberRequest, createStaffMemberSuccess, createStaffMemberFailure,
  updateStaffMemberRequest, updateStaffMemberSuccess, updateStaffMemberFailure,
  setOnlineStatus, setFlushingStatus,
  clearSelectedRole, clearStaffError, clearStaffSuccess,
} = staffSlice.actions;

export default staffSlice.reducer;