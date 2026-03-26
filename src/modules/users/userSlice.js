import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Staff table (linked users with staff records)
  users: [],
  pagination: {
    total:       0,
    page:        1,
    per_page:    20,
    total_pages: 0,
  },
  filters: {
    page:       1,
    per_page:   20,
    status:     '',
    role_id:    '',
    department: '',
    search:     '',
  },
  selectedUser: null,

  // All registered users in this tenant (for "Add Staff" picker dropdown)
  // Fetched from GET /api/users — independent of staff list
  allUsers: [],
  allUsersLoading: false,

  providers: [],
  providersLoading: false,

  roles:       [],
  departments: [],

  loading:     false,
  submitting:  false,
  error:       null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,

  reducers: {

    // ── Staff List ────────────────────────────────────────────────────────────
    fetchUsersRequest: (state, action) => {
      state.loading = true;
      state.error   = null;
      if (action.payload) state.filters = { ...state.filters, ...action.payload };
    },
    fetchUsersSuccess: (state, action) => {
      state.users      = action.payload.staff ?? action.payload.users ?? [];
      state.pagination = action.payload.pagination ?? state.pagination;
      state.loading    = false;
    },
    fetchUsersFailure: (state, action) => {
      state.loading = false;
      state.error   = action.payload;
    },

    // ── All Users (for picker dropdown in Add Staff modal) ───────────────────
    fetchAllUsersRequest: (state) => {
      state.allUsersLoading = true;
      state.error           = null;
    },
    fetchAllUsersSuccess: (state, action) => {
      state.allUsers        = action.payload;
      state.allUsersLoading = false;
    },
    fetchAllUsersFailure: (state, action) => {
      state.allUsersLoading = false;
      state.error           = action.payload;
    },

    // ── Providers (for patient appointment booking) ───────────────────────────
    fetchProvidersRequest: (state) => {
      state.providersLoading = true;
      state.error            = null;
    },
    fetchProvidersSuccess: (state, action) => {
      state.providers        = action.payload;
      state.providersLoading = false;
    },
    fetchProvidersFailure: (state, action) => {
      state.providersLoading = false;
      state.error            = action.payload;
    },

    // ── Single Staff Record ───────────────────────────────────────────────────
    fetchUserRequest: (state) => {
      state.loading      = true;
      state.selectedUser = null;
      state.error        = null;
    },
    fetchUserSuccess: (state, action) => {
      state.selectedUser = action.payload;
      state.loading      = false;
    },
    fetchUserFailure: (state, action) => {
      state.loading = false;
      state.error   = action.payload;
    },

    // ── Create ────────────────────────────────────────────────────────────────
    createUserRequest: (state) => {
      state.submitting = true;
      state.error      = null;
    },
    createUserSuccess: (state, action) => {
      state.submitting = false;
      // Prepend if the payload is a staff object
      if (action.payload?.id) {
        state.users = [action.payload, ...state.users];
        state.pagination.total += 1;
      }
    },
    createUserFailure: (state, action) => {
      state.submitting = false;
      state.error      = action.payload;
    },

    // ── Update ────────────────────────────────────────────────────────────────
    updateUserRequest: (state) => {
      state.submitting = true;
      state.error      = null;
    },
    updateUserSuccess: (state, action) => {
      state.submitting = false;
      state.users = state.users.map((u) =>
        u.id === action.payload.id ? action.payload : u
      );
      if (state.selectedUser?.id === action.payload.id) {
        state.selectedUser = action.payload;
      }
    },
    updateUserFailure: (state, action) => {
      state.submitting = false;
      state.error      = action.payload;
    },

    // ── Delete ────────────────────────────────────────────────────────────────
    deleteUserRequest: (state) => {
      state.submitting = true;
      state.error      = null;
    },
    deleteUserSuccess: (state, action) => {
      state.submitting       = false;
      state.users            = state.users.filter((u) => u.id !== action.payload);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
    },
    deleteUserFailure: (state, action) => {
      state.submitting = false;
      state.error      = action.payload;
    },

    // ── Toggle Status ─────────────────────────────────────────────────────────
    toggleUserStatusRequest: (state) => {
      state.submitting = true;
      state.error      = null;
    },
    toggleUserStatusSuccess: (state, action) => {
      state.submitting = false;
      state.users = state.users.map((u) =>
        u.id === action.payload.id ? action.payload : u
      );
    },
    toggleUserStatusFailure: (state, action) => {
      state.submitting = false;
      state.error      = action.payload;
    },

    // ── Roles ─────────────────────────────────────────────────────────────────
    fetchRolesRequest:   (state) => { state.error = null; },
    fetchRolesSuccess:   (state, action) => { state.roles = action.payload; },
    fetchRolesFailure:   (state, action) => { state.error = action.payload; },

    // ── Departments ───────────────────────────────────────────────────────────
    fetchDepartmentsRequest: (state) => { state.error = null; },
    fetchDepartmentsSuccess: (state, action) => { state.departments = action.payload; },
    fetchDepartmentsFailure: (state, action) => { state.error = action.payload; },

    // ── UI Helpers ────────────────────────────────────────────────────────────
    clearSelectedUser: (state) => { state.selectedUser = null; },
    clearUsersError:   (state) => { state.error = null; },
    setUsersPage: (state, action) => { state.filters.page = action.payload; },
  },
});

export const {
  fetchUsersRequest,       fetchUsersSuccess,       fetchUsersFailure,
  fetchAllUsersRequest,    fetchAllUsersSuccess,     fetchAllUsersFailure,
  fetchProvidersRequest,   fetchProvidersSuccess,    fetchProvidersFailure,
  fetchUserRequest,        fetchUserSuccess,         fetchUserFailure,
  createUserRequest,       createUserSuccess,        createUserFailure,
  updateUserRequest,       updateUserSuccess,        updateUserFailure,
  deleteUserRequest,       deleteUserSuccess,        deleteUserFailure,
  toggleUserStatusRequest, toggleUserStatusSuccess,  toggleUserStatusFailure,
  fetchRolesRequest,       fetchRolesSuccess,        fetchRolesFailure,
  fetchDepartmentsRequest, fetchDepartmentsSuccess,  fetchDepartmentsFailure,
  clearSelectedUser, clearUsersError, setUsersPage,
} = userSlice.actions;

export default userSlice.reducer;