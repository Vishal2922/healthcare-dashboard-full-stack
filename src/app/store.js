import { configureStore }     from '@reduxjs/toolkit';
import createSagaMiddleware   from 'redux-saga';

import authReducer          from '../modules/auth/authSlice';
import userReducer          from '../modules/users/userSlice';
import staffReducer         from '../modules/staff/staffSlice';
import appointmentReducer   from '../modules/appointments/appointmentSlice';
import patientReducer       from '../modules/patients/patientSlice';
import prescriptionReducer  from '../modules/prescriptions/prescriptionSlice';
import billingReducer       from '../modules/billing/billingSlice';
import chatReducer          from '../modules/chat/chatSlice';
import notificationReducer  from '../modules/notifications/notificationSlice';
import communicationReducer from '../modules/communication/communicationSlice';
import idleSettingsReducer  from '../modules/idleSettings/idleSettingsSlice'; // ← NEW

import offlineReducer from '../modules/offline/offlineSlice';

import rootSaga from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    auth:          authReducer,
    users:         userReducer,
    staff:         staffReducer,
    appointments:  appointmentReducer,
    patients:      patientReducer,
    prescriptions: prescriptionReducer,
    billing:       billingReducer,
    chat:          chatReducer,
    notifications: notificationReducer,
    communication: communicationReducer,
    idleSettings:  idleSettingsReducer, // ← NEW
    // ── NEW ──────────────────────────────────────────────────────────────────
    offline:       offlineReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default store;