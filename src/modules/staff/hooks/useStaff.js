import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  fetchRolesRequest, fetchPermissionsRequest,
  fetchStaffByRoleRequest, assignRoleRequest,
  activateStaffRequest, deactivateStaffRequest,
  clearSelectedRole, clearStaffError,
} from '../staffSlice';
import {
  selectRoles, selectPermissions, selectSelectedRole,
  selectStaffByRole, selectStaffLoading, selectStaffSubmitting,
  selectStaffError, selectRoleOptions,
} from '../selectors';

export default function useStaff() {
  const dispatch = useDispatch();

  const roles        = useSelector(selectRoles);
  const permissions  = useSelector(selectPermissions);
  const selectedRole = useSelector(selectSelectedRole);
  const staffByRole  = useSelector(selectStaffByRole);
  const roleOptions  = useSelector(selectRoleOptions);
  const loading      = useSelector(selectStaffLoading);
  const submitting   = useSelector(selectStaffSubmitting);
  const error        = useSelector(selectStaffError);

  const fetchRoles       = useCallback(() => dispatch(fetchRolesRequest()), [dispatch]);
  const fetchPermissions = useCallback(() => dispatch(fetchPermissionsRequest()), [dispatch]);

  const fetchStaffByRole = useCallback(
    (roleId, params = {}) => dispatch(fetchStaffByRoleRequest({ role_id: roleId, ...params })),
    [dispatch]
  );

  const assignRole = useCallback(
    (staffId, roleId) => dispatch(assignRoleRequest({ staffId, roleId })),
    [dispatch]
  );

  const activateStaff   = useCallback((staffId) => dispatch(activateStaffRequest(staffId)), [dispatch]);
  const deactivateStaff = useCallback((staffId) => dispatch(deactivateStaffRequest(staffId)), [dispatch]);
  const clearRole       = useCallback(() => dispatch(clearSelectedRole()), [dispatch]);
  const dismissError    = useCallback(() => dispatch(clearStaffError()), [dispatch]);

  return {
    roles, permissions, selectedRole, staffByRole, roleOptions,
    loading, submitting, error,
    fetchRoles, fetchPermissions, fetchStaffByRole,
    assignRole, activateStaff, deactivateStaff,
    clearRole, dismissError,
  };
}