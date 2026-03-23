import { all } from 'redux-saga/effects';
 
import authSaga         from '../modules/auth/authSaga';
import userSaga         from '../modules/users/userSaga';
import staffSaga        from '../modules/staff/staffSaga';
import appointmentSaga  from '../modules/appointments/appointmentSaga';
import patientSaga      from '../modules/patients/patientSaga';
 
// ── NEW: Module 10 & 13 ──────────────────────────────
import chatSaga         from '../modules/chat/chatSaga';
import notificationSaga from '../modules/notifications/notificationSaga';
 
export default function* rootSaga() {
  yield all([
    authSaga(),
    userSaga(),
    staffSaga(),
    appointmentSaga(),
    patientSaga(),
    // ── NEW ───────────────────────────────────────────
    chatSaga(),
    notificationSaga(),
  ]);
}
 