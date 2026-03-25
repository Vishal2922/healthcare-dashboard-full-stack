/**
 * store.js  (UPDATED — adds offline reducer and offlineSaga)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from original:
 *   • offlineReducer added to reducer map
 *   • offlineSaga added to rootSaga (see rootSaga.js)
 */

import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import authReducer         from '../modules/auth/authSlice';
import userReducer         from '../modules/users/userSlice';
import staffReducer        from '../modules/staff/staffSlice';
import appointmentReducer  from '../modules/appointments/appointmentSlice';
import patientReducer      from '../modules/patients/patientSlice';
import prescriptionReducer from '../modules/prescriptions/prescriptionSlice';
import billingReducer      from '../modules/billing/billingSlice';
import chatReducer         from '../modules/chat/chatSlice';
import notificationReducer from '../modules/notifications/notificationSlice';
import communicationReducer from '../modules/communication/communicationSlice';

// ── NEW ───────────────────────────────────────────────────────────────────────
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
    // ── NEW ──────────────────────────────────────────────────────────────────
    offline:       offlineReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default store;