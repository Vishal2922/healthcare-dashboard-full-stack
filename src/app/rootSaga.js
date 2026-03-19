import { all } from 'redux-saga/effects';
import authSaga from '../modules/auth/authSaga';
import appointmentSaga from '../modules/appointments/appointmentSaga';
import patientSaga from '../modules/patients/patientSaga';

export default function* rootSaga() {
  yield all([
    authSaga(),
    appointmentSaga(),
    patientSaga(),
  ]);
}
