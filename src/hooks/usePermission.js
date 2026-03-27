/**
 * usePermission — RBAC Hook
 *
 * Reads the current user's role from Redux auth state
 * and exposes a `can(module, action)` helper.
 *
 * Usage:
 *   const { can, role } = usePermission();
 *   if (can('prescriptions', 'create')) { ... }
 *   if (can('patients', 'delete'))      { ... }
 */
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../modules/auth/selectors';
import { can as canFn } from '../utils/permissions';

export default function usePermission() {
  const role = useSelector(selectUserRole);

  const can = useCallback(
    (module, action) => canFn(module, action, role),
    [role]
  );

  return { can, role };
}