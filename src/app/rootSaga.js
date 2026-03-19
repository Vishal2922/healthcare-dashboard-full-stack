import { all } from 'redux-saga/effects';
import authSaga  from '../modules/auth/authSaga';
import userSaga  from '../modules/users/userSaga';
import staffSaga from '../modules/staff/staffSaga';

export default function* rootSaga() {
  yield all([
    authSaga(),
    userSaga(),
    staffSaga(),
    // tenantSaga(),
    // patientSaga(),
    // appointmentSaga(),
    // billingSaga(),
    // notificationSaga(),
  ]);
}