import { call, put, takeLatest, select } from 'redux-saga/effects';
import {
  fetchUsersAPI, fetchUserByIdAPI, createUserAPI,
  updateUserAPI, deleteUserAPI, toggleUserStatusAPI,
  fetchRolesAPI, fetchDepartmentsAPI,
} from './userAPI';
import {
  fetchUsersRequest,   fetchUsersSuccess,   fetchUsersFailure,
  fetchUserRequest,    fetchUserSuccess,     fetchUserFailure,
  createUserRequest,   createUserSuccess,    createUserFailure,
  updateUserRequest,   updateUserSuccess,    updateUserFailure,
  deleteUserRequest,   deleteUserSuccess,    deleteUserFailure,
  toggleUserStatusRequest, toggleUserStatusSuccess, toggleUserStatusFailure,
  fetchRolesRequest,   fetchRolesSuccess,    fetchRolesFailure,
  fetchDepartmentsRequest, fetchDepartmentsSuccess, fetchDepartmentsFailure,
} from './userSlice';

const extractMessage = (error, fallback = 'An error occurred.') =>
  error.response?.data?.message || error.response?.data?.error || error.message || fallback;

function* handleFetchUsers(action) {
  try {
    const filters = yield select((state) => state.users.filters);
    const params  = { ...filters, ...(action.payload ?? {}) };
    const response    = yield call(fetchUsersAPI, params);
    const payloadData = response?.data || response;
    yield put(fetchUsersSuccess(payloadData));
  } catch (error) {
    yield put(fetchUsersFailure(extractMessage(error, 'Failed to load staff list.')));
  }
}

function* handleFetchUser(action) {
  try {
    const response    = yield call(fetchUserByIdAPI, action.payload);
    const payloadData = response?.data || response;
    yield put(fetchUserSuccess(payloadData));
  } catch (error) {
    yield put(fetchUserFailure(extractMessage(error, 'Failed to load staff record.')));
  }
}

function* handleCreateUser(action) {
  try {
    const response    = yield call(createUserAPI, action.payload);
    const payloadData = response?.data || response;
    yield put(createUserSuccess(payloadData));
    const filters = yield select((state) => state.users.filters);
    yield put(fetchUsersRequest(filters));
  } catch (error) {
    yield put(createUserFailure(extractMessage(error, 'Failed to create staff record.')));
  }
}

function* handleUpdateUser(action) {
  try {
    const { id, ...data } = action.payload;
    const response        = yield call(updateUserAPI, id, data);
    const payloadData     = response?.data || response;
    yield put(updateUserSuccess(payloadData));
  } catch (error) {
    yield put(updateUserFailure(extractMessage(error, 'Failed to update staff record.')));
  }
}

function* handleDeleteUser(action) {
  try {
    yield call(deleteUserAPI, action.payload);
    yield put(deleteUserSuccess(action.payload));
  } catch (error) {
    yield put(deleteUserFailure(extractMessage(error, 'Failed to remove staff record.')));
  }
}

function* handleToggleStatus(action) {
  try {
    const { id, currentStatus } = action.payload;
    const response              = yield call(toggleUserStatusAPI, id, currentStatus);
    const payloadData           = response?.data || response;
    yield put(toggleUserStatusSuccess(payloadData));
  } catch (error) {
    yield put(toggleUserStatusFailure(extractMessage(error, 'Failed to update staff status.')));
  }
}

function* handleFetchRoles() {
  try {
    const response    = yield call(fetchRolesAPI);
    const payloadData = response?.data || response;
    yield put(fetchRolesSuccess(payloadData.roles ?? payloadData));
  } catch (error) {
    yield put(fetchRolesFailure(extractMessage(error, 'Failed to load roles.')));
  }
}

function* handleFetchDepartments() {
  try {
    const response    = yield call(fetchDepartmentsAPI);
    const payloadData = response?.data || response;
    yield put(fetchDepartmentsSuccess(payloadData.departments ?? payloadData));
  } catch (error) {
    yield put(fetchDepartmentsFailure(extractMessage(error, 'Failed to load departments.')));
  }
}

export default function* userSaga() {
  yield takeLatest(fetchUsersRequest.type,       handleFetchUsers);
  yield takeLatest(fetchUserRequest.type,        handleFetchUser);
  yield takeLatest(createUserRequest.type,       handleCreateUser);
  yield takeLatest(updateUserRequest.type,       handleUpdateUser);
  yield takeLatest(deleteUserRequest.type,       handleDeleteUser);
  yield takeLatest(toggleUserStatusRequest.type, handleToggleStatus);
  yield takeLatest(fetchRolesRequest.type,       handleFetchRoles);
  yield takeLatest(fetchDepartmentsRequest.type, handleFetchDepartments);
}