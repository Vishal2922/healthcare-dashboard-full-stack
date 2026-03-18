import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsLoggedIn, selectAuthInitialized } from '../modules/auth/selectors';
import useIdleLogout from '../hooks/useIdleLogout';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';
import LoginPage from '../pages/Auth/LoginPage';

const DashboardPage       = lazy(() => import('../pages/Dashboard/DashboardPage'));
const PatientList         = lazy(() => import('../pages/Patients/PatientList'));
const PatientProfile      = lazy(() => import('../pages/Patients/PatientProfile'));
const AppointmentList     = lazy(() => import('../pages/Appointments/AppointmentList'));
const AppointmentCalendar = lazy(() => import('../pages/Appointments/AppointmentCalendar'));
const InvoicePage         = lazy(() => import('../pages/Billing/InvoicePage'));
const StaffManagement     = lazy(() => import('../pages/Staff/StaffManagement'));
const UserManagement      = lazy(() => import('../pages/Settings/UserManagement'));
const SecuritySettings    = lazy(() => import('../pages/Settings/SecuritySettings'));
const ForgotPassword      = lazy(() => import('../pages/Auth/ForgotPassword'));

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

  // On mount: silently attempt token refresh to restore session from cookie
  useEffect(() => {
    dispatch({ type: 'auth/sessionCheck' });
  }, [dispatch]);

  // Idle logout after 15 minutes of inactivity
  useIdleLogout(isLoggedIn);

  // Block rendering ONLY until the initial session check is done.
  // Once initialized, we never block again — even if isLoggedIn changes.
  if (!initialized) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Public ── */}
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── Protected (any authenticated role) ── */}
        <Route element={<ProtectedRoute />}>

          <Route path="/dashboard" element={<DashboardPage />} />

          <Route element={<RoleBasedRoute roles={['Admin', 'Provider', 'Nurse', 'Receptionist']} />}>
            <Route path="/patients"     element={<PatientList />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
          </Route>

          <Route element={<RoleBasedRoute roles={['Admin', 'Provider', 'Nurse', 'Receptionist']} />}>
            <Route path="/appointments"          element={<AppointmentList />} />
            <Route path="/appointments/calendar" element={<AppointmentCalendar />} />
          </Route>

          <Route element={<RoleBasedRoute roles={['Admin', 'Provider']} />}>
            <Route path="/billing" element={<InvoicePage />} />
          </Route>

          <Route element={<RoleBasedRoute roles={['Admin']} />}>
            <Route path="/staff" element={<StaffManagement />} />
          </Route>

          <Route element={<RoleBasedRoute roles={['Admin']} />}>
            <Route path="/settings/users"    element={<UserManagement />} />
            <Route path="/settings/security" element={<SecuritySettings />} />
          </Route>

        </Route>

        {/* ── Fallback ── */}
        <Route path="/"  element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
        <Route path="*"  element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />

      </Routes>
    </Suspense>
  );
}