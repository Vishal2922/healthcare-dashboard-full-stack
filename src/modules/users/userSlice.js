import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  users: [],
  pagination: {
    total: 0,
    page: 1,
    per_page: 20,
    total_pages: 0,
  },
  filters: {
    page: 1,
    per_page: 20,
    status: '',
    role_id: '',
    department: '',
    search: '',
  },
  selectedUser: null,
  roles: [],
  departments: [],
  loading: false,
  submitting: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {

    fetchUsersRequest: (state, action) => {
      state.loading = true;
      state.error = null;
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

    createUserRequest: (state) => {
      state.submitting = true;
      state.error      = null;
    },
    createUserSuccess: (state, action) => {
      state.submitting = false;
      state.users = [action.payload, ...state.users];
      state.pagination.total += 1;
    },
    createUserFailure: (state, action) => {
      state.submitting = false;
      state.error      = action.payload;
    },

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

    deleteUserRequest: (state) => {
      state.submitting = true;
      state.error      = null;
    },
    deleteUserSuccess: (state, action) => {
      state.submitting = false;
      state.users = state.users.filter((u) => u.id !== action.payload);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
    },
    deleteUserFailure: (state, action) => {
      state.submitting = false;
      state.error      = action.payload;
    },

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

    fetchRolesRequest: (state) => {
      state.error = null;
    },
    fetchRolesSuccess: (state, action) => {
      state.roles = action.payload;
    },
    fetchRolesFailure: (state, action) => {
      state.error = action.payload;
    },

    fetchDepartmentsRequest: (state) => {
      state.error = null;
    },
    fetchDepartmentsSuccess: (state, action) => {
      state.departments = action.payload;
    },
    fetchDepartmentsFailure: (state, action) => {
      state.error = action.payload;
    },

    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    clearUsersError: (state) => {
      state.error = null;
    },
    setUsersPage: (state, action) => {
      state.filters.page = action.payload;
    },
  },
});

export const {
  fetchUsersRequest, fetchUsersSuccess, fetchUsersFailure,
  fetchUserRequest,  fetchUserSuccess,  fetchUserFailure,
  createUserRequest, createUserSuccess, createUserFailure,
  updateUserRequest, updateUserSuccess, updateUserFailure,
  deleteUserRequest, deleteUserSuccess, deleteUserFailure,
  toggleUserStatusRequest, toggleUserStatusSuccess, toggleUserStatusFailure,
  fetchRolesRequest, fetchRolesSuccess, fetchRolesFailure,
  fetchDepartmentsRequest, fetchDepartmentsSuccess, fetchDepartmentsFailure,
  clearSelectedUser, clearUsersError, setUsersPage,
} = userSlice.actions;

export default userSlice.reducer;