import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roles: [],
  permissions: [],
  selectedRole: null,
  staffByRole: {},
  loading: false,
  submitting: false,
  error: null,
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

    clearSelectedRole: (state) => { state.selectedRole = null; },
    clearStaffError:   (state) => { state.error = null; },
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
  clearSelectedRole, clearStaffError,
} = staffSlice.actions;

export default staffSlice.reducer;