import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';

import {
  fetchUsersRequest, fetchAllUsersRequest,
  fetchUserRequest,
  createUserRequest, updateUserRequest,
  deleteUserRequest, toggleUserStatusRequest,
  fetchRolesRequest, fetchDepartmentsRequest,
  clearSelectedUser, clearUsersError, setUsersPage,
} from '../userSlice';

import {
  selectUsers, selectAllUsers, selectAllUsersLoading,
  selectUsersPagination, selectUsersFilters,
  selectSelectedUser, selectUsersLoading, selectUsersSubmitting,
  selectUsersError, selectRoles, selectDepartments,
} from '../selectors';

export default function useUsers() {
  const dispatch = useDispatch();

  const users           = useSelector(selectUsers);
  const allUsers        = useSelector(selectAllUsers);
  const allUsersLoading = useSelector(selectAllUsersLoading);
  const pagination      = useSelector(selectUsersPagination);
  const filters         = useSelector(selectUsersFilters);
  const selectedUser    = useSelector(selectSelectedUser);
  const loading         = useSelector(selectUsersLoading);
  const submitting      = useSelector(selectUsersSubmitting);
  const error           = useSelector(selectUsersError);
  const roles           = useSelector(selectRoles);
  const departments     = useSelector(selectDepartments);

  const fetchUsers      = useCallback((params = {}) => dispatch(fetchUsersRequest(params)),    [dispatch]);
  const fetchAllUsers   = useCallback((params = {}) => dispatch(fetchAllUsersRequest(params)), [dispatch]);
  const fetchUserById   = useCallback((id)          => dispatch(fetchUserRequest(id)),         [dispatch]);
  const createUser      = useCallback((data)        => dispatch(createUserRequest(data)),      [dispatch]);
  const updateUser      = useCallback((data)        => dispatch(updateUserRequest(data)),      [dispatch]);
  const deleteUser      = useCallback((id)          => dispatch(deleteUserRequest(id)),        [dispatch]);

  const toggleStatus = useCallback(
    (id, currentStatus) => dispatch(toggleUserStatusRequest({ id, currentStatus })),
    [dispatch]
  );

  const goToPage = useCallback(
    (page) => { dispatch(setUsersPage(page)); dispatch(fetchUsersRequest({ page })); },
    [dispatch]
  );

  const fetchRoles       = useCallback(() => dispatch(fetchRolesRequest()),       [dispatch]);
  const fetchDepartments = useCallback(() => dispatch(fetchDepartmentsRequest()), [dispatch]);
  const clearUser        = useCallback(() => dispatch(clearSelectedUser()),        [dispatch]);
  const dismissError     = useCallback(() => dispatch(clearUsersError()),         [dispatch]);

  return {
    // Staff table data
    users, pagination, filters, selectedUser,
    loading, submitting, error,
    // All users (for picker dropdown)
    allUsers, allUsersLoading,
    // Reference data
    roles, departments,
    // Actions
    fetchUsers, fetchAllUsers, fetchUserById,
    createUser, updateUser, deleteUser,
    toggleStatus, goToPage,
    fetchRoles, fetchDepartments,
    clearUser, dismissError,
  };
}