import { all } from 'redux-saga/effects';
import authSaga        from '../modules/auth/authSaga';
import appointmentSaga from '../modules/appointments/appointmentSaga';

export default function* rootSaga() {
  yield all([
    authSaga(),
    appointmentSaga(),
    // Future sagas plug in here
  ]);
}