export const selectUsersState       = (state) => state.users;
export const selectUsers            = (state) => state.users.users;
export const selectAllUsers         = (state) => state.users.allUsers;
export const selectAllUsersLoading  = (state) => state.users.allUsersLoading;
export const selectProviders        = (state) => state.users.providers;
export const selectProvidersLoading = (state) => state.users.providersLoading;
export const selectUsersPagination  = (state) => state.users.pagination;
export const selectUsersFilters     = (state) => state.users.filters;
export const selectSelectedUser     = (state) => state.users.selectedUser;
export const selectUsersLoading     = (state) => state.users.loading;
export const selectUsersSubmitting  = (state) => state.users.submitting;
export const selectUsersError       = (state) => state.users.error;
export const selectRoles            = (state) => state.users.roles;
export const selectDepartments      = (state) => state.users.departments;

export const selectActiveUsers = (state) =>
  state.users.users.filter((u) => u.user_status === 'active' || u.status === 'active');

export const selectUserById = (id) => (state) =>
  state.users.users.find((u) => u.id === id) ?? null;