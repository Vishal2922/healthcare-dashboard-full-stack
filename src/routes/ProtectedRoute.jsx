import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '../modules/auth/selectors';
import DashboardLayout from '../components/layout/DashboardLayout';

/**
 * ProtectedRoute
 *
 * Wraps any routes that require authentication.
 * Redirects to /login if the user is not logged in,
 * preserving the originally requested path so they can be
 * sent back after a successful login.
 *
 * Also mounts DashboardLayout here so Sidebar + Navbar stay
 * permanently rendered during all page navigations — they never
 * unmount or flicker when the route changes.
 */
export default function ProtectedRoute() {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location   = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}