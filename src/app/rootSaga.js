import { all } from 'redux-saga/effects';

import authSaga         from '../modules/auth/authSaga';
import userSaga         from '../modules/users/userSaga';
import staffSaga        from '../modules/staff/staffSaga';
import appointmentSaga  from '../modules/appointments/appointmentSaga';
import patientSaga      from '../modules/patients/patientSaga';
import prescriptionSaga from '../modules/prescriptions/prescriptionSaga';

export default function* rootSaga() {
  yield all([
    authSaga(),
    userSaga(),
    staffSaga(),
    appointmentSaga(),
    patientSaga(),
    prescriptionSaga(),
  ]);
}