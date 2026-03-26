import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';

import {
  fetchUsersRequest, fetchAllUsersRequest,
  fetchUserRequest,
  createUserRequest, updateUserRequest,
  deleteUserRequest, toggleUserStatusRequest,
  fetchRolesRequest, fetchDepartmentsRequest,
  fetchProvidersRequest,
  setUsersPage,
  clearUsersError,
  clearSelectedUser,
} from '../userSlice';
import { fetchAllPatientsRequest } from '../../patients/patientSlice';
import {
  selectUsers, selectAllUsers, selectAllUsersLoading,
  selectUsersPagination, selectUsersFilters,
  selectSelectedUser, selectUsersLoading, selectUsersSubmitting,
  selectUsersError, selectRoles, selectDepartments,
  selectProviders, selectProvidersLoading,
} from '../selectors';
import { selectAllPatients, selectAllPatientsLoading } from '../../patients/patientSlice';

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
  const providers       = useSelector(selectProviders);
  const providersLoading= useSelector(selectProvidersLoading);
  const allPatients     = useSelector(selectAllPatients);
  const allPatientsLoading = useSelector(selectAllPatientsLoading);

  const fetchUsers      = useCallback((params = {}) => dispatch(fetchUsersRequest(params)),    [dispatch]);
  const fetchAllUsers   = useCallback((params = {}) => dispatch(fetchAllUsersRequest(params)), [dispatch]);
  const fetchProviders  = useCallback(()            => dispatch(fetchProvidersRequest()),      [dispatch]);
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
  const fetchAllPatients = useCallback(() => dispatch(fetchAllPatientsRequest()), [dispatch]);
  const clearUser        = useCallback(() => dispatch(clearSelectedUser()),        [dispatch]);
  const dismissError     = useCallback(() => dispatch(clearUsersError()),         [dispatch]);

  return {
    // Staff table data
    users, pagination, filters, selectedUser,
    loading, submitting, error,
    // All users (for picker dropdown)
    allUsers, allUsersLoading,
    // Providers (for patient dropdown)
    providers, providersLoading,
    // Reference data
    roles, departments, allPatients, allPatientsLoading,
    // Actions
    fetchUsers, fetchAllUsers, fetchProviders, fetchUserById,
    createUser, updateUser, deleteUser,
    toggleStatus, goToPage,
    fetchRoles, fetchDepartments, fetchAllPatients,
    clearUser, dismissError,
  };
}