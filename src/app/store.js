import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from '../modules/auth/authSlice';
import userReducer from '../modules/users/userSlice';
import staffReducer from '../modules/staff/staffSlice';
import appointmentReducer from '../modules/appointments/appointmentSlice';
import patientReducer from '../modules/patients/patientSlice';
import rootSaga from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    auth:  authReducer,
    users: userReducer,
    staff: staffReducer,
    // tenant:        tenantReducer,
    // patients:      patientReducer,
    // appointments:  appointmentReducer,
    // billing:       billingReducer,
    // notifications: notificationReducer,
    auth: authReducer,
    appointments: appointmentReducer,
    patients: patientReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default store;
