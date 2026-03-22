/**
 * prescriptionSaga — Prescription Module
 *
 * Saga workers:
 *   handleFetchPrescriptions  → GET list
 *   handleCreatePrescription  → POST create
 *   handleUpdatePrescription  → PUT update / dispense
 */
import { call, put, takeLatest } from 'redux-saga/effects';

import {
  fetchPrescriptionsAPI,
  createPrescriptionAPI,
  updatePrescriptionAPI,
} from './prescriptionAPI';

import {
  fetchPrescriptionsRequest,
  fetchPrescriptionsSuccess,
  fetchPrescriptionsFailure,
  createPrescriptionRequest,
  createPrescriptionSuccess,
  createPrescriptionFailure,
  updatePrescriptionRequest,
  updatePrescriptionSuccess,
  updatePrescriptionFailure,
} from './prescriptionSlice';

// ── Error message extractor ───────────────────────────────────────────────────
const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// ════════════════════════════════════════════════════════════════════════════
// 1. FETCH PRESCRIPTIONS
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchPrescriptions(action) {
  try {
    const data = yield call(fetchPrescriptionsAPI, action.payload ?? {});
    // Backend may return array or { data: [...] }
    const list = Array.isArray(data) ? data : (data?.data ?? data?.prescriptions ?? []);
    yield put(fetchPrescriptionsSuccess(list));
  } catch (error) {
    yield put(fetchPrescriptionsFailure(errMsg(error, 'Failed to load prescriptions.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. CREATE PRESCRIPTION
// ════════════════════════════════════════════════════════════════════════════
function* handleCreatePrescription(action) {
  try {
    const data = yield call(createPrescriptionAPI, action.payload);
    yield put(createPrescriptionSuccess(data));
    // Refresh list after create
    yield put(fetchPrescriptionsRequest());
  } catch (error) {
    yield put(createPrescriptionFailure(errMsg(error, 'Failed to create prescription.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3. UPDATE PRESCRIPTION (edit / dispense)
// ════════════════════════════════════════════════════════════════════════════
function* handleUpdatePrescription(action) {
  try {
    const data = yield call(updatePrescriptionAPI, action.payload);
    yield put(updatePrescriptionSuccess({
      ...data,
      id:      action.payload.id,
      status:  action.payload.status,
      message: data?.message || 'Prescription updated successfully.',
    }));
    // Refresh list to get server-confirmed state
    yield put(fetchPrescriptionsRequest());
  } catch (error) {
    yield put(updatePrescriptionFailure(errMsg(error, 'Failed to update prescription.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT WATCHER
// ════════════════════════════════════════════════════════════════════════════
export default function* prescriptionSaga() {
  yield takeLatest(fetchPrescriptionsRequest.type,  handleFetchPrescriptions);
  yield takeLatest(createPrescriptionRequest.type,  handleCreatePrescription);
  yield takeLatest(updatePrescriptionRequest.type,  handleUpdatePrescription);
}