import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer         from '../modules/auth/authSlice';
import userReducer         from '../modules/users/userSlice';
import staffReducer        from '../modules/staff/staffSlice';
import appointmentReducer  from '../modules/appointments/appointmentSlice';
import patientReducer      from '../modules/patients/patientSlice';
import prescriptionReducer from '../modules/prescriptions/prescriptionSlice';
import billingReducer     from '../modules/billing/billingSlice'; // ← NEW (Module 11)
import chatReducer         from '../modules/chat/chatSlice';
import notificationReducer from '../modules/notifications/notificationSlice';
import communicationReducer from '../modules/communication/communicationSlice';
 
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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});
 
sagaMiddleware.run(rootSaga);

export default store;