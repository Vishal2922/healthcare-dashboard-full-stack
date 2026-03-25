/**
 * staffSaga.js  (UPDATED — Offline Queue for Create Staff)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes:
 *   • handleCreateStaffMember — NEW: routes through global offlineSlice when offline
 *   • handleUpdateStaffMember — NEW: routes through global offlineSlice when offline
 *   • All other handlers unchanged from original
 *
 * NOTE: The staff module uses /api/staff + /api/users API.
 * For offline create, we need a createStaffMemberAPI (see staffAPI additions below).
 */

import { call, put, select, takeLatest, all } from 'redux-saga/effects';
import { v4 as uuidv4 } from 'uuid';

import {
  fetchAllRolesAPI, fetchAllPermissionsAPI, fetchStaffByRoleAPI,
  assignRoleAPI, activateStaffAPI, deactivateStaffAPI,
  createStaffMemberAPI, updateStaffMemberAPI,
} from './staffAPI';

import {
  fetchRolesRequest,       fetchRolesSuccess,       fetchRolesFailure,
  fetchPermissionsRequest, fetchPermissionsSuccess, fetchPermissionsFailure,
  assignRoleRequest,       assignRoleSuccess,       assignRoleFailure,
  activateStaffRequest,    activateStaffSuccess,    activateStaffFailure,
  deactivateStaffRequest,  deactivateStaffSuccess,  deactivateStaffFailure,
  fetchStaffByRoleRequest, fetchStaffByRoleSuccess, fetchStaffByRoleFailure,
  // NEW
  createStaffMemberRequest, createStaffMemberSuccess, createStaffMemberFailure,
  updateStaffMemberRequest, updateStaffMemberSuccess, updateStaffMemberFailure,
} from './staffSlice';

import { enqueueAction, selectIsOnline } from '../offline/offlineSlice';

const extractMessage = (error, fallback = 'An error occurred.') =>
  error.response?.data?.message || error.response?.data?.error || error.message || fallback;

// ── Fetch Roles ───────────────────────────────────────────────────────────────
function* handleFetchRoles() {
  try {
    const response    = yield call(fetchAllRolesAPI);
    const payloadData = response?.data || response;
    yield put(fetchRolesSuccess(payloadData.roles ?? payloadData));
  } catch (error) {
    yield put(fetchRolesFailure(extractMessage(error, 'Failed to load roles.')));
  }
}

// ── Fetch Permissions ─────────────────────────────────────────────────────────
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

// ── Fetch Staff By Role ───────────────────────────────────────────────────────
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

// ── Assign Role ───────────────────────────────────────────────────────────────
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

// ── Activate Staff ────────────────────────────────────────────────────────────
function* handleActivateStaff(action) {
  try {
    const response    = yield call(activateStaffAPI, action.payload);
    const payloadData = response?.data || response;
    yield put(activateStaffSuccess(payloadData));
  } catch (error) {
    yield put(activateStaffFailure(extractMessage(error, 'Failed to activate staff member.')));
  }
}

// ── Deactivate Staff ──────────────────────────────────────────────────────────
function* handleDeactivateStaff(action) {
  try {
    const response    = yield call(deactivateStaffAPI, action.payload);
    const payloadData = response?.data || response;
    yield put(deactivateStaffSuccess(payloadData));
  } catch (error) {
    yield put(deactivateStaffFailure(extractMessage(error, 'Failed to deactivate staff member.')));
  }
}

// ── Create Staff Member (NEW — with offline support) ──────────────────────────
function* handleCreateStaffMember(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'staff',
      type:      'create',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
    }));
    yield put(createStaffMemberFailure(
      'You are offline. This staff member will be added when reconnected.'
    ));
    return;
  }

  try {
    const response    = yield call(createStaffMemberAPI, action.payload);
    const payloadData = response?.data || response;
    yield put(createStaffMemberSuccess(payloadData));
    // Refresh the list for the relevant role
    if (action.payload.role_id) {
      yield put(fetchStaffByRoleRequest({ role_id: action.payload.role_id }));
    }
  } catch (error) {
    yield put(createStaffMemberFailure(extractMessage(error, 'Failed to create staff member.')));
  }
}

// ── Update Staff Member (NEW — with offline support) ──────────────────────────
function* handleUpdateStaffMember(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'staff',
      type:      'update',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
    }));
    yield put(updateStaffMemberFailure(
      'You are offline. This update will sync when reconnected.'
    ));
    return;
  }

  try {
    const response    = yield call(updateStaffMemberAPI, action.payload);
    const payloadData = response?.data || response;
    yield put(updateStaffMemberSuccess(payloadData));
  } catch (error) {
    yield put(updateStaffMemberFailure(extractMessage(error, 'Failed to update staff member.')));
  }
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function* staffSaga() {
  yield all([
    takeLatest(fetchRolesRequest.type,         handleFetchRoles),
    takeLatest(fetchPermissionsRequest.type,   handleFetchPermissions),
    takeLatest(fetchStaffByRoleRequest.type,   handleFetchStaffByRole),
    takeLatest(assignRoleRequest.type,         handleAssignRole),
    takeLatest(activateStaffRequest.type,      handleActivateStaff),
    takeLatest(deactivateStaffRequest.type,    handleDeactivateStaff),
    takeLatest(createStaffMemberRequest.type,  handleCreateStaffMember),
    takeLatest(updateStaffMemberRequest.type,  handleUpdateStaffMember),
  ]);
}