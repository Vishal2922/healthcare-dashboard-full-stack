import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '../modules/auth/selectors';

/**
 * ProtectedRoute
 *
 * Wraps any routes that require authentication.
 * Redirects to /login if the user is not logged in,
 * preserving the originally requested path so they can be
 * sent back after a successful login.
 *
 * Usage in AppRouter:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 */
export default function ProtectedRoute() {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location   = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}