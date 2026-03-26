import { call, put, takeLatest, takeEvery, select } from 'redux-saga/effects';

import {
  fetchUsersAPI, fetchAllUsersAPI, fetchUserByIdAPI,
  createUserAPI, updateUserAPI, deleteUserAPI,
  toggleUserStatusAPI, fetchRolesAPI, fetchDepartmentsAPI,
  fetchProvidersAPI,
} from './userAPI';

import {
  fetchUsersRequest,       fetchUsersSuccess,       fetchUsersFailure,
  fetchAllUsersRequest,    fetchAllUsersSuccess,     fetchAllUsersFailure,
  fetchUserRequest,        fetchUserSuccess,         fetchUserFailure,
  createUserRequest,       createUserSuccess,        createUserFailure,
  updateUserRequest,       updateUserSuccess,        updateUserFailure,
  deleteUserRequest,       deleteUserSuccess,        deleteUserFailure,
  toggleUserStatusRequest, toggleUserStatusSuccess,  toggleUserStatusFailure,
  fetchRolesRequest,       fetchRolesSuccess,        fetchRolesFailure,
  fetchDepartmentsRequest, fetchDepartmentsSuccess,  fetchDepartmentsFailure,
  fetchProvidersRequest,   fetchProvidersSuccess,    fetchProvidersFailure,
} from './userSlice';

const extractMessage = (error, fallback = 'An error occurred.') =>
  error?.response?.data?.message ||
  error?.response?.data?.error   ||
  error?.message                 ||
  fallback;

// ── 1. Fetch Staff List (table) ───────────────────────────────────────────────
function* handleFetchUsers(action) {
  try {
    const filters  = yield select((state) => state.users.filters);
    const params   = { ...filters, ...(action.payload ?? {}) };
    const response = yield call(fetchUsersAPI, params);
    // fetchUsersAPI returns response.data (axios-unwrapped):
    //   { message, data: { staff: [...], pagination: {...} } }
    // So the actual payload is one level deeper at .data
    const payload  = response?.data ?? response;
    yield put(
      fetchUsersSuccess({
        staff:      payload.staff      ?? payload.users ?? [],
        pagination: payload.pagination ?? {
          total: 0, page: params.page ?? 1,
          per_page: params.per_page ?? 20, total_pages: 0,
        },
      })
    );
  } catch (error) {
    yield put(fetchUsersFailure(extractMessage(error, 'Failed to load staff list.')));
  }
}

// ── 2. Fetch ALL Users (for Add Staff picker dropdown) ────────────────────────
//    GET /api/users  — all registered users in this tenant
function* handleFetchAllUsers(action) {
  try {
    const params   = action.payload ?? { per_page: 100 };
    const response = yield call(fetchAllUsersAPI, params);
    // fetchAllUsersAPI returns response.data (axios-unwrapped):
    //   { message, data: { users: [...], pagination: {...} } }
    // The actual users array is at .data  ← was the bug (missed one level)
    const payload = response?.data ?? response;
    const users   = payload.users ?? payload.staff ?? [];
    yield put(fetchAllUsersSuccess(users));
  } catch (error) {
    yield put(fetchAllUsersFailure(extractMessage(error, 'Failed to load users.')));
  }
}

// ── 2b. Fetch Providers (for Appointment booking dropdown) ───────────────────
//    GET /api/users/providers
function* handleFetchProviders() {
  try {
    const response  = yield call(fetchProvidersAPI, {});
    const payload   = response?.data ?? response;
    const providers = payload.providers ?? [];
    yield put(fetchProvidersSuccess(providers));
  } catch (error) {
    yield put(fetchProvidersFailure(extractMessage(error, 'Failed to load providers.')));
  }
}

// ── 3. Fetch Single Staff Member ──────────────────────────────────────────────
function* handleFetchUser(action) {
  try {
    const response = yield call(fetchUserByIdAPI, action.payload);
    const data     = response?.data ?? response;
    yield put(fetchUserSuccess(data));
  } catch (error) {
    yield put(fetchUserFailure(extractMessage(error, 'Failed to load staff record.')));
  }
}

// ── 4. Create Staff Member ────────────────────────────────────────────────────
function* handleCreateUser(action) {
  try {
    const response = yield call(createUserAPI, action.payload);
    const data     = response?.data ?? response;
    yield put(createUserSuccess(data));
    // Refresh list so the new member appears immediately
    const filters = yield select((state) => state.users.filters);
    yield put(fetchUsersRequest({ ...filters, page: 1 }));
  } catch (error) {
    yield put(createUserFailure(extractMessage(error, 'Failed to create staff record.')));
  }
}

// ── 5. Update Staff Member ────────────────────────────────────────────────────
function* handleUpdateUser(action) {
  try {
    const { id, ...data } = action.payload;
    const response        = yield call(updateUserAPI, id, data);
    const updated         = response?.data ?? response;
    yield put(updateUserSuccess(updated));
  } catch (error) {
    yield put(updateUserFailure(extractMessage(error, 'Failed to update staff record.')));
  }
}

// ── 6. Delete Staff Member ────────────────────────────────────────────────────
function* handleDeleteUser(action) {
  try {
    yield call(deleteUserAPI, action.payload);
    yield put(deleteUserSuccess(action.payload));
  } catch (error) {
    yield put(deleteUserFailure(extractMessage(error, 'Failed to remove staff record.')));
  }
}

// ── 7. Toggle Active / Inactive ───────────────────────────────────────────────
function* handleToggleStatus(action) {
  try {
    const { id, currentStatus } = action.payload;
    const response              = yield call(toggleUserStatusAPI, id, currentStatus);
    const updated               = response?.data ?? response;
    yield put(toggleUserStatusSuccess(updated));
  } catch (error) {
    yield put(toggleUserStatusFailure(extractMessage(error, 'Failed to update staff status.')));
  }
}

// ── 8. Fetch Roles ────────────────────────────────────────────────────────────
function* handleFetchRoles() {
  try {
    const response = yield call(fetchRolesAPI);
    const roles    = response?.data?.roles ?? response?.roles ?? [];
    yield put(fetchRolesSuccess(roles));
  } catch (error) {
    yield put(fetchRolesFailure(extractMessage(error, 'Failed to load roles.')));
  }
}

// ── 9. Fetch Departments ──────────────────────────────────────────────────────
function* handleFetchDepartments() {
  try {
    const response    = yield call(fetchDepartmentsAPI);
    const departments = response?.data?.departments ?? response?.departments ?? [];
    yield put(fetchDepartmentsSuccess(departments));
  } catch (error) {
    yield put(fetchDepartmentsFailure(extractMessage(error, 'Failed to load departments.')));
  }
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function* userSaga() {
  yield takeLatest(fetchUsersRequest.type,        handleFetchUsers);
  yield takeLatest(fetchAllUsersRequest.type,     handleFetchAllUsers);
  yield takeLatest(fetchProvidersRequest.type,    handleFetchProviders);
  yield takeLatest(fetchUserRequest.type,         handleFetchUser);
  yield takeLatest(createUserRequest.type,        handleCreateUser);
  yield takeLatest(updateUserRequest.type,        handleUpdateUser);
  yield takeEvery(deleteUserRequest.type,         handleDeleteUser);
  yield takeEvery(toggleUserStatusRequest.type,   handleToggleStatus);
  yield takeLatest(fetchRolesRequest.type,        handleFetchRoles);
  yield takeLatest(fetchDepartmentsRequest.type,  handleFetchDepartments);
}