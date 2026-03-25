/**
 * rootSaga.js  (UPDATED — adds offlineSaga)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from original:
 *   • offlineSaga added — runs the network watcher, IndexedDB hydration,
 *     and queue flush machinery for all modules
 */

import { all } from 'redux-saga/effects';

import authSaga          from '../modules/auth/authSaga';
import userSaga          from '../modules/users/userSaga';
import staffSaga         from '../modules/staff/staffSaga';
import appointmentSaga   from '../modules/appointments/appointmentSaga';
import patientSaga       from '../modules/patients/patientSaga';
import prescriptionSaga  from '../modules/prescriptions/prescriptionSaga';
import billingSaga       from '../modules/billing/billingSaga';
import chatSaga          from '../modules/chat/chatSaga';
import notificationSaga  from '../modules/notifications/notificationSaga';
import communicationSaga from '../modules/communication/communicationSaga';
import idleSettingsSaga  from '../modules/idleSettings/idleSettingsSaga'; // ← NEW

// ── NEW ───────────────────────────────────────────────────────────────────────
import offlineSaga from '../modules/offline/offlineSaga';

export default function* rootSaga() {
  yield all([
    authSaga(),
    userSaga(),
    staffSaga(),
    appointmentSaga(),
    patientSaga(),
    prescriptionSaga(),
    billingSaga(),
    chatSaga(),
    notificationSaga(),
    communicationSaga(),
    idleSettingsSaga(), // ← NEW
    // ── NEW: boots the network watcher + IndexedDB queue ────────────────────
    offlineSaga(),
  ]);
}