/**
 * rootSaga.js  —  UPDATED for Module 8
 *
 * Changes vs your current file:
 *   + import patientSaga from '../modules/patients/patientSaga';
 *   + patientSaga()   inside all([...])
 */
import { all }       from 'redux-saga/effects';
import authSaga      from '../modules/auth/authSaga';
import patientSaga   from '../modules/patients/patientSaga'; // ← NEW (Module 8)

export default function* rootSaga() {
  yield all([
    authSaga(),
    patientSaga(),   // ← NEW
    // staffSaga(),  ← teammate adds for Module 7
    // appointmentSaga(),
    // billingSaga(),
    // notificationSaga(),
  ]);
}
