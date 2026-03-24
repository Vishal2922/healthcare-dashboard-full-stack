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
import { Routes, Route, Navigate }                from 'react-router-dom';
import { useDispatch, useSelector }               from 'react-redux';
import { selectIsLoggedIn, selectAuthInitialized } from '../modules/auth/selectors';
import { logoutRequest }                           from '../modules/auth/authSlice';
import useIdleLogout                               from '../hooks/useIdleLogout';
import IdleWarningModal                            from '../components/IdleWarningModal';
import ProtectedRoute  from './ProtectedRoute';
import RoleBasedRoute  from './RoleBasedRoute';
import LoginPage       from '../pages/Auth/LoginPage';

const DashboardPage       = lazy(() => import('../pages/Dashboard/DashboardPage'));
const PatientList         = lazy(() => import('../pages/Patients/PatientList'));
const PatientProfile      = lazy(() => import('../pages/Patients/PatientProfile'));
const AppointmentList     = lazy(() => import('../pages/Appointments/AppointmentList'));
const AppointmentCalendar = lazy(() => import('../pages/Appointments/AppointmentCalendar'));
const InvoicePage         = lazy(() => import('../pages/Billing/InvoicePage'));
const StaffManagement     = lazy(() => import('../pages/Staff/StaffManagement'));
const UserManagement      = lazy(() => import('../pages/Settings/UserManagement'));
const SecuritySettings    = lazy(() => import('../pages/Settings/SecuritySettings'));
const ThemeSettings       = lazy(() => import('../pages/Settings/ThemeSettings'));
const ForgotPassword      = lazy(() => import('../pages/Auth/ForgotPassword'));
const PrescriptionList    = lazy(() => import('../pages/Prescriptions/PrescriptionList'));

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
  const dispatch    = useDispatch();
  const isLoggedIn  = useSelector(selectIsLoggedIn);
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

          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<ProtectedRoute />}>

            {/* Dashboard — Admin, Provider, Pharmacist */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Module 8: Patients — Admin, Provider, Nurse, Receptionist */}
            <Route element={<RoleBasedRoute roles={['Admin', 'Provider', 'Nurse', 'Receptionist']} />}>
              <Route path="/patients"     element={<PatientList />} />
              <Route path="/patients/:id" element={<PatientProfile />} />
            </Route>

            {/* Module 9: Appointments — Provider, Nurse */}
            <Route element={<RoleBasedRoute roles={['Provider', 'Nurse']} />}>
              <Route path="/appointments" element={<AppointmentList />} />
            </Route>

            {/* Module 12: Calendar — Receptionist */}
            <Route element={<RoleBasedRoute roles={['Receptionist']} />}>
              <Route path="/appointments/calendar" element={<AppointmentCalendar />} />
            </Route>

            {/* Module 5: Prescriptions — Provider, Pharmacist, Admin */}
            <Route element={<RoleBasedRoute roles={['Admin', 'Provider', 'Pharmacist']} />}>
              <Route path="/prescriptions" element={<PrescriptionList />} />
            </Route>

            {/* Module 11: Billing — Admin */}
            <Route element={<RoleBasedRoute roles={['Admin']} />}>
              <Route path="/billing" element={<InvoicePage />} />
            </Route>

            {/* Module 6: Staff — Admin only */}
            <Route element={<RoleBasedRoute roles={['Admin']} />}>
              <Route path="/staff" element={<StaffManagement />} />
            </Route>

            {/* Settings — Admin only */}
            <Route element={<RoleBasedRoute roles={['Admin']} />}>
              <Route path="/settings/users"    element={<UserManagement />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
            </Route>

          </Route>

          <Route path="/"  element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
          <Route path="*"  element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />

          {/* Module 12: Calendar — Receptionist, Admin */}
          <Route element={<RoleBasedRoute roles={['Receptionist', 'Admin']} />}>
            <Route path="/appointments/calendar" element={<AppointmentCalendar />} />
          </Route>

          {/* Module 5: Prescriptions — Provider, Pharmacist, Admin */}
          <Route element={<RoleBasedRoute roles={['Admin', 'Provider', 'Pharmacist']} />}>
            <Route path="/prescriptions" element={<PrescriptionList />} />
          </Route>

          {/* Module 11: Billing — Admin */}
          <Route element={<RoleBasedRoute roles={['Admin']} />}>
            <Route path="/billing" element={<InvoicePage />} />
          </Route>

          {/* Module 6: Staff — Admin only */}
          <Route element={<RoleBasedRoute roles={['Admin']} />}>
            <Route path="/settings/staff" element={<StaffManagement />} />
          </Route>

          {/* Settings — Admin only */}
          <Route element={<RoleBasedRoute roles={['Admin']} />}>
            <Route path="/settings/users" element={<UserManagement />} />
          </Route>

          <Route element={<RoleBasedRoute roles={['Admin']} />}>
            <Route path="/settings/theme" element={<ThemeSettings />} />
          </Route>

        </Route>

        <Route path="/"  element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
        <Route path="*"  element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />

      </Routes>
    </Suspense>
  );
}