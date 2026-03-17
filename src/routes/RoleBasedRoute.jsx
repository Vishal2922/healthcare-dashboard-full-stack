import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../modules/auth/selectors';

/**
 * RoleBasedRoute
 *
 * Restricts access to routes based on the authenticated user's role.
 * Must be nested inside <ProtectedRoute> (assumes user is already authenticated).
 *
 * Backend roles: Admin | Provider | Nurse | Receptionist | Pharmacist | Patient
 *
 * Usage in AppRouter:
 *   <Route element={<RoleBasedRoute roles={['Admin', 'Provider']} />}>
 *     <Route path="/billing" element={<InvoicePage />} />
 *   </Route>
 *
 * @param {string[]} roles - Allowed role names (must match backend role_name values exactly)
 */
export default function RoleBasedRoute({ roles = [] }) {
  const userRole = useSelector(selectUserRole);

  if (!roles.includes(userRole)) {
    // Unauthorized role → redirect to dashboard (not logout)
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}