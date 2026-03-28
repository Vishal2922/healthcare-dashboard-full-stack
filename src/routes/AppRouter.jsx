/**
 * AppRouter.jsx
 *
 * Changes from original:
 *   1. Destructure { warningVisible, secondsLeft, extendSession } from useIdleLogout
 *   2. Render <IdleWarningModal> above <Routes> so it's always on top
 *   3. Added /settings/security route for Admin
 *
 * Idle logout flow:
 *   5 min idle → warning modal (60s countdown)
 *   → no action → dispatch(logoutRequest()) → authSaga → POST /api/auth/logout
 *   → tokens cleared → /login redirect
 */

import { Suspense, lazy, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsLoggedIn, selectAuthInitialized } from '../modules/auth/selectors';
import { logoutRequest } from '../modules/auth/authSlice';
import useIdleLogout from '../hooks/useIdleLogout';
import IdleWarningModal from '../components/IdleWarningModal';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';
import LoginPage from '../pages/Auth/LoginPage';

const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
const PatientList = lazy(() => import('../pages/Patients/PatientList'));
const PatientProfile = lazy(() => import('../pages/Patients/PatientProfile'));
const AppointmentList = lazy(() => import('../pages/Appointments/AppointmentList'));
const AppointmentCalendar = lazy(() => import('../pages/Appointments/AppointmentCalendar'));
const InvoicePage = lazy(() => import('../pages/Billing/InvoicePage'));
const StaffManagement = lazy(() => import('../pages/Staff/StaffManagement'));
const UserManagement = lazy(() => import('../pages/Settings/UserManagement'));
const SecuritySettings = lazy(() => import('../pages/Settings/SecuritySettings'));
const ProfileSettings = lazy(() => import('../pages/Settings/ProfileSettings'));
const ThemeSettings = lazy(() => import('../pages/Settings/ThemeSettings'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const PrescriptionList = lazy(() => import('../pages/Prescriptions/PrescriptionList'));

const PageLoader = () => (
  <div style={{
    height: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, color: '#7a8694', background: '#f7f5f0',
  }}>
    Loading…
  </div>
);

export default function AppRouter() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const initialized = useSelector(selectAuthInitialized);

  useEffect(() => {
    dispatch({ type: 'auth/sessionCheck' });
  }, [dispatch]);

  // ── Idle logout ───────────────────────────────────────────────────────────
  // warningVisible : show the modal when idle for (timeout - 60s)
  // secondsLeft    : countdown from 60 → 0
  // extendSession  : resets the idle timer (Stay Logged In button)
  const { warningVisible, secondsLeft, extendSession } = useIdleLogout(isLoggedIn);

  // "Logout Now" button in modal → immediate logout
  const handleLogoutNow = useCallback(() => {
    dispatch(logoutRequest()); // → authSaga → POST /api/auth/logout
  }, [dispatch]);

  if (!initialized) return <PageLoader />;

  return (
    <>
      {/* Idle warning modal — outside Routes so it always renders on top */}
      <IdleWarningModal
        visible={warningVisible}
        secondsLeft={secondsLeft}
        onExtend={extendSession}
        onLogout={handleLogoutNow}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public Routes */}
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>

            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Patients */}
            <Route element={<RoleBasedRoute roles={['Admin', 'Provider', 'Nurse', 'Receptionist']} />}>
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/:id" element={<PatientProfile />} />
            </Route>

            {/* Appointments */}
            <Route element={<RoleBasedRoute roles={['Admin', 'Provider', 'Nurse', 'Patient']} />}>
              <Route path="/appointments" element={<AppointmentList />} />
            </Route>

            {/* Calendar */}
            <Route element={<RoleBasedRoute roles={['Admin', 'Provider', 'Receptionist']} />}>
              <Route path="/appointments/calendar" element={<AppointmentCalendar />} />
            </Route>

            {/* Prescriptions */}
            <Route element={<RoleBasedRoute roles={['Admin', 'Provider', 'Pharmacist', 'Patient']} />}>
              <Route path="/prescriptions" element={<PrescriptionList />} />
            </Route>

            {/* Billing */}
            <Route element={<RoleBasedRoute roles={['Receptionist', 'Patient']} />}>
              <Route path="/billing" element={<InvoicePage />} />
            </Route>

            {/* Staff */}
            <Route element={<RoleBasedRoute roles={['Admin']} />}>
              <Route path="/settings/staff" element={<StaffManagement />} />
            </Route>

            {/* Settings */}
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route element={<RoleBasedRoute roles={['Admin']} />}>
              <Route path="/settings/users" element={<UserManagement />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
              <Route path="/settings/theme" element={<ThemeSettings />} />
            </Route>

          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />

        </Routes>
      </Suspense>
    </>);
}