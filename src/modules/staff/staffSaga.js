import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchAllRolesAPI, fetchAllPermissionsAPI, fetchStaffByRoleAPI,
  assignRoleAPI, activateStaffAPI, deactivateStaffAPI,
} from './staffAPI';
import {
  fetchRolesRequest,   fetchRolesSuccess,   fetchRolesFailure,
  fetchPermissionsRequest, fetchPermissionsSuccess, fetchPermissionsFailure,
  assignRoleRequest,   assignRoleSuccess,   assignRoleFailure,
  activateStaffRequest, activateStaffSuccess, activateStaffFailure,
  deactivateStaffRequest, deactivateStaffSuccess, deactivateStaffFailure,
  fetchStaffByRoleRequest, fetchStaffByRoleSuccess, fetchStaffByRoleFailure,
} from './staffSlice';

const extractMessage = (error, fallback = 'An error occurred.') =>
  error.response?.data?.message || error.response?.data?.error || error.message || fallback;

function* handleFetchRoles() {
  try {
    const response    = yield call(fetchAllRolesAPI);
    const payloadData = response?.data || response;
    yield put(fetchRolesSuccess(payloadData.roles ?? payloadData));
  } catch (error) {
    yield put(fetchRolesFailure(extractMessage(error, 'Failed to load roles.')));
  }
}

function* handleFetchPermissions() {
  try {
    const response    = yield call(fetchAllPermissionsAPI);
    const payloadData = response?.data || response;
    const roles       = payloadData.roles ?? [];
    const allPerms    = roles.flatMap((r) => r.permissions ?? []);
    const uniquePerms = Array.from(
      new Map(allPerms.map((p) => [p.permission_key ?? p.id, p])).values()
    );
    yield put(fetchPermissionsSuccess(uniquePerms));
  } catch (error) {
    yield put(fetchPermissionsFailure(extractMessage(error, 'Failed to load permissions.')));
  }
}

function* handleFetchStaffByRole(action) {
  try {
    const { role_id, ...params } = action.payload;
    const response               = yield call(fetchStaffByRoleAPI, role_id, params);
    const payloadData            = response?.data || response;
    yield put(fetchStaffByRoleSuccess({
      role_id,
      staff: payloadData.staff ?? payloadData.users ?? [],
    }));
  } catch (error) {
    yield put(fetchStaffByRoleFailure(extractMessage(error, 'Failed to load staff for this role.')));
  }
}

function* handleAssignRole(action) {
  try {
    const { staffId, roleId } = action.payload;
    const response            = yield call(assignRoleAPI, staffId, roleId);
    const payloadData         = response?.data || response;
    yield put(assignRoleSuccess(payloadData));
    yield put(fetchStaffByRoleRequest({ role_id: roleId }));
  } catch (error) {
    yield put(assignRoleFailure(extractMessage(error, 'Failed to assign role.')));
  }
}

function* handleActivateStaff(action) {
  try {
    const response    = yield call(activateStaffAPI, action.payload);
    const payloadData = response?.data || response;
    yield put(activateStaffSuccess(payloadData));
  } catch (error) {
    yield put(activateStaffFailure(extractMessage(error, 'Failed to activate staff member.')));
  }
}

function* handleDeactivateStaff(action) {
  try {
    const response    = yield call(deactivateStaffAPI, action.payload);
    const payloadData = response?.data || response;
    yield put(deactivateStaffSuccess(payloadData));
  } catch (error) {
    yield put(deactivateStaffFailure(extractMessage(error, 'Failed to deactivate staff member.')));
  }
}

export default function* staffSaga() {
  yield takeLatest(fetchRolesRequest.type,       handleFetchRoles);
  yield takeLatest(fetchPermissionsRequest.type, handleFetchPermissions);
  yield takeLatest(fetchStaffByRoleRequest.type, handleFetchStaffByRole);
  yield takeLatest(assignRoleRequest.type,       handleAssignRole);
  yield takeLatest(activateStaffRequest.type,    handleActivateStaff);
  yield takeLatest(deactivateStaffRequest.type,  handleDeactivateStaff);
}