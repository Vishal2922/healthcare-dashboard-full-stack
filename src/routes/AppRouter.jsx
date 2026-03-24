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

  useIdleLogout(isLoggedIn);

  if (!initialized) return <PageLoader />;

  return (
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