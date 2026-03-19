export const selectStaffState      = (state) => state.staff;
export const selectRoles           = (state) => state.staff.roles;
export const selectPermissions     = (state) => state.staff.permissions;
export const selectSelectedRole    = (state) => state.staff.selectedRole;
export const selectStaffByRole     = (state) => state.staff.staffByRole;
export const selectStaffLoading    = (state) => state.staff.loading;
export const selectStaffSubmitting = (state) => state.staff.submitting;
export const selectStaffError      = (state) => state.staff.error;

export const selectStaffForRole = (roleId) => (state) =>
  state.staff.staffByRole[roleId] ?? [];

export const selectRoleById = (id) => (state) =>
  state.staff.roles.find((r) => r.id === id) ?? null;

export const selectRoleOptions = (state) =>
  state.staff.roles.map((r) => ({ value: r.id, label: r.role_name ?? r.name }));