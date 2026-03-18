import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer        from '../modules/auth/authSlice';
import appointmentReducer from '../modules/appointments/appointmentSlice';
import rootSaga           from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    auth:         authReducer,
    appointments: appointmentReducer,
    // Future modules plug in here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default store;