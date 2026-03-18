<<<<<<< HEAD
import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer        from '../modules/auth/authSlice';
import appointmentReducer from '../modules/appointments/appointmentSlice';
import rootSaga           from './rootSaga';
=======
/**
 * store.js  —  UPDATED for Module 8
 *
 * Changes vs your current file:
 *   + import patientReducer from '../modules/patients/patientSlice';
 *   + patients: patientReducer   inside the reducer map
 *
 * Everything else is identical to your existing store.js.
 */
import { configureStore }    from '@reduxjs/toolkit';
import createSagaMiddleware  from 'redux-saga';

import authReducer    from '../modules/auth/authSlice';
import patientReducer from '../modules/patients/patientSlice'; // ← NEW (Module 8)

import rootSaga from './rootSaga';
>>>>>>> origin/develope

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
<<<<<<< HEAD
    auth:         authReducer,
    appointments: appointmentReducer,
    // Future modules plug in here
=======
    auth:     authReducer,
    patients: patientReducer, // ← NEW
    // staff:    staffReducer,   ← added when teammate wires Module 7
    // tenant, appointments, billing, notifications → future modules
>>>>>>> origin/develope
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default store;
