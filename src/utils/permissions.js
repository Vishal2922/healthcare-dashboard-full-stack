/**
 * permissions.js — Central RBAC Permission Map
 *
 * Maps every module → action → allowed roles.
 * Roles must match backend role_name values exactly:
 *   Admin | Provider | Nurse | Receptionist | Pharmacist | Patient
 *
 * Usage via hook:
 *   const { can } = usePermission();
 *   can('prescriptions', 'create')  // → true | false
 */

export const ROLES = {
  ADMIN:        'Admin',
  PROVIDER:     'Provider',
  NURSE:        'Nurse',
  RECEPTIONIST: 'Receptionist',
  PHARMACIST:   'Pharmacist',
  PATIENT:      'Patient',
};

export const PERMISSIONS = {

  // Module 8: Patient Management → Provider, Nurse
  patients: {
    view:   ['Provider', 'Nurse'],
    create: ['Provider', 'Nurse'],
    edit:   ['Provider', 'Nurse'],
    delete: ['Admin'],
  },

  // Module 9: Appointment & Scheduling → Doctor (Provider), Nurse
  appointments: {
    view:         ['Provider', 'Nurse'],
    create:       ['Provider', 'Nurse'],
    edit:         ['Provider', 'Nurse'],
    cancel:       ['Provider'],
    updateStatus: ['Provider', 'Nurse'],
  },

  // Module 5: Prescriptions → Provider (create), Pharmacist (dispense), Admin (view)
  prescriptions: {
    view:     ['Admin', 'Provider', 'Pharmacist'],
    create:   ['Provider'],
    update:   ['Provider', 'Pharmacist'],
    dispense: ['Pharmacist'],
  },

  // Module 11: Billing → Admin
  billing: {
    view:         ['Admin'],
    create:       ['Admin'],
    edit:         ['Admin'],
    delete:       ['Admin'],
    updateStatus: ['Admin'],
  },

  // Module 6: User & Staff Management → Admin
  staff: {
    view:         ['Admin'],
    create:       ['Admin'],
    edit:         ['Admin'],
    delete:       ['Admin'],
    toggleActive: ['Admin'],
  },

  users: {
    view:          ['Admin'],
    create:        ['Admin'],
    edit:          ['Admin'],
    delete:        ['Admin'],
    assignRole:    ['Admin'],
    resetPassword: ['Admin'],
  },

  // Module 10: Communication / Notes → Doctor (Provider), Nurse
  communication: {
    view:   ['Provider', 'Nurse'],
    create: ['Provider', 'Nurse'],
    delete: ['Provider'],
  },

  // Module 12: Calendar → Receptionist
  calendar: {
    view: ['Receptionist'],
  },

  // Dashboard
  dashboard: {
    view: ['Admin', 'Provider', 'Pharmacist'],
  },

  // Settings / Security → Admin
  settings: {
    view:   ['Admin'],
    manage: ['Admin'],
  },
};

/**
 * can(module, action, userRole) → boolean
 */
export function can(module, action, userRole) {
  if (!userRole) return false;
  const modulePerms = PERMISSIONS[module];
  if (!modulePerms) return false;
  const allowed = modulePerms[action];
  if (!allowed) return false;
  return allowed.includes(userRole);
}