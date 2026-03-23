import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from '../modules/auth/authSlice';
import userReducer from '../modules/users/userSlice';
import staffReducer from '../modules/staff/staffSlice';
import appointmentReducer from '../modules/appointments/appointmentSlice';
import patientReducer from '../modules/patients/patientSlice';
import billingReducer     from '../modules/billing/billingSlice'; // ← NEW (Module 11)
 

 
// ── NEW: Module 10 & 13 ──────────────────────────────
import chatReducer         from '../modules/chat/chatSlice';
import notificationReducer from '../modules/notifications/notificationSlice';
 
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
    billing:       billingReducer,
    // notifications: notificationReducer,
    
    appointments: appointmentReducer,
    patients: patientReducer,
  
    
    
    // ── NEW ───────────────────────────────────────────
    chat:          chatReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});
 
sagaMiddleware.run(rootSaga);
 
export default store;