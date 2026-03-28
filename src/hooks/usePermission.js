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